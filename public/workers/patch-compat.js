/*
 * PatchMyROM patch/ROM compatibility classifier.
 *
 * Pure functions only — no DOM, no worker APIs, no file I/O — so exactly the same code
 * runs in three places: the analysis worker (pre-flight), the patch worker (the gate in
 * front of the vendored RomPatcher.js), and the main-thread UI (via lib/patch-compat.ts).
 * It is also loaded directly by the Node regression tests in /tests.
 *
 * Nothing here applies a patch or bypasses a checksum. It only decides which of four
 * situations a (ROM, patch) pair is in, and words the explanation once, in one place:
 *
 *   compatible       ROM matches the patch's expected original  -> patching may proceed
 *   already-patched  ROM matches the patch's finished result    -> nothing to apply
 *   incompatible     matches neither                            -> blocked
 *   unverifiable     the format embeds no usable checksum       -> proceed, can't pre-check
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module && module.exports) {
    module.exports = api;
  } else {
    root.PatchCompat = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------------------------------------------------------------- formatting

  /** Normalises a CRC32 (number or hex string) to 8 lowercase hex chars, or null. */
  function normCrc(value) {
    if (typeof value === "number") value = (value >>> 0).toString(16);
    if (typeof value !== "string") return null;
    value = value.trim().toLowerCase().replace(/^0x/, "");
    if (!/^[0-9a-f]{1,8}$/.test(value)) return null;
    while (value.length < 8) value = "0" + value;
    return value;
  }

  function showCrc(value) {
    var crc = normCrc(value);
    return crc ? crc.toUpperCase() : "unknown";
  }

  function groupDigits(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function showSize(n) {
    if (typeof n !== "number") return "unknown size";
    var text = groupDigits(n) + " bytes";
    if (n >= 1048576 && n % 1048576 === 0) text += " (" + n / 1048576 + " MB)";
    else if (n >= 1024 && n % 1024 === 0) text += " (" + n / 1024 + " KB)";
    return text;
  }

  function isNum(n) {
    return typeof n === "number" && isFinite(n);
  }

  // ---------------------------------------------------------------- classifier

  /**
   * @param {object} input
   * @param {{size:number, crc32:string, headerless?:{name:string, headerSize:number, size:number, crc32:string}|null}} input.rom
   *        `headerless` is only set when RomPatcher.isRomHeadered() recognised a copier header
   *        (NES/FDS/Lynx/SNES). It is the same view the patching library validates against.
   * @param {{recognized?:boolean, format?:string|null, sourceSize:number|null, targetSize:number|null,
   *          sourceCrc32:string|null, targetCrc32:string|null}} input.patch
   */
  function classify(input) {
    var rom = (input && input.rom) || {};
    var patch = (input && input.patch) || {};

    var wantSource = normCrc(patch.sourceCrc32);
    var wantTarget = normCrc(patch.targetCrc32);
    var romCrc = normCrc(rom.crc32);

    if (!wantSource || !romCrc || !isNum(rom.size)) {
      return {
        status: "unverifiable",
        code: "no-checksum",
        level: "unknown",
        blocking: false,
        headerRemoved: false,
        title: "Compatibility can't be checked in advance",
        message:
          "This patch format doesn't embed a checksum of the ROM it was made for, so PatchMyROM can't confirm in advance that this is the right base ROM. Double-check that it is the exact game, region and revision the patch's author used.",
        details: [],
      };
    }

    var expected = { crc32: wantSource, size: isNum(patch.sourceSize) ? patch.sourceSize : null };
    var target = { crc32: wantTarget, size: isNum(patch.targetSize) ? patch.targetSize : null };

    // The views of the ROM the patching library itself would use: the file as-is, and —
    // only when the library recognises a copier header — the file with that header removed.
    var views = [{ via: "file", size: rom.size, crc32: romCrc }];
    if (rom.headerless && isNum(rom.headerless.size) && normCrc(rom.headerless.crc32)) {
      views.push({
        via: "headerless",
        size: rom.headerless.size,
        crc32: normCrc(rom.headerless.crc32),
        header: rom.headerless,
      });
    }

    function matches(view, crc, size) {
      return crc !== null && view.crc32 === crc && (size === null || view.size === size);
    }

    var i, view;
    for (i = 0; i < views.length; i++) {
      view = views[i];
      if (matches(view, expected.crc32, expected.size)) {
        var viaHeader = view.via === "headerless";
        return {
          status: "compatible",
          code: viaHeader ? "rom-compatible-header" : "rom-compatible",
          level: "ok",
          blocking: false,
          headerRemoved: viaHeader,
          title: "ROM matches this patch",
          message: viaHeader
            ? "This ROM matches the patch's expected original once its " +
              view.header.headerSize +
              "-byte " +
              view.header.name +
              " header is set aside. PatchMyROM removes that header for patching and puts it back on the result."
            : "This ROM matches the patch's expected original (CRC32 " + showCrc(expected.crc32) + ").",
          details: [],
        };
      }
    }

    for (i = 0; i < views.length; i++) {
      view = views[i];
      if (matches(view, target.crc32, target.size)) {
        return {
          status: "already-patched",
          code: "rom-already-patched",
          level: "info",
          blocking: true,
          headerRemoved: view.via === "headerless",
          title: "This ROM is already patched",
          message:
            "The file you selected is already the finished result of this patch (CRC32 " +
            showCrc(target.crc32) +
            "), so there is nothing left to apply — you can use it as it is. To patch again, select the original, unmodified ROM instead.",
          details: [
            { label: "Original ROM this patch needs", value: describe(expected.crc32, expected.size) },
            { label: "Your file", value: describe(romCrc, rom.size) + " — matches the patched result" },
          ],
        };
      }
    }

    // Neither matches. One explanation, specific to what differs.
    var sizeKnown = expected.size !== null;
    var sizeDiffers = sizeKnown && rom.size !== expected.size;
    var lead;
    if (sizeDiffers) {
      lead =
        "This patch was made for an original ROM of " +
        showSize(expected.size) +
        ", but your file is " +
        showSize(rom.size) +
        ".";
    } else {
      lead =
        "Your file is the right size, but its contents differ from the original ROM this patch was made for.";
    }
    var hint =
      " This usually means a different dump, region or revision of the game, or a ROM that has already been modified. Use an unmodified copy of the exact original — PatchMyROM can't skip this check, because patching the wrong ROM produces a broken game.";
    if (sizeDiffers && Math.abs(rom.size - expected.size) <= 1024) {
      hint +=
        " A size difference this small can also mean an extra header or footer; PatchMyROM only removes copier headers it can positively identify and never guesses.";
    }

    return {
      status: "incompatible",
      code: sizeDiffers ? "rom-incompatible-size" : "rom-incompatible",
      level: "warning",
      blocking: true,
      headerRemoved: false,
      title: "This isn't the original ROM this patch needs",
      message: lead + hint,
      details: [
        { label: "Original ROM this patch needs", value: describe(expected.crc32, expected.size) },
        { label: "Your file", value: describe(romCrc, rom.size) },
      ],
    };
  }

  function describe(crc, size) {
    return "CRC32 " + showCrc(crc) + (isNum(size) ? " · " + showSize(size) : "");
  }

  /** Flattens a verdict to a single plain-text string (used for worker error messages). */
  function toPlainText(verdict) {
    var text = verdict.message;
    if (verdict.details && verdict.details.length) {
      text +=
        " " +
        verdict.details
          .map(function (d) {
            return d.label + ": " + d.value + ".";
          })
          .join(" ");
    }
    return text;
  }

  // ------------------------------------------------- patch-file pre-flight checks

  var CRC_TABLE = (function () {
    var table = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32Bytes(u8, start, end) {
    var crc = 0xffffffff;
    for (var i = start; i < end; i++) crc = CRC_TABLE[(crc ^ u8[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function asciiAt(u8, offset, text) {
    for (var i = 0; i < text.length; i++) if (u8[offset + i] !== text.charCodeAt(i)) return false;
    return true;
  }

  /**
   * Cheap structural checks for formats whose parser in the vendored library can spin
   * forever on a truncated header (BPS and UPS read variable-length numbers with no
   * end-of-file guard) and whose last four bytes are a CRC32 of the rest of the file.
   * Returns { ok: true } or { ok: false, code, message }. Other formats pass through.
   */
  function preflightPatch(u8) {
    var kind = null;
    var minLength = 0;
    var headerValues = 0;
    if (u8.length >= 4 && asciiAt(u8, 0, "BPS1")) {
      kind = "BPS";
      minLength = 4 + 3 + 12;
      headerValues = 3; // source size, target size, metadata length
    } else if (u8.length >= 4 && asciiAt(u8, 0, "UPS1")) {
      kind = "UPS";
      minLength = 4 + 2 + 12;
      headerValues = 2; // input size, output size
    } else {
      return { ok: true };
    }

    var damaged = {
      ok: false,
      code: "patch-corrupt",
      message:
        "This " +
        kind +
        " patch file is damaged or incomplete (its built-in checksum doesn't match). Download the patch again from its original source, and don't edit it or transfer it as text.",
    };

    if (u8.length < minLength) return damaged;

    var tail = u8.length - 4;
    var stored = (u8[tail] | (u8[tail + 1] << 8) | (u8[tail + 2] << 16) | (u8[tail + 3] << 24)) >>> 0;
    if (stored !== crc32Bytes(u8, 0, tail)) return damaged;

    // Header numbers must terminate before the trailing checksums.
    var p = 4;
    var limit = u8.length - 12;
    var metaLength = 0;
    for (var v = 0; v < headerValues; v++) {
      var value = 0;
      var shift = 1;
      for (;;) {
        if (p >= limit) return damaged;
        var b = u8[p++];
        value += (b & 0x7f) * shift;
        if (b & 0x80) break;
        shift *= 128;
        value += shift;
      }
      if (kind === "BPS" && v === 2) metaLength = value;
    }
    if (kind === "BPS" && p + metaLength > limit) return damaged;

    return { ok: true };
  }

  /** Turns the vendored library's terse errors into messages a person can act on. */
  function explainError(err) {
    var raw = err && err.message ? String(err.message) : "";
    // The browser refused an allocation (typed arrays for the ROM, patch or output).
    if (err && err.name === "RangeError" && /allocation failed|invalid (typed )?array length|array buffer|out of memory/i.test(raw)) {
      return {
        code: "out-of-memory",
        message:
          "Your browser ran out of memory while handling these files. Close other tabs and try again, or use a desktop computer for very large ROMs.",
      };
    }
    if (/patch checksum mismatch/i.test(raw)) {
      return {
        code: "patch-corrupt",
        message:
          "This patch file is damaged or incomplete (its built-in checksum doesn't match). Download the patch again from its original source, and don't edit it or transfer it as text.",
      };
    }
    if (/invalid input rom checksum|source rom checksum mismatch/i.test(raw)) {
      return {
        code: "rom-incompatible",
        message:
          "This ROM doesn't match the original this patch was made for (checksum mismatch), so patching was stopped. Use an unmodified copy of the exact game, region and revision the patch's author used.",
      };
    }
    // Raw messages from the vendored xdelta/VCDIFF decoder. The VcdiffSecondary pre-pass normally
    // handles these cases first; this is the safety net if one of them still reaches the library.
    if (/not implemented: secondary decompressor|unimplemented windowheader\.deltaindicator/i.test(raw)) {
      return {
        code: "xdelta-secondary-unsupported",
        message:
          "This xdelta patch uses secondary compression that PatchMyROM can't decode (only uncompressed and LZMA xdelta patches are supported). Ask the patch's author to re-create it with `xdelta3 -S none` (or `-S lzma`), or apply it with the official xdelta3 command-line tool.",
      };
    }
    if (/not implemented: custom code table/i.test(raw)) {
      return {
        code: "xdelta-codetable-unsupported",
        message:
          "This xdelta patch uses a custom instruction table, which PatchMyROM can't decode. Ask the patch's author to re-create it with the standard xdelta3 settings.",
      };
    }
    return { code: "patch-failed", message: raw || "Patching failed for an unknown reason." };
  }

  return {
    classify: classify,
    toPlainText: toPlainText,
    preflightPatch: preflightPatch,
    explainError: explainError,
    normCrc: normCrc,
    showCrc: showCrc,
    showSize: showSize,
    crc32Bytes: crc32Bytes,
  };
});
