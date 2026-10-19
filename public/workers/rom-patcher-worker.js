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
 * compatibility gate (patch-compat.js: compatible / already patched / wrong
 * ROM) in front of the library's own requireValidation check, a post-apply
 * output verification that fails closed, a smart filename override for formats
 * with embedded titles, and the postMessage protocol. No patch format
 * algorithm is implemented in this file.
 */

self.importScripts(
  "/workers/patch-compat.js",
  "/workers/vcdiff-secondary.js",
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

/** Error carrying a machine-readable `code` alongside the user-facing message. */
function coded(code, message) {
  var err = new Error(message);
  err.code = code;
  return err;
}

/** Source/target size and CRC32 a patch declares, normalised across BPS and UPS. */
function declaredChecksums(patch) {
  var sourceCrc, targetCrc, sourceSize, targetSize;
  if (typeof patch.checksumInput === "number") {
    // UPS
    sourceCrc = patch.checksumInput;
    targetCrc = patch.checksumOutput;
    sourceSize = patch.sizeInput;
    targetSize = patch.sizeOutput;
  } else if (typeof patch.sourceChecksum === "number") {
    // BPS
    sourceCrc = patch.sourceChecksum;
    targetCrc = patch.targetChecksum;
    sourceSize = patch.sourceSize;
    targetSize = patch.targetSize;
  }
  return {
    sourceCrc32: typeof sourceCrc === "number" ? crc32ToHex(sourceCrc) : null,
    targetCrc32: typeof targetCrc === "number" ? crc32ToHex(targetCrc) : null,
    sourceSize: typeof sourceSize === "number" ? sourceSize : null,
    targetSize: typeof targetSize === "number" ? targetSize : null,
  };
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

      // BPS and UPS parsers in the vendored library spin forever on a patch
      // truncated inside its header; reject damaged files before they get there.
      var preflight = PatchCompat.preflightPatch(result.patchU8);
      if (!preflight.ok) throw coded(preflight.code, preflight.message);

      // xdelta/VCDIFF: validate the structure and, for LZMA-compressed patches, decode the
      // secondary compression into an equivalent plain VCDIFF that the vendored decoder
      // applies unchanged. Plain patches pass through untouched (same array, no copy).
      var vcdiff = null;
      var patchBytes = result.patchU8;
      if (VcdiffSecondary.isVcdiff(patchBytes)) {
        vcdiff = VcdiffSecondary.prepare(patchBytes);
        patchBytes = vcdiff.plain;
        result.patchU8 = null; // let the compressed copy be collected
      }

      var patchBin = new BinFile(patchBytes);
      patchBin.fileName = patchFile.name;
      patchBin.fileType = patchFile.type || "application/octet-stream";

      var patch = RomPatcher.parsePatchFile(patchBin);
      if (!patch) {
        throw coded(
          "patch-unrecognized",
          "Unrecognized patch file format. Supported formats: IPS, UPS, BPS, and xdelta/VCDIFF."
        );
      }

      var declared = declaredChecksums(patch);

      // Compatibility gate. For formats that declare the checksum of the ROM they were
      // made for (BPS, UPS) this classifies the ROM as the right original, the already
      // finished result, or the wrong file — and stops with ONE explanation for the last
      // two. It runs in front of, never instead of, the library's requireValidation
      // check inside applyPatch, which stays the authoritative gate.
      var romHeaderInfo = options.removeHeader ? RomPatcher.isRomHeadered(romBin) : null;
      if (declared.sourceCrc32) {
        var romCrc32 = knownRomCrc32 || crc32ToHex(HashCalculator.crc32(result.romU8.buffer));
        var verdict = PatchCompat.classify({
          rom: {
            size: result.romU8.length,
            crc32: romCrc32,
            headerless: romHeaderInfo
              ? {
                  name: romHeaderInfo.name,
                  headerSize: romHeaderInfo.size,
                  size: result.romU8.length - romHeaderInfo.size,
                  crc32: crc32ToHex(HashCalculator.crc32(result.romU8.buffer, romHeaderInfo.size)),
                }
              : null,
          },
          patch: {
            sourceSize: declared.sourceSize,
            targetSize: declared.targetSize,
            sourceCrc32: declared.sourceCrc32,
            targetCrc32: declared.targetCrc32,
          },
        });
        if (verdict.blocking) throw coded(verdict.code, PatchCompat.toPlainText(verdict));
      }

      // A patch that promises an exact output checksum defines the output byte for byte;
      // the library's post-patch header "fix-up" (Game Boy / Mega Drive) would silently
      // rewrite those bytes and make a correct result look corrupted.
      if (declared.targetCrc32) options = Object.assign({}, options, { fixChecksum: false });
      // Same for an xdelta patch carrying Adler-32 checksums of its output windows.
      var vcdiffVerifiable = vcdiff !== null && vcdiff.info.adlerWindows > 0;
      if (vcdiffVerifiable) options = Object.assign({}, options, { fixChecksum: false });

      var titleFromPatch =
        typeof patch.description === "string" && patch.description.trim() ? patch.description.trim() : null;

      self.postMessage({ type: "progress", stage: "patching", loaded: 0, total: 0 });
      var patchedRom;
      try {
        patchedRom = RomPatcher.applyPatch(romBin, patch, options);
      } catch (applyErr) {
        // The vendored xdelta decoder indexes past the end of its buffers on instruction streams
        // that are inconsistent with the ROM or the patch; report that instead of a raw TypeError.
        if (vcdiff && applyErr && !applyErr.code && applyErr instanceof RangeError && /allocat|array buffer|invalid (typed )?array length/i.test(applyErr.message)) {
          throw VcdiffSecondary.outOfMemoryError(vcdiff.info.targetSize);
        }
        if (vcdiff && applyErr && !applyErr.code && (applyErr instanceof TypeError || applyErr instanceof RangeError)) {
          throw coded(
            "patch-corrupt",
            "This xdelta patch couldn't be applied: its instructions don't fit the ROM you selected. This usually means the ROM isn't the exact original the patch was made for; it can also mean the patch file is damaged."
          );
        }
        throw applyErr;
      }

      self.postMessage({ type: "progress", stage: "verifying-output", loaded: 0, total: 0 });
      var outputVerified = null;
      var verification = null; // {checked, total} windows for xdelta; null for formats with one whole-file checksum, or none
      if (declared.targetCrc32) {
        // If the library set a copier header aside and put it back, the patch's checksum
        // covers the header-less part only.
        var headerBytes = romHeaderInfo ? romHeaderInfo.size : 0;
        var actualChecksum = crc32ToHex(
          PatchCompat.crc32Bytes(patchedRom._u8array, headerBytes, patchedRom._u8array.length)
        );
        outputVerified = actualChecksum === declared.targetCrc32;
        if (!outputVerified) {
          // Never hand over a file that isn't what the patch promised.
          throw coded(
            "output-mismatch",
            "The patched result didn't match the checksum this patch promises (expected CRC32 " +
              PatchCompat.showCrc(declared.targetCrc32) +
              ", got " +
              PatchCompat.showCrc(actualChecksum) +
              "), so it was discarded instead of offered for download. The patch file may be damaged — try downloading it again."
          );
        }
      }

      if (vcdiffVerifiable) {
        // Every window's Adler-32 must match the patched bytes (a copier header the library put
        // back in front is skipped). A mismatch means a wrong source ROM or a damaged patch.
        var vcdiffOffset = romHeaderInfo ? romHeaderInfo.size : 0;
        var vr = VcdiffSecondary.verifyOutput(patchBytes, patchedRom._u8array, vcdiffOffset);
        verification = { checked: vr.checked, total: vr.windows };
        // "verified" only when EVERY window carries a checksum and matched; otherwise the result is
        // reported as partly / not verified (a mismatch has already thrown above).
        outputVerified = vr.checked === vr.windows ? true : null;
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
          verification: verification,
        },
        [patchedRom._u8array.buffer]
      );
    })
    .catch(function (err) {
      var explained = err && err.code ? { code: err.code, message: err.message } : PatchCompat.explainError(err);
      self.postMessage({
        type: "error",
        code: explained.code,
        message: explained.message || "Patching failed for an unknown reason.",
      });
    });
};
