/*
 * PatchMyROM patch-apply worker.
 *
 * Wraps marcrobledo/RomPatcher.js (MIT license, vendored unmodified under
 * /vendor/rom-patcher-js/) to apply IPS, UPS, BPS, and xdelta/VCDIFF
 * patches entirely client-side. This worker never uploads any file — it
 * only reads the File objects it receives via postMessage and returns a
 * patched Uint8Array back to the main thread.
 *
 * Everything here is glue/orchestration around the vendored library:
 * chunked file reads (for real progress reporting on large NDS ROMs), a
 * proactive checksum pre-check, a post-apply output re-verification, a
 * smart filename override for formats with embedded titles, and the
 * postMessage protocol. No patch format algorithm is implemented in this
 * file.
 */

self.importScripts(
  "/vendor/rom-patcher-js/RomPatcher.js",
  "/vendor/rom-patcher-js/modules/BinFile.js",
  "/vendor/rom-patcher-js/modules/HashCalculator.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.ips.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.aps_n64.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.aps_gba.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.ups.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.bps.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.rup.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.ppf.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.bdf.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.pmsr.js",
  "/vendor/rom-patcher-js/modules/RomPatcher.format.vcdiff.js"
);

var CHUNK_SIZE = 8 * 1024 * 1024; // 8MB — real progress granularity for 32-512MB NDS ROMs

/** Reads a File/Blob into a Uint8Array in chunks, reporting real byte progress. */
function readFileChunked(file, stage, onProgress) {
  var total = file.size;
  var out = new Uint8Array(total);
  var offset = 0;

  function readNext() {
    if (offset >= total) return Promise.resolve(out);
    var end = Math.min(offset + CHUNK_SIZE, total);
    return file
      .slice(offset, end)
      .arrayBuffer()
      .then(function (buf) {
        out.set(new Uint8Array(buf), offset);
        offset = end;
        onProgress({ type: "progress", stage: stage, loaded: offset, total: total });
        return readNext();
      });
  }

  // always emit one progress event even for zero-byte reads / instant chunks
  onProgress({ type: "progress", stage: stage, loaded: 0, total: total });
  return total === 0 ? Promise.resolve(out) : readNext();
}

function crc32ToHex(value) {
  if (typeof value !== "number") return null;
  var hex = (value >>> 0).toString(16);
  while (hex.length < 8) hex = "0" + hex;
  return hex;
}

function sanitizeFileName(name) {
  var cleaned = name.replace(/[\/\\:*?"<>|]/g, "").trim();
  if (cleaned.length > 120) cleaned = cleaned.slice(0, 120).trim();
  return cleaned || "patched";
}

self.onmessage = function (event) {
  var data = event.data;
  if (!data || data.type !== "patch") return;

  var romFile = data.romFile;
  var patchFile = data.patchFile;
  var options = data.options || {};
  var knownRomCrc32 = data.romCrc32 || null;

  function postProgress(message) {
    self.postMessage(message);
  }

  readFileChunked(romFile, "reading-rom", postProgress)
    .then(function (romU8) {
      return readFileChunked(patchFile, "reading-patch", postProgress).then(function (patchU8) {
        return { romU8: romU8, patchU8: patchU8 };
      });
    })
    .then(function (result) {
      self.postMessage({ type: "progress", stage: "validating", loaded: 0, total: 0 });

      var romBin = new BinFile(result.romU8);
      romBin.fileName = romFile.name;
      romBin.fileType = romFile.type || "application/octet-stream";

      var patchBin = new BinFile(result.patchU8);
      patchBin.fileName = patchFile.name;
      patchBin.fileType = patchFile.type || "application/octet-stream";

      var patch = RomPatcher.parsePatchFile(patchBin);
      if (!patch) {
        throw new Error(
          "Unrecognized patch file format. Supported formats: IPS, UPS, BPS, and xdelta/VCDIFF."
        );
      }

      // Proactive pre-check using the already-computed ROM CRC32 (from the
      // analysis worker) — a plain string comparison, no re-hashing. Only
      // runs when we actually have that value and the format declares a
      // source checksum; otherwise this is skipped entirely and the
      // library's own requireValidation check (below, inside applyPatch)
      // remains the sole, authoritative gate.
      var declaredSourceChecksum =
        typeof patch.checksumInput === "number"
          ? crc32ToHex(patch.checksumInput)
          : typeof patch.sourceChecksum === "number"
            ? crc32ToHex(patch.sourceChecksum)
            : null;
      if (knownRomCrc32 && declaredSourceChecksum && knownRomCrc32.toLowerCase() !== declaredSourceChecksum.toLowerCase()) {
        throw new Error(
          "This ROM does not appear to match the patch's expected base ROM (checksum mismatch). Double-check the region/revision, or that the file doesn't have an extra header."
        );
      }

      var titleFromPatch =
        typeof patch.description === "string" && patch.description.trim() ? patch.description.trim() : null;

      self.postMessage({ type: "progress", stage: "patching", loaded: 0, total: 0 });
      var patchedRom = RomPatcher.applyPatch(romBin, patch, options);

      self.postMessage({ type: "progress", stage: "verifying-output", loaded: 0, total: 0 });
      var declaredTargetChecksum =
        typeof patch.checksumOutput === "number"
          ? crc32ToHex(patch.checksumOutput)
          : typeof patch.targetChecksum === "number"
            ? crc32ToHex(patch.targetChecksum)
            : null;
      var outputVerified = null;
      if (declaredTargetChecksum) {
        var actualChecksum = crc32ToHex(patchedRom.hashCRC32());
        outputVerified = actualChecksum === declaredTargetChecksum;
      }

      if (titleFromPatch) {
        var extMatch = patchedRom.fileName.match(/\.\w+$/i);
        patchedRom.fileName = sanitizeFileName(titleFromPatch) + (extMatch ? extMatch[0] : "");
      }

      self.postMessage({ type: "progress", stage: "preparing-download", loaded: 0, total: 0 });

      self.postMessage(
        {
          type: "success",
          patchedRomU8Array: patchedRom._u8array,
          fileName: patchedRom.fileName,
          outputVerified: outputVerified,
        },
        [patchedRom._u8array.buffer]
      );
    })
    .catch(function (err) {
      self.postMessage({
        type: "error",
        message: err && err.message ? err.message : "Patching failed for an unknown reason.",
      });
    });
};
