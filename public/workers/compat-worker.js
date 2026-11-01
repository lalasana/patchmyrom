/*
 * PatchMyROM compatibility worker (ROM & Patch Compatibility Checker).
 *
 * Given an original ROM and a patch file it reports whether the two belong together — without
 * applying anything and without uploading anything. It reuses, rather than re-implements:
 *   - the vendored RomPatcher.js parsers (to read the patch format and the validation data it
 *     embeds) and RomPatcher.isRomHeadered / removeHeader (the exact copier-header rules the real
 *     patcher uses, so this check cannot disagree with the Apply step),
 *   - PatchCompat (patch-compat.js): the same UPS/BPS classifier and patch pre-flight checks the
 *     analysis and patch workers run,
 *   - the library's own validateSource() for RUP / APS / PMSR patches,
 *   - VcdiffSecondary.inspect() for a structural check of xdelta patches.
 * The ROM is streamed through CRC32 in chunks; it is only loaded fully into memory for the few
 * patch formats whose validation needs random access to it (RUP, APS, PMSR), and then only up to
 * RomToolkit.WHOLE_ROM_LIMIT (256 MB); a bigger ROM gets an explanatory "cannot verify" instead.
 */

self.importScripts(
  "/workers/patch-compat.js",
  "/workers/stream-hash.js",
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
  "/vendor/rom-patcher-js/modules/RomPatcher.format.vcdiff.js",
  "/workers/rom-toolkit.js"
);

var CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

function crc32ToHex(value) {
  if (typeof value !== "number") return null;
  var hex = (value >>> 0).toString(16);
  while (hex.length < 8) hex = "0" + hex;
  return hex;
}

/** Reads a (small) patch file fully into memory, reporting real byte progress. */
function readWhole(file, lane, requestId) {
  var total = file.size;
  var out = new Uint8Array(total);
  var offset = 0;
  function next() {
    if (offset >= total) return Promise.resolve(out);
    var end = Math.min(offset + CHUNK_SIZE, total);
    return file
      .slice(offset, end)
      .arrayBuffer()
      .then(function (buffer) {
        out.set(new Uint8Array(buffer), offset);
        offset = end;
        self.postMessage({ type: "compat-progress", requestId: requestId, lane: lane, loaded: offset, total: total });
        return next();
      });
  }
  self.postMessage({ type: "compat-progress", requestId: requestId, lane: lane, loaded: 0, total: total });
  return next();
}

/**
 * Reads the patch's embedded facts. Mirrors describePatch() in analysis-worker.js (kept in step by a
 * regression test that runs both on the same fixtures) but also hands back the parsed patch object so
 * its validateSource() can be used.
 */
function parsePatch(u8, fileName) {
  var patchBin = new BinFile(u8);
  patchBin.fileName = fileName;
  var patch = RomPatcher.parsePatchFile(patchBin);
  if (!patch) return { recognized: false };
  var meta = {
    recognized: true,
    format: (patch.constructor && patch.constructor.name) || null,
    title: null,
    sourceSize: null,
    targetSize: null,
    sourceCrc32: null,
    targetCrc32: null,
    object: patch,
  };
  if (typeof patch.sizeInput === "number") {
    meta.sourceSize = patch.sizeInput; // UPS
    meta.targetSize = patch.sizeOutput;
    meta.sourceCrc32 = crc32ToHex(patch.checksumInput);
    meta.targetCrc32 = crc32ToHex(patch.checksumOutput);
  } else if (typeof patch.sourceSize === "number") {
    meta.sourceSize = patch.sourceSize; // BPS
    meta.targetSize = patch.targetSize;
    meta.sourceCrc32 = crc32ToHex(patch.sourceChecksum);
    meta.targetCrc32 = crc32ToHex(patch.targetChecksum);
  }
  if (typeof patch.description === "string" && patch.description.trim()) meta.title = patch.description.trim();
  // An APS patch in its plain (non-N64) mode records nothing about the ROM it was made for.
  if (meta.format === "APS" && patch.headerType !== 1) meta.noValidation = true;
  return meta;
}

