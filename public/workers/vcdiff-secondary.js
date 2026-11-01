/*
 * PatchMyROM VCDIFF / xdelta helper: secondary-compression pre-pass + integrity checks.
 *
 * Why this exists. The vendored RomPatcher.js VCDIFF decoder only understands *uncompressed*
 * patches. xdelta3 can additionally compress the data / instruction / address sections of every
 * window with a "secondary compressor"; the vendored decoder throws "not implemented: secondary
 * decompressor" for those. This module runs BEFORE the vendored decoder and never touches it:
 *
 *   inspect(patch)         cheap, bounds-checked structural scan (no decompression). Reports
 *                          the secondary compressor, window count and Adler-32 availability, and
 *                          throws a coded Error for damaged, truncated or unsupported patches.
 *   prepare(patch)         inspect + decode. Returns an equivalent PLAIN VCDIFF (secondary
 *                          compression removed) that the vendored decoder applies unchanged. A patch
 *                          that is already plain is returned as-is (same array, no copy).
 *   verifyOutput(...)      checks every window's Adler-32 (present in xdelta3's default output)
 *                          against the patched bytes, so a wrong source ROM or a damaged patch
 *                          can no longer be delivered silently.
 *
 * Supported secondary compressors:  none, and LZMA (xdelta3 secondary id 2 — each section is a
 * standard .xz stream, decoded by the self-contained XZ/LZMA2 decoder below).
 * Not supported, with a clear error:  DJW (id 1), FGK (id 16), unknown ids, custom code tables,
 * LZMA streams with extra filters (delta/BCJ), SHA-256 container checks are skipped (see below).
 *
 * Limits (untrusted input; see the constants at the top):  1 GiB total output, 1 GiB total
 * decompressed sections, 131072 windows, and per section at most 16 MiB + 1024 bytes per compressed
 * byte. Every declared size is checked BEFORE anything is allocated or decoded; allocation failures
 * become a clear "not enough memory" error. Peak extra memory while decoding is about twice the
 * decompressed patch size (one buffer per section type that doubles as the LZMA dictionary, plus the
 * rebuilt plain patch) — a patch, not the ROM, so tens of MB for real NDS patches.
 *
 * Integrity: patches carrying xdelta3's per-window Adler-32 are verified end to end (verifyOutput).
 * Patches without it (xdelta3 -n) cannot be verified; that is reported as such, never as verified.
 * Adler-32 and the .xz CRC checks guard against accidents, not against a deliberately crafted patch.
 *
 * Provenance and licence.  Original code, written from the public specifications:
 *   - RFC 3284 (VCDIFF);  - The .xz File Format (tukaani.org/xz/xz-file-format.txt);
 *   - the LZMA / LZMA2 algorithm as documented for the public-domain LZMA SDK (algorithm, not code).
 * xdelta3's on-disk conventions (secondary ids 1/2/16; one continuous LZMA stream per section type
 * across windows; .xz streams cut off after the last chunk) were established empirically from files
 * produced by xdelta3 3.0.11, and the decoder was validated against liblzma and xz output. No
 * xdelta3, liblzma, xz or xz-embedded source code was copied or ported (only the licence headers of
 * xdelta3's sources were read; a token-overlap scan against xdelta3 3.1.0 found 0.08% shared
 * 8-token sequences, all generic loop idioms). xdelta3's DJW/FGK/LZMA code is GPL-2.0-or-later, which
 * is why DJW and FGK are deliberately not ported.
 *
 * Pure functions only — no DOM / worker APIs — so the same file runs in the workers and in the
 * Node regression tests. Everything is client-side; no network, no WebAssembly, no dependencies.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module && module.exports) {
    module.exports = api;
  } else {
    root.VcdiffSecondary = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SECONDARY_NAMES = { 0: "none", 1: "DJW", 2: "LZMA", 16: "FGK" };

  // ---- Limits (untrusted input). Chosen to sit far above any real ROM patch and far below what a
  // hostile patch could use to exhaust a phone's memory or CPU. Real-world reference points: a
  // Nintendo DS cartridge is at most 512 MiB; xdelta3 windows default to 8 MiB (minimum 16 KiB) so a
  // 512 MiB ROM needs 64 to 32768 windows; the public Origin HeartGold patch is 43.6 MB with 8 MiB windows.
  var MAX_TARGET_SIZE = 1024 * 1024 * 1024; // total patched output declared by the patch: 1 GiB
  var MAX_WINDOWS = 131072; // 1 GiB / 8 KiB, i.e. already beyond xdelta3's 16 KiB minimum window
  var MAX_DECODED_TOTAL = 1024 * 1024 * 1024; // all decompressed sections together: 1 GiB
  var RATIO_BASE = 16 * 1024 * 1024; // a compressed section may always expand to this much...
  var RATIO_PER_BYTE = 1024; // ...plus this many bytes per compressed byte (LZMA tops out near 7000:1 on zeros)

  function fail(code, message) {
    var err = new Error(message);
    err.code = code;
    return err;
  }

  // Whole megabytes. Only for sizes that are always large (the 1 GiB limits), where rounding is harmless.
  function mb(bytes) {
    return Math.round(bytes / 1048576) + " MB";
  }

  // Human-readable size for anything that can be small: "512 B", "3.4 KB", "20.0 MB". Same B / KB / MB
  // rules as lib/format-bytes.ts (the workers are plain scripts and cannot import it). Rounding to
  // whole MB made a 300 KB allocation read as "0 MB".
  function formatBytes(bytes) {
    var n = Number(bytes);
    if (!isFinite(n) || n < 0) n = 0;
    n = Math.floor(n);
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  }

  function tooLarge(bytes) {
    return fail(
      "patch-too-large",
      "This xdelta patch would produce a " + mb(bytes) + " file, which is more than PatchMyROM can handle in a browser (limit: " + mb(MAX_TARGET_SIZE) + "). Apply it with the official xdelta3 command-line tool instead."
    );
  }

  function implausible() {
    return fail(
      "patch-corrupt",
      "This xdelta patch declares far more decompressed data than its compressed size allows, so it is damaged or not a genuine patch. Download it again from its original source."
    );
  }

  function outOfMemory(bytes) {
    return fail(
      "out-of-memory",
      "Your browser couldn't allocate the " + formatBytes(bytes) + " this patch needs. Close other tabs and try again, or use a desktop computer for very large ROMs."
    );
  }

  /** new Uint8Array(n) that reports a failed allocation as a clear, coded error. */
  function alloc(n) {
    try {
      return new Uint8Array(n);
    } catch (e) {
      void e; // allocation failure: reported below as a clear, coded error
      throw outOfMemory(n);
    }
  }

  function damaged() {
    return fail(
      "patch-corrupt",
      "This xdelta patch file is damaged or incomplete (it ends early or its internal lengths don't add up). Download the patch again from its original source, and don't edit it or transfer it as text."
    );
  }

  function unsupportedSecondary(id) {
    var name = SECONDARY_NAMES[id];
    var how =
      " Ask the patch's author to re-create it with `xdelta3 -S none` (or `-S lzma`), or apply it with the official xdelta3 command-line tool.";
    if (name === "DJW" || name === "FGK") {
      return fail(
        "xdelta-secondary-unsupported",
        "This xdelta patch uses " + name + " secondary compression, which PatchMyROM can't decode yet (only uncompressed and LZMA xdelta patches are supported)." + how
      );
    }
    return fail(
      "xdelta-secondary-unsupported",
      "This xdelta patch uses an unrecognised secondary compression method (id " + id + "), which PatchMyROM can't decode." + how
    );
  }

  // ------------------------------------------------------------------ VCDIFF structure

  /** Reader over a byte array with hard bounds; any overrun means a damaged patch. */
  function Cursor(u8, pos, end) {
    this.u8 = u8;
    this.pos = pos;
    this.end = end === undefined ? u8.length : end;
  }
  Cursor.prototype.byte = function () {
    if (this.pos >= this.end) throw damaged();
    return this.u8[this.pos++];
  };
  Cursor.prototype.varint = function () {
    var value = 0;
    for (var i = 0; i < 8; i++) {
      var b = this.byte();
      value = value * 128 + (b & 0x7f);
      if (!(b & 0x80)) return value;
    }
    throw damaged(); // more than 56 bits: not a real length
  };
  Cursor.prototype.skip = function (n) {
    if (n < 0 || this.pos + n > this.end) throw damaged();
    this.pos += n;
  };

  /**
   * Parses header + window headers without decoding anything.
   * @returns {{secondaryId:number, hdrIndicator:number, headerEnd:number, windows:Array, targetSize:number}}
   */
  function scan(u8) {
    if (!u8 || u8.length < 5 || u8[0] !== 0xd6 || u8[1] !== 0xc3 || u8[2] !== 0xc4) throw damaged();
    var c = new Cursor(u8, 4); // magic + version byte
    var hdr = c.byte();
    if (hdr & ~7) throw fail("xdelta-unsupported", "This xdelta patch uses VCDIFF header features PatchMyROM doesn't support.");
    var secondaryId = 0;
    if (hdr & 1) secondaryId = c.byte();
    if (hdr & 2) {
      var codeTableLen = c.varint();
      if (codeTableLen !== 0) {
        throw fail(
          "xdelta-codetable-unsupported",
          "This xdelta patch uses a custom instruction table, which PatchMyROM can't decode. Ask the patch's author to re-create it with the standard xdelta3 settings."
        );
      }
    }
    if (hdr & 4) c.skip(c.varint()); // application header (file names) — ignored, as before
    var headerEnd = c.pos;

    var windows = [];
    var targetSize = 0;
    while (c.pos < u8.length) {
      var w = { start: c.pos };
      w.indicator = c.byte();
      if (w.indicator & ~7 || (w.indicator & 3) === 3) throw damaged();
      w.sourceLength = 0;
      w.sourcePosition = 0;
      if (w.indicator & 3) {
        w.sourceLength = c.varint();
        w.sourcePosition = c.varint();
      }
      var deltaLength = c.varint();
      if (c.pos + deltaLength > u8.length) throw damaged(); // truncated window
      var deltaEnd = c.pos + deltaLength;
      var d = new Cursor(u8, c.pos, deltaEnd);
      w.targetLength = d.varint();
      w.deltaIndicator = d.byte();
      if (w.deltaIndicator & ~7) throw damaged();
      if (w.deltaIndicator !== 0 && secondaryId === 0) throw damaged(); // compressed sections but no compressor declared
      w.dataLength = d.varint();
      w.instLength = d.varint();
      w.addrLength = d.varint();
      w.adler32 = null;
      if (w.indicator & 4) {
        if (d.pos + 4 > deltaEnd) throw damaged();
        w.adler32 = ((u8[d.pos] << 24) | (u8[d.pos + 1] << 16) | (u8[d.pos + 2] << 8) | u8[d.pos + 3]) >>> 0;
        d.pos += 4;
      }
      w.sectionsStart = d.pos;
      if (d.pos + w.dataLength + w.instLength + w.addrLength !== deltaEnd) throw damaged();
      w.deltaEnd = deltaEnd;
      targetSize += w.targetLength;
      if (targetSize > MAX_TARGET_SIZE) throw tooLarge(targetSize);
      if (windows.length >= MAX_WINDOWS) throw damaged(); // implausibly many windows: hostile or damaged
      windows.push(w);
      c.pos = deltaEnd;
    }
    if (!windows.length) throw damaged();
    return { secondaryId: secondaryId, hdrIndicator: hdr, headerEnd: headerEnd, windows: windows, targetSize: targetSize };
  }

  /** Summary of a scan(); throws for secondary compressors we can't decode. */
  function summarize(s) {
    if (s.secondaryId !== 0 && s.secondaryId !== 2) throw unsupportedSecondary(s.secondaryId);
    var adler = 0;
    for (var i = 0; i < s.windows.length; i++) if (s.windows[i].adler32 !== null) adler++;
    return {
      secondaryId: s.secondaryId,
      secondary: SECONDARY_NAMES[s.secondaryId] || "unknown",
      windows: s.windows.length,
      adlerWindows: adler,
      targetSize: s.targetSize,
    };
  }

  /** Cheap pre-flight (no decompression). Throws coded errors for bad / unsupported patches. */
  function inspect(u8) {
    return summarize(scan(u8));
  }

  function varintBytes(n) {
    var len = 1;
    while (n >= 128) {
      n = Math.floor(n / 128);
      len++;
    }
    return len;
  }
  function writeVarint(out, pos, n) {
    var len = varintBytes(n);
    for (var i = len - 1; i >= 0; i--) {
      var b = n % 128;
      n = Math.floor(n / 128);
      out[pos + i] = i === len - 1 ? b : b | 0x80;
    }
    return pos + len;
  }

  /**
   * Returns a plain (uncompressed-section) VCDIFF equivalent to `u8`.
   * Plain patches are returned unchanged (same array). Result: {plain, info}.
   */
  function prepare(u8) {
    var s = scan(u8);
    var info = summarize(s);
    if (s.secondaryId === 0) return { plain: u8, info: info };

    // Pass 1: decoded section sizes (declared inside each compressed section) and exact output size.
    // Every declared size is checked against hard limits BEFORE anything is allocated or decoded.
    var plans = [];
    var decodedTotal = 0;
    var streamTotals = [0, 0, 0]; // decoded bytes per section type (data / instructions / addresses)
    var appHeader = null;
    (function readAppHeader() {
      var c = new Cursor(u8, 4);
      c.byte(); // header indicator
      if (s.hdrIndicator & 1) c.byte(); // secondary compressor id
      if (s.hdrIndicator & 2) c.varint(); // code table length (0 — checked in scan)
      if (s.hdrIndicator & 4) {
        var from = c.pos;
        c.skip(c.varint());
        appHeader = u8.subarray(from, c.pos); // length varint + bytes, copied verbatim
      }
    })();
    var total = 5 + (appHeader ? appHeader.length : 0); // magic+version, header indicator, [app header]
    for (var wi = 0; wi < s.windows.length; wi++) {
      var w = s.windows[wi];
      var sizes = [w.dataLength, w.instLength, w.addrLength];
      var caps = [w.targetLength, 2 * w.targetLength + 16, 5 * w.targetLength + 16];
      var cur = w.sectionsStart;
      var sections = [];
      var decoded = [];
      for (var k = 0; k < 3; k++) {
        var compressed = (w.deltaIndicator >> k) & 1;
        var from = cur;
        cur += sizes[k];
        if (!compressed) {
          sections.push({ from: from, to: cur, plain: true });
          decoded.push(sizes[k]);
        } else {
          var c2 = new Cursor(u8, from, cur);
          var decodedSize = c2.varint();
          var compressedBytes = cur - c2.pos;
          if (decodedSize > caps[k]) throw damaged(); // a section can't hold more than its window needs
          if (decodedSize > RATIO_BASE + RATIO_PER_BYTE * compressedBytes) throw implausible(); // decompression bomb
          decodedTotal += decodedSize;
          if (decodedTotal > MAX_DECODED_TOTAL) throw tooLarge(decodedTotal);
          sections.push({ from: c2.pos, to: cur, plain: false, decodedSize: decodedSize });
          decoded.push(decodedSize);
          streamTotals[k] += decodedSize;
        }
      }
      var deltaLength = varintBytes(w.targetLength) + 1 + varintBytes(decoded[0]) + varintBytes(decoded[1]) + varintBytes(decoded[2]) + (w.adler32 !== null ? 4 : 0) + decoded[0] + decoded[1] + decoded[2];
      total += 1 + (w.indicator & 3 ? varintBytes(w.sourceLength) + varintBytes(w.sourcePosition) : 0) + varintBytes(deltaLength) + deltaLength;
      if (total > MAX_DECODED_TOTAL + 1048576) throw tooLarge(total);
      plans.push({ w: w, sections: sections, decoded: decoded, deltaLength: deltaLength });
    }

    // Pass 2: write the plain patch once. Each section type is one LZMA stream that continues across
    // windows, so each gets its own contiguous buffer (also its dictionary) and is copied into place.
    var streams = [null, null, null];
    var out = alloc(total);
    out[0] = 0xd6;
    out[1] = 0xc3;
    out[2] = 0xc4;
    out[3] = u8[3];
    out[4] = s.hdrIndicator & 4 ? 4 : 0; // secondary + code-table flags removed; app header kept if present
    var p = 5;
    if (appHeader) {
      out.set(appHeader, p);
      p += appHeader.length;
    }
    for (var i = 0; i < plans.length; i++) {
      var pl = plans[i];
      var win = pl.w;
      out[p++] = win.indicator;
      if (win.indicator & 3) {
        p = writeVarint(out, p, win.sourceLength);
        p = writeVarint(out, p, win.sourcePosition);
      }
      p = writeVarint(out, p, pl.deltaLength);
      p = writeVarint(out, p, win.targetLength);
      out[p++] = 0; // delta indicator: sections are plain now
      p = writeVarint(out, p, pl.decoded[0]);
      p = writeVarint(out, p, pl.decoded[1]);
      p = writeVarint(out, p, pl.decoded[2]);
      if (win.adler32 !== null) {
        out[p++] = win.adler32 >>> 24;
        out[p++] = (win.adler32 >>> 16) & 255;
        out[p++] = (win.adler32 >>> 8) & 255;
        out[p++] = win.adler32 & 255;
      }
      for (var k2 = 0; k2 < 3; k2++) {
        var sec = pl.sections[k2];
        if (sec.plain) {
          out.set(u8.subarray(sec.from, sec.to), p);
          p += sec.to - sec.from;
        } else {
          if (!streams[k2]) streams[k2] = new SectionStream(streamTotals[k2]);
          out.set(streams[k2].decode(u8, sec.from, sec.to, sec.decodedSize), p);
          p += sec.decodedSize;
        }
      }
    }
    if (p !== total) throw damaged();
    return { plain: out, info: info };
  }

  // ------------------------------------------------------------------ Adler-32 verification

  function adler32(u8, start, end) {
    var a = 1;
    var b = 0;
    var i = start;
    while (i < end) {
      var n = Math.min(5552, end - i);
      for (var k = 0; k < n; k++) {
        a += u8[i++];
        b += a;
      }
      a %= 65521;
      b %= 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  /**
   * Verifies each window's Adler-32 (when the patch carries one) against the patched ROM.
   * `output` holds the patched bytes; `offset` is a header the patcher put back in front (0 if none).
   * @returns {{checked:number, windows:number}}; throws a coded "output-mismatch" Error on any mismatch.
   */
  function verifyOutput(plainPatch, output, offset) {
    var s = scan(plainPatch);
    var base = offset || 0;
    var pos = base;
    var checked = 0;
    for (var i = 0; i < s.windows.length; i++) {
      var w = s.windows[i];
      if (pos + w.targetLength > output.length) {
        throw fail("output-mismatch", "The patched result is shorter than this patch says it should be, so it was discarded instead of offered for download.");
      }
      if (w.adler32 !== null) {
        var actual = adler32(output, pos, pos + w.targetLength);
        if (actual !== w.adler32) {
          throw fail(
            "output-mismatch",
            "The patched result failed this patch's built-in integrity check (Adler-32 of window " + (i + 1) + " of " + s.windows.length + "), so it was discarded instead of offered for download. This usually means the ROM isn't the exact original the patch was made for; it can also mean the patch file is damaged."
          );
        }
        checked++;
      }
      pos += w.targetLength;
    }
    if (pos - base !== output.length - base) {
      throw fail("output-mismatch", "The patched result has a different size than this patch says it should, so it was discarded instead of offered for download.");
    }
    return { checked: checked, windows: s.windows.length };
  }

  // ------------------------------------------------------------------ CRCs (XZ container checks)

  var CRC32_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8, start, end) {
    var c = 0xffffffff;
    for (var i = start; i < end; i++) c = CRC32_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  var CRC64_LO = null;
  var CRC64_HI = null;
  function crc64Tables() {
    if (CRC64_LO) return;
    CRC64_LO = new Uint32Array(256);
    CRC64_HI = new Uint32Array(256);
    // reflected ECMA-182 polynomial 0xC96C5795D7870F42 as (hi, lo) 32-bit halves
    var polyHi = 0xc96c5795;
    var polyLo = 0xd7870f42;
    for (var n = 0; n < 256; n++) {
      var hi = 0;
      var lo = n;
      for (var k = 0; k < 8; k++) {
        var low = lo & 1;
        lo = ((lo >>> 1) | ((hi & 1) << 31)) >>> 0;
        hi = hi >>> 1;
        if (low) {
          lo = (lo ^ polyLo) >>> 0;
          hi = (hi ^ polyHi) >>> 0;
        }
      }
      CRC64_LO[n] = lo;
      CRC64_HI[n] = hi;
    }
  }
  /** Returns [hi, lo] of the CRC-64/XZ of out[start:end]. */
  function crc64(u8, start, end) {
    crc64Tables();
    var hi = 0xffffffff;
    var lo = 0xffffffff;
    for (var i = start; i < end; i++) {
      var idx = (lo ^ u8[i]) & 255;
      lo = (((lo >>> 8) | ((hi & 255) << 24)) ^ CRC64_LO[idx]) >>> 0;
      hi = ((hi >>> 8) ^ CRC64_HI[idx]) >>> 0;
    }
    return [(hi ^ 0xffffffff) >>> 0, (lo ^ 0xffffffff) >>> 0];
  }

  // ------------------------------------------------------------------ XZ container + LZMA2

  function xzBad() {
    return fail("patch-corrupt", "This xdelta patch contains a damaged LZMA-compressed section. Download the patch again from its original source, and don't edit it or transfer it as text.");
  }
  function xzUnsupported(what) {
    return fail("xdelta-secondary-unsupported", "This xdelta patch's LZMA-compressed section uses " + what + ", which PatchMyROM can't decode. Ask the patch's author to re-create it with `xdelta3 -S none` (or the default `-S lzma`).");
  }

  /** XZ variable-length integer (little-endian base-128), bounded. */
  function xzVli(u8, st, end) {
    var value = 0;
    var mul = 1;
    for (var i = 0; i < 9; i++) {
      if (st.p >= end) throw xzBad();
      var b = u8[st.p++];
      value += (b & 0x7f) * mul;
      if (!(b & 0x80)) {
        if (i > 0 && b === 0) throw xzBad(); // non-minimal encoding
        return value;
      }
      mul *= 128;
    }
    throw xzBad();
  }

  function le32(u8, at) {
    return (u8[at] | (u8[at + 1] << 8) | (u8[at + 2] << 16) | (u8[at + 3] << 24)) >>> 0;
  }

  /**
   * One xdelta3 "section stream": all the data (or instruction, or address) sections of a patch
   * that were compressed with LZMA. xdelta3 writes ONE xz/LZMA2 stream per section type and
   * continues it from window to window: only the first window's section carries the .xz stream and
   * block headers, later windows hold raw LZMA2 chunks that continue the same dictionary and
   * coder state. The stream is also never "finished" (no end marker / index / footer — the decoded
   * size travels separately), although complete .xz streams are accepted and fully validated too.
   * decode() must therefore be called for the windows in order, with `out` being one contiguous
   * buffer for the whole stream (it doubles as the LZMA dictionary).
   */
  function SectionStream(totalSize) {
    this.out = alloc(totalSize);
    this.pos = 0;
    this.headerParsed = false;
    this.checkType = 0;
    this.lz = null; // LZMA2 decoder of the current block
    this.block = null;
    this.records = [];
    this.finished = false;
  }

  /** Decodes one window's section u8[from:to] and returns the decoded bytes (a view of this.out). */
  SectionStream.prototype.decode = function (u8, from, to, expected) {
    var start = this.pos;
    var p = from;
    if (this.finished) throw xzBad(); // data after the end of a complete stream
    if (!this.headerParsed) {
      if (to - p < 12) throw xzBad();
      var magic = [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00];
      for (var m = 0; m < 6; m++) if (u8[p + m] !== magic[m]) throw xzBad();
      if (u8[p + 6] !== 0 || (u8[p + 7] & 0xf0) !== 0) throw xzBad();
      if (crc32(u8, p + 6, p + 8) !== le32(u8, p + 8)) throw xzBad();
      this.checkType = u8[p + 7] & 0x0f;
      this.flags0 = u8[p + 6];
      this.flags1 = u8[p + 7];
      this.checkSize = this.checkType === 0 ? 0 : 4 << (((this.checkType - 1) / 3) | 0); // 1-3:4, 4-6:8, 7-9:16, 10-12:32, 13-15:64
      this.headerParsed = true;
      p += 12;
    }
    var limit = start + expected;
    for (;;) {
      if (this.lz === null) {
        if (p >= to) break; // section ended between blocks (only legal once all expected bytes exist)
        if (u8[p] === 0) {
          p = this.readIndexAndFooter(u8, p, to);
          this.finished = true;
          break;
        }
        p = this.readBlockHeader(u8, p, to);
      }
      var blockOutStart = this.pos;
      var r = this.lz.run(u8, p, to, this.out, this.pos, limit);
      this.pos = blockOutStart + r.outLength;
      if (!r.endMarker) {
        // input exhausted on a chunk boundary: the stream continues in the next window (or is
        // simply cut here, as xdelta3 does)
        p = r.inEnd;
        break;
      }
      // block ended with an LZMA2 end marker: padding, check field, bookkeeping
      var compressedSize = r.inEnd - this.block.dataStart;
      var pad = (4 - (compressedSize & 3)) & 3;
      var checkAt = r.inEnd + pad;
      for (var q = r.inEnd; q < checkAt; q++) if (q >= to || u8[q] !== 0) throw xzBad();
      if (checkAt + this.checkSize > to) throw xzBad();
      var blockTotal = this.pos - this.block.outStart;
      if (this.block.declaredCompressed !== -1 && this.block.declaredCompressed !== compressedSize) throw xzBad();
      if (this.block.declaredUncompressed !== -1 && this.block.declaredUncompressed !== blockTotal) throw xzBad();
      if (this.checkType === 1) {
        if (crc32(this.out, this.block.outStart, this.pos) !== le32(u8, checkAt)) throw xzBad();
      } else if (this.checkType === 4) {
        var c64 = crc64(this.out, this.block.outStart, this.pos);
        if (c64[1] !== le32(u8, checkAt) || c64[0] !== le32(u8, checkAt + 4)) throw xzBad();
      }
      // (other check types — e.g. SHA-256 — are not verified; the patch's own Adler-32 still is)
      this.records.push({ unpadded: this.block.headerSize + compressedSize + this.checkSize, uncompressed: blockTotal });
      this.lz = null;
      p = checkAt + this.checkSize;
    }
    if (p !== to) throw xzBad(); // trailing bytes
    if (this.pos !== limit) throw xzBad(); // must decode exactly the declared size
    return this.out.subarray(start, limit);
  };

  SectionStream.prototype.readBlockHeader = function (u8, p, to) {
    var headerSize = (u8[p] + 1) * 4;
    if (p + headerSize > to) throw xzBad();
    if (crc32(u8, p, p + headerSize - 4) !== le32(u8, p + headerSize - 4)) throw xzBad();
    var h = { p: p + 1 };
    var hend = p + headerSize - 4;
    var flags = u8[h.p++];
    if (flags & 0x3c) throw xzBad();
    if ((flags & 3) !== 0) throw xzUnsupported("an extra filter chain (only plain LZMA2 is supported)");
    var declaredCompressed = flags & 0x40 ? xzVli(u8, h, hend) : -1;
    var declaredUncompressed = flags & 0x80 ? xzVli(u8, h, hend) : -1;
    var filterId = xzVli(u8, h, hend);
    var propsSize = xzVli(u8, h, hend);
    if (filterId !== 0x21) throw xzUnsupported("a filter other than LZMA2");
    if (propsSize !== 1 || h.p >= hend) throw xzBad();
    if (u8[h.p++] > 40) throw xzBad(); // LZMA2 dictionary-size property
    for (var z = h.p; z < hend; z++) if (u8[z] !== 0) throw xzBad(); // header padding must be zero
    this.block = { headerSize: headerSize, dataStart: p + headerSize, outStart: this.pos, declaredCompressed: declaredCompressed, declaredUncompressed: declaredUncompressed };
    this.lz = makeLzma2();
    return p + headerSize;
  };

  SectionStream.prototype.readIndexAndFooter = function (u8, p, to) {
    var ix = { p: p + 1 };
    var count = xzVli(u8, ix, to);
    if (count !== this.records.length) throw xzBad();
    for (var r = 0; r < count; r++) {
      var up = xzVli(u8, ix, to);
      var un = xzVli(u8, ix, to);
      if (up !== this.records[r].unpadded || un !== this.records[r].uncompressed) throw xzBad();
    }
    while ((ix.p - p) & 3) {
      if (ix.p >= to || u8[ix.p] !== 0) throw xzBad();
      ix.p++;
    }
    if (ix.p + 4 > to || crc32(u8, p, ix.p) !== le32(u8, ix.p)) throw xzBad();
    ix.p += 4;
    // footer: CRC32 | backward size | stream flags (2) | "YZ"
    if (ix.p + 12 > to) throw xzBad();
    if (crc32(u8, ix.p + 4, ix.p + 10) !== le32(u8, ix.p)) throw xzBad();
    if ((le32(u8, ix.p + 4) + 1) * 4 !== ix.p - p) throw xzBad(); // backward size = index size
    if (u8[ix.p + 8] !== this.flags0 || u8[ix.p + 9] !== this.flags1) throw xzBad(); // flags match the header
    if (u8[ix.p + 10] !== 0x59 || u8[ix.p + 11] !== 0x5a) throw xzBad();
    return ix.p + 12;
  };

  /**
   * LZMA2 decoder state machine. run() decodes whole chunks from u8[inPos:inLimit] into `out`
   * starting at `outStart` (the decoder's dictionary is `out` itself, so it must be one contiguous
   * buffer for the whole stream) and stops at an end marker or when the input ends on a chunk
   * boundary. Probabilities, coder state, repeat distances and chunk properties persist between
   * run() calls, which is what lets a stream continue from window to window.
   * Returns {inEnd, outLength, endMarker}.
   */
  function makeLzma2() {
    var dictStart = 0;
    var needDictReset = true;
    var needProps = true;
    var needStateInit = true;
    var lc = 0, lp = 0, pb = 0;
    var probs = null;
    var state = 0, rep0 = 0, rep1 = 0, rep2 = 0, rep3 = 0;
    var rangeVal = 0, codeVal = 0, rcPos = 0, rcEnd = 0;
    var u8 = null;

    // probability array layout
    var IS_MATCH = 0; // 12*16
    var IS_REP = IS_MATCH + 192;
    var IS_REP_G0 = IS_REP + 12;
    var IS_REP_G1 = IS_REP_G0 + 12;
    var IS_REP_G2 = IS_REP_G1 + 12;
    var IS_REP0_LONG = IS_REP_G2 + 12; // 12*16
    var POS_SLOT = IS_REP0_LONG + 192; // 4*64
    var SPEC_POS = POS_SLOT + 256; // 115
    var ALIGN = SPEC_POS + 115; // 16
    var LEN_CODER = ALIGN + 16; // choice, choice2, low[16][8], mid[16][8], high[256] = 514
    var REP_LEN_CODER = LEN_CODER + 514;
    var LITERAL = REP_LEN_CODER + 514;

    function rcInit() {
      if (rcEnd - rcPos < 5 || u8[rcPos] !== 0) throw xzBad();
      codeVal = ((u8[rcPos + 1] << 24) | (u8[rcPos + 2] << 16) | (u8[rcPos + 3] << 8) | u8[rcPos + 4]) >>> 0;
      rangeVal = 0xffffffff;
      rcPos += 5;
    }
    function rcNorm() {
      if (rangeVal < 0x1000000) {
        if (rcPos >= rcEnd) throw xzBad();
        rangeVal = (rangeVal * 256) >>> 0;
        codeVal = (codeVal * 256 + u8[rcPos++]) >>> 0;
      }
    }
    function bit(idx) {
      rcNorm();
      var p = probs[idx];
      var bound = (rangeVal >>> 11) * p;
      if (codeVal < bound) {
        rangeVal = bound;
        probs[idx] = p + ((2048 - p) >>> 5);
        return 0;
      }
      rangeVal -= bound;
      codeVal -= bound;
      probs[idx] = p - (p >>> 5);
      return 1;
    }
    function direct(count) {
      var result = 0;
      while (count--) {
        rcNorm();
        rangeVal = rangeVal >>> 1;
        var b = 0;
        if (codeVal >= rangeVal) {
          codeVal -= rangeVal;
          b = 1;
        }
        result = ((result << 1) | b) >>> 0;
      }
      return result;
    }
    function tree(base, bits) {
      var m = 1;
      for (var i = 0; i < bits; i++) m = (m << 1) | bit(base + m);
      return m - (1 << bits);
    }
    function reverseTree(base, bits) {
      var m = 1;
      var sym = 0;
      for (var i = 0; i < bits; i++) {
        var b = bit(base + m);
        m = (m << 1) | b;
        sym |= b << i;
      }
      return sym;
    }
    function decodeLen(base, posState) {
      if (!bit(base)) return tree(base + 2 + (posState << 3), 3);
      if (!bit(base + 1)) return 8 + tree(base + 2 + 128 + (posState << 3), 3);
      return 16 + tree(base + 2 + 256, 8);
    }
    function initProbs() {
      var need = LITERAL + (0x300 << (lc + lp));
      if (!probs || probs.length !== need) probs = new Uint16Array(need);
      probs.fill(1024);
    }

    function run(input, inPos, inLimit, out, outStart, outLimit) {
      u8 = input;
      var pos = outStart;
      var endMarker = true;
      for (;;) {
        if (inPos >= inLimit) {
          endMarker = false; // input ended on a chunk boundary
          break;
        }
        var control = u8[inPos++];
        if (control === 0) break;
        if (control === 1 || control === 2) {
          // uncompressed chunk
          if (control === 1) {
            dictStart = pos;
            needDictReset = false;
            needProps = true; // a dictionary reset invalidates the LZMA properties and state
            needStateInit = true;
          } else if (needDictReset) throw xzBad();
          if (inPos + 2 > inLimit) throw xzBad();
          var rawSize = ((u8[inPos] << 8) | u8[inPos + 1]) + 1;
          inPos += 2;
          if (inPos + rawSize > inLimit || pos + rawSize > outLimit) throw xzBad();
          out.set(u8.subarray(inPos, inPos + rawSize), pos);
          inPos += rawSize;
          pos += rawSize;
          continue;
        }
        if (control < 0x80) throw xzBad();
        // LZMA chunk
        if (inPos + 4 > inLimit) throw xzBad();
        var unpacked = (((control & 0x1f) << 16) | (u8[inPos] << 8) | u8[inPos + 1]) + 1;
        var packed = ((u8[inPos + 2] << 8) | u8[inPos + 3]) + 1;
        inPos += 4;
        var resetMode = (control >> 5) & 3;
        if (resetMode === 3) {
          dictStart = pos;
          needDictReset = false;
        } else if (needDictReset) throw xzBad();
        if (resetMode >= 2) {
          if (inPos >= inLimit) throw xzBad();
          var props = u8[inPos++];
          if (props >= 225) throw xzBad();
          lc = props % 9;
          var rest = (props / 9) | 0;
          lp = rest % 5;
          pb = (rest / 5) | 0;
          if (lc + lp > 4) throw xzBad();
          needProps = false;
          needStateInit = true;
        } else if (needProps) throw xzBad();
        if (resetMode >= 1 || needStateInit) {
          if (resetMode === 0 && needStateInit) throw xzBad(); // state reset required but not requested
          initProbs();
          state = 0;
          rep0 = rep1 = rep2 = rep3 = 0;
          needStateInit = false;
        }
        if (inPos + packed > inLimit || pos + unpacked > outLimit) throw xzBad();
        rcPos = inPos;
        rcEnd = inPos + packed;
        rcInit();
        var chunkEnd = pos + unpacked;
        var pbMask = (1 << pb) - 1;
        var lpMask = (1 << lp) - 1;
        while (pos < chunkEnd) {
          var rel = pos - dictStart;
          var posState = rel & pbMask;
          if (!bit(IS_MATCH + (state << 4) + posState)) {
            // literal
            var prev = rel > 0 ? out[pos - 1] : 0;
            var base = LITERAL + 0x300 * (((rel & lpMask) << lc) + (prev >> (8 - lc)));
            var symbol = 1;
            if (state >= 7) {
              if (rep0 + 1 > rel) throw xzBad();
              var matchByte = out[pos - rep0 - 1];
              var offs = 0x100;
              do {
                matchByte <<= 1;
                var mbit = matchByte & offs;
                var b = bit(base + offs + mbit + symbol);
                symbol = (symbol << 1) | b;
                offs &= b ? mbit : ~mbit;
              } while (symbol < 0x100);
            } else {
              do symbol = (symbol << 1) | bit(base + symbol);
              while (symbol < 0x100);
            }
            out[pos++] = symbol & 255;
            state = state < 4 ? 0 : state < 10 ? state - 3 : state - 6;
            continue;
          }
          var len;
          if (bit(IS_REP + state)) {
            if (rel === 0) throw xzBad();
            if (!bit(IS_REP_G0 + state)) {
              if (!bit(IS_REP0_LONG + (state << 4) + posState)) {
                // short rep: one byte from rep0
                if (rep0 + 1 > rel) throw xzBad();
                out[pos] = out[pos - rep0 - 1];
                pos++;
                state = state < 7 ? 9 : 11;
                continue;
              }
            } else {
              var dist;
              if (!bit(IS_REP_G1 + state)) {
                dist = rep1;
              } else {
                if (!bit(IS_REP_G2 + state)) {
                  dist = rep2;
                } else {
                  dist = rep3;
                  rep3 = rep2;
                }
                rep2 = rep1;
              }
              rep1 = rep0;
              rep0 = dist;
            }
            len = decodeLen(REP_LEN_CODER, posState);
            state = state < 7 ? 8 : 11;
          } else {
            rep3 = rep2;
            rep2 = rep1;
            rep1 = rep0;
            len = decodeLen(LEN_CODER, posState);
            state = state < 7 ? 7 : 10;
            var lenState = len < 4 ? len : 3;
            var slot = tree(POS_SLOT + (lenState << 6), 6);
            if (slot < 4) {
              rep0 = slot;
            } else {
              var numDirect = (slot >> 1) - 1;
              var d = ((2 | (slot & 1)) << numDirect) >>> 0;
              if (slot < 14) {
                d += reverseTree(SPEC_POS + d - slot, numDirect);
              } else {
                d += direct(numDirect - 4) * 16;
                d += reverseTree(ALIGN, 4);
              }
              rep0 = d >>> 0;
              if (rep0 === 0xffffffff) throw xzBad(); // end-of-payload marker is not allowed in LZMA2
            }
          }
          len += 2;
          if (rep0 + 1 > rel || pos + len > chunkEnd) throw xzBad();
          var src = pos - rep0 - 1;
          for (var cp = 0; cp < len; cp++) out[pos + cp] = out[src + cp];
          pos += len;
        }
        rcNorm();
        if (codeVal !== 0 || rcPos !== rcEnd) throw xzBad(); // chunk must end exactly on its range-coder bytes
        inPos = rcEnd;
      }
      return { inEnd: inPos, outLength: pos - outStart, endMarker: endMarker };
    }

    return { run: run };
  }

  return {
    inspect: inspect,
    prepare: prepare,
    verifyOutput: verifyOutput,
    adler32: adler32,
    outOfMemoryError: outOfMemory,
    formatBytes: formatBytes,
    isVcdiff: function (u8) {
      return !!u8 && u8.length >= 3 && u8[0] === 0xd6 && u8[1] === 0xc3 && u8[2] === 0xc4;
    },
    // exposed for tests
    _decodeXz: function (u8, expected) {
      return new SectionStream(expected).decode(u8, 0, u8.length, expected).slice();
    },
  };
});
