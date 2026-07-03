/*
 * PatchMyROM file-analysis worker.
 *
 * Computes ROM hashes (CRC32/MD5 via the vendored RomPatcher.js
 * HashCalculator, SHA-1/SHA-256 via the native Web Crypto API) and detects
 * patch format/metadata (via RomPatcher.parsePatchFile's existing magic-byte
 * auto-detection). Nothing here reimplements any patching or hashing
 * algorithm — CRC32/MD5 come from the vendored library, SHA-1/SHA-256 come
 * from the browser's own crypto.subtle. No file is ever uploaded; this
 * worker only reads the File objects it receives via postMessage.
 *
 * Kept as a separate worker from rom-patcher-worker.js on purpose: this one
 * is long-lived and fires on file *selection*, while the patch worker is
 * recreated fresh on every Apply click — different lifecycles, different
 * message protocols, mixing them would couple unrelated concerns.
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

var CHUNK_SIZE = 8 * 1024 * 1024; // 8MB

/** Reads a File/Blob into a Uint8Array in chunks, reporting real byte progress. */
function readFileChunked(file, onProgress) {
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
        onProgress(offset, total);
        return readNext();
      });
  }

  onProgress(0, total);
  return total === 0 ? Promise.resolve(out) : readNext();
}

function toHex(buffer) {
  var bytes = new Uint8Array(buffer);
  var hex = "";
  for (var i = 0; i < bytes.length; i++) {
    hex += bytes[i] < 16 ? "0" + bytes[i].toString(16) : bytes[i].toString(16);
  }
  return hex;
}

function crc32Hex(u8array) {
  var value = HashCalculator.crc32(u8array.buffer) >>> 0;
  var hex = value.toString(16);
  while (hex.length < 8) hex = "0" + hex;
  return hex;
}

var EXTENSION_TO_PLATFORM = {
  gba: "Game Boy Advance",
  nds: "Nintendo DS",
  sfc: "SNES",
  smc: "SNES",
  swc: "SNES",
  fig: "SNES",
  nes: "NES",
  fds: "NES (Famicom Disk System)",
  gb: "Game Boy",
  gbc: "Game Boy Color",
  n64: "Nintendo 64",
  z64: "Nintendo 64",
  v64: "Nintendo 64",
  md: "Sega Genesis / Mega Drive",
  gen: "Sega Genesis / Mega Drive",
  sms: "Sega Master System",
  gg: "Sega Game Gear",
  gba3ds: "Nintendo 3DS",
  "3ds": "Nintendo 3DS",
  iso: "Disc image",
  bin: "Disc image / Sega Genesis",
};

var INES_MAGIC = [0x4e, 0x45, 0x53, 0x1a]; // "NES\x1A"

function getExtension(fileName) {
  var match = /\.([a-z0-9]+)$/i.exec(fileName || "");
  return match ? match[1].toLowerCase() : "";
}

function detectPlatform(fileName, u8array) {
  var extension = getExtension(fileName);
  var platform = EXTENSION_TO_PLATFORM[extension] || null;
  var detectionMethod = "extension";

  if (extension === "nes" && u8array.length >= 4) {
    var matchesInes =
      u8array[0] === INES_MAGIC[0] &&
      u8array[1] === INES_MAGIC[1] &&
      u8array[2] === INES_MAGIC[2] &&
      u8array[3] === INES_MAGIC[3];
    if (matchesInes) detectionMethod = "extension+magic";
  }

  return { extension: extension, platform: platform, detectionMethod: detectionMethod };
}