/**
 * Streams the ROM once: CRC32 of the whole file, CRC32 of the file with a recognised copier header set
 * aside, the first bytes (for header-based platform detection) and, only when asked, the whole file.
 */
function scanRom(file, requestId, keepWholeFile) {
  var total = file.size;
  var ext = (/\.(\w+)$/.exec(file.name.toLowerCase()) || [null, ""])[1];
  // The library's own rule for "this ROM carries a copier header" (reads only size + extension).
  var headerInfo = RomPatcher.isRomHeadered({ fileSize: total, getExtension: function () { return ext; } });
  var crcWhole = StreamHash.createCrc32();
  var crcHeaderless = headerInfo ? StreamHash.createCrc32() : null;
  var head = new Uint8Array(Math.min(total, RomToolkit.HEAD_BYTES));
  var whole = keepWholeFile ? new Uint8Array(total) : null;
  var offset = 0;

  function next() {
    if (offset >= total) return Promise.resolve();
    var end = Math.min(offset + CHUNK_SIZE, total);
    return file
      .slice(offset, end)
      .arrayBuffer()
      .then(function (buffer) {
        var chunk = new Uint8Array(buffer);
        if (offset < head.length) head.set(chunk.subarray(0, Math.min(chunk.length, head.length - offset)), offset);
        if (whole) whole.set(chunk, offset);
        crcWhole.update(chunk);
        if (crcHeaderless) {
          var skip = headerInfo.size - offset; // bytes of the header still inside this chunk
          if (skip <= 0) crcHeaderless.update(chunk);
          else if (skip < chunk.length) crcHeaderless.update(chunk.subarray(skip));
        }
        offset = end;
        self.postMessage({ type: "compat-progress", requestId: requestId, lane: "rom", loaded: offset, total: total });
        return next();
      });
  }

  function readProbes() {
    var probes = [];
    var chain = Promise.resolve();
    RomToolkit.EXTRA_PROBES.forEach(function (probe) {
      if (total < probe.offset + 1) return;
      chain = chain.then(function () {
        return file
          .slice(probe.offset, Math.min(total, probe.offset + probe.length))
          .arrayBuffer()
          .then(function (buffer) {
            probes.push({ offset: probe.offset, bytes: new Uint8Array(buffer) });
          });
      });
    });
    return chain.then(function () {
      return probes;
    });
  }

  self.postMessage({ type: "compat-progress", requestId: requestId, lane: "rom", loaded: 0, total: total });
  return next()
    .then(readProbes)
    .then(function (probes) {
      return {
        fileName: file.name,
        size: total,
        crc32: crcWhole.digest(),
        headerless: headerInfo
          ? { name: headerInfo.name, headerSize: headerInfo.size, size: total - headerInfo.size, crc32: crcHeaderless.digest() }
          : null,
        head: head,
        probes: probes,
        whole: whole,
      };
    });
}

/**
 * Runs the patching library's own validation for formats that have one beyond UPS/BPS.
 * Tries the ROM as it is, then — only if the library recognises a copier header — without it,
 * exactly like the real patcher does.
 */
function runLibraryValidation(patchMeta, romScan) {
  var kind = RomToolkit.kindFor(patchMeta);
  if (kind !== "md5" && kind !== "header" && kind !== "blocks" && kind !== "fixed") return null;
  if (typeof patchMeta.object.validateSource !== "function" || !romScan.whole) return null;

  var romBin = new BinFile(romScan.whole);
  romBin.fileName = romScan.fileName;
  var attempts = [{ bin: romBin, viaHeader: false }];
  if (romScan.headerless) {
    var split = RomPatcher.removeHeader(romBin);
    if (split && split.rom) attempts.push({ bin: split.rom, viaHeader: true });
  }
  for (var i = 0; i < attempts.length; i++) {
    var result = patchMeta.object.validateSource(attempts[i].bin);
    if (result) {
      return { kind: kind, ok: true, undo: !!(result && result.undo), viaHeader: attempts[i].viaHeader };
    }
  }
  return { kind: kind, ok: false };
}

function check(requestId, romFile, patchFile, limits) {
  var wholeRomLimit = limits && typeof limits.wholeRomBytes === "number" ? limits.wholeRomBytes : RomToolkit.WHOLE_ROM_LIMIT;
  var patchProblem = null;
  var patchMeta = { recognized: false };
  var patchBytes = null;

  return readWhole(patchFile, "patch", requestId)
    .then(function (u8) {
      patchBytes = u8;
      var preflight = PatchCompat.preflightPatch(u8);
      if (!preflight.ok) {
        patchProblem = { code: preflight.code, message: preflight.message };
        return;
      }
      try {
        // xdelta/VCDIFF: structural scan only (no decompression); flags damaged patches and unsupported secondary compression.
        if (VcdiffSecondary.isVcdiff(u8)) VcdiffSecondary.inspect(u8);
        patchMeta = parsePatch(u8, patchFile.name);
      } catch (err) {
        var explained = PatchCompat.explainError(err);
        patchProblem = { code: (err && err.code) || explained.code, message: explained.message };
      }
    })
    .then(function () {
      var kind = RomToolkit.kindFor(patchMeta);
      var needsWholeRom = !patchProblem && (kind === "md5" || kind === "header" || kind === "blocks" || kind === "fixed");
      var tooLarge = needsWholeRom && romFile.size > wholeRomLimit;
      return scanRom(romFile, requestId, needsWholeRom && !tooLarge).then(function (scan) {
        scan.tooLargeForValidation = tooLarge;
        return scan;
      });
    })
    .then(function (romScan) {
      var validation = null;
      if (!patchProblem && patchMeta.recognized) {
        validation = romScan.tooLargeForValidation
          ? { kind: RomToolkit.kindFor(patchMeta), ok: null, skipped: "too-large", limit: wholeRomLimit }
          : runLibraryValidation(patchMeta, romScan);
      }
      var platform = RomToolkit.detectPlatform({ fileName: romFile.name, size: romScan.size, head: romScan.head, probes: romScan.probes });

      var rom = { fileName: romScan.fileName, size: romScan.size, crc32: romScan.crc32, headerless: romScan.headerless, platform: platform };
      var patch = {
        fileName: patchFile.name,
        size: patchFile.size,
        recognized: !!patchMeta.recognized,
        format: patchMeta.format || null,
        title: patchMeta.title || null,
        sourceSize: patchMeta.sourceSize === undefined ? null : patchMeta.sourceSize,
        targetSize: patchMeta.targetSize === undefined ? null : patchMeta.targetSize,
        sourceCrc32: patchMeta.sourceCrc32 || null,
        targetCrc32: patchMeta.targetCrc32 || null,
        noValidation: !!patchMeta.noValidation,
        ips: patchMeta.format === "IPS" && patchBytes ? RomToolkit.scanIps(patchBytes) : null,
        problem: patchProblem,
      };
      var report = RomToolkit.buildCompatReport({ rom: rom, patch: patch, validation: validation });

      self.postMessage({ type: "compat-result", requestId: requestId, data: { rom: rom, patch: patch, report: report } });
    });
}

self.onmessage = function (event) {
  var data = event.data;
  if (!data || data.type !== "check-compat") return;
  check(data.requestId, data.rom, data.patch, data.limits).catch(function (err) {
    var explained = PatchCompat.explainError(err);
    self.postMessage({
      type: "error",
      requestId: data.requestId,
      code: explained.code,
      message:
        err && err.name === "RangeError"
          ? explained.message
          : (err && (err.name === "NotReadableError" || err.name === "NotFoundError")
              ? "The browser couldn't read one of the files. If it is on a network or cloud drive, copy it to your device first."
              : explained.message) || "Could not check these files.",
    });
  });
};