function analyzeRom(requestId, cacheKey, file) {
  return readFileChunked(file, function (loaded, total) {
    self.postMessage({ type: "rom-progress", requestId: requestId, loaded: loaded, total: total });
  }).then(function (u8array) {
    var buffer = u8array.buffer;
    return Promise.all([
      Promise.resolve(crc32Hex(u8array)),
      Promise.resolve(HashCalculator.md5(buffer)),
      self.crypto.subtle.digest("SHA-1", buffer).then(toHex),
      self.crypto.subtle.digest("SHA-256", buffer).then(toHex),
    ]).then(function (hashes) {
      var platformInfo = detectPlatform(file.name, u8array);
      self.postMessage({
        type: "rom-result",
        requestId: requestId,
        cacheKey: cacheKey,
        data: {
          fileName: file.name,
          fileSize: file.size,
          extension: platformInfo.extension,
          platform: platformInfo.platform,
          detectionMethod: platformInfo.detectionMethod,
          crc32: hashes[0],
          md5: hashes[1],
          sha1: hashes[2],
          sha256: hashes[3],
        },
      });
    });
  });
}

function describePatch(patchBin) {
  var patch = RomPatcher.parsePatchFile(patchBin);
  if (!patch) {
    return { recognized: false, format: null, title: null, sourceSize: null, targetSize: null, sourceChecksumCRC32: null, targetChecksumCRC32: null, canValidateSource: false };
  }

  var formatName = (patch.constructor && patch.constructor.name) || null;
  var result = {
    recognized: true,
    format: formatName,
    title: null,
    sourceSize: null,
    targetSize: null,
    sourceChecksumCRC32: null,
    targetChecksumCRC32: null,
    canValidateSource: typeof patch.validateSource === "function",
  };

  if (typeof patch.sizeInput === "number") {
    // UPS
    result.sourceSize = patch.sizeInput;
    result.targetSize = patch.sizeOutput;
    result.sourceChecksumCRC32 = crc32ToHex(patch.checksumInput);
    result.targetChecksumCRC32 = crc32ToHex(patch.checksumOutput);
  } else if (typeof patch.sourceSize === "number") {
    // BPS
    result.sourceSize = patch.sourceSize;
    result.targetSize = patch.targetSize;
    result.sourceChecksumCRC32 = crc32ToHex(patch.sourceChecksum);
    result.targetChecksumCRC32 = crc32ToHex(patch.targetChecksum);
  }

  if (typeof patch.description === "string" && patch.description.trim()) {
    result.title = patch.description.trim();
  }

  return result;
}

function crc32ToHex(value) {
  if (typeof value !== "number") return null;
  var hex = (value >>> 0).toString(16);
  while (hex.length < 8) hex = "0" + hex;
  return hex;
}

function analyzePatch(requestId, cacheKey, file) {
  return readFileChunked(file, function (loaded, total) {
    self.postMessage({ type: "patch-progress", requestId: requestId, loaded: loaded, total: total });
  }).then(function (u8array) {
    var patchBin = new BinFile(u8array);
    patchBin.fileName = file.name;
    patchBin.fileType = file.type || "application/octet-stream";

    var meta = describePatch(patchBin);
    self.postMessage({
      type: "patch-result",
      requestId: requestId,
      cacheKey: cacheKey,
      data: {
        fileName: file.name,
        fileSize: file.size,
        recognized: meta.recognized,
        format: meta.format,
        title: meta.title,
        sourceSize: meta.sourceSize,
        targetSize: meta.targetSize,
        sourceChecksumCRC32: meta.sourceChecksumCRC32,
        targetChecksumCRC32: meta.targetChecksumCRC32,
        canValidateSource: meta.canValidateSource,
      },
    });
  });
}

self.onmessage = function (event) {
  var data = event.data;
  if (!data) return;

  if (data.type === "analyze-rom") {
    analyzeRom(data.requestId, data.cacheKey, data.file).catch(function (err) {
      self.postMessage({
        type: "error",
        requestId: data.requestId,
        lane: "rom",
        message: (err && err.message) || "Could not analyze this ROM file.",
      });
    });
  } else if (data.type === "analyze-patch") {
    analyzePatch(data.requestId, data.cacheKey, data.file).catch(function (err) {
      self.postMessage({
        type: "error",
        requestId: data.requestId,
        lane: "patch",
        message: (err && err.message) || "Could not analyze this patch file.",
      });
    });
  }
};
