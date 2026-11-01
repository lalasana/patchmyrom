/*
 * PatchMyROM ROM-toolkit core (checksum checker + patch/ROM compatibility checker).
 *
 * Pure functions only — no DOM, no worker APIs, no file I/O — so exactly the same code runs in the
 * hash worker, the compatibility worker, the main-thread UI (via lib/rom-toolkit.ts) and the Node
 * regression tests. It deliberately adds NO patching or hashing algorithm of its own:
 *   - hashing lives in stream-hash.js (and the vendored RomPatcher.js HashCalculator),
 *   - the "does this ROM match this UPS/BPS patch" decision stays in patch-compat.js (classify),
 *   - checksum/size facts a patch format embeds come from the vendored RomPatcher.js parsers.
 * What lives here is what the two tools need on top of that: reading a checksum a person typed,
 * telling platforms apart by their headers (not just the file extension), spotting SNES copier
 * headers, and turning everything into one honest verdict.
 *
 * Honesty rules the code below enforces:
 *   - "compatible" is only ever returned when a checksum (or equivalent data the patch format
 *     really embeds) was compared and matched. IPS, PPF, BDF and xdelta embed none, so they are
 *     always "cannot-verify" — never "compatible".
 *   - Platform detection reports HOW sure it is: "confirmed" (a header check passed),
 *     "extension-only" (only the file name says so) or "unknown".
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module && module.exports) {
    module.exports = api;
  } else {
    root.RomToolkit = api;
  }
})(typeof self !== "undefined" ? self : this, function (root) {
  "use strict";

  // PatchCompat provides the UPS/BPS classifier and the size/CRC formatters. In a worker it is loaded
  // by the worker before this file loads; under Node (and when bundled) it is a normal require.
  function patchCompat() {
    if (typeof require === "function") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- UMD: the Node tests and the bundler load it as a module
        return require("./patch-compat.js");
      } catch {
        /* fall through to the worker global */
      }
    }
    return root.PatchCompat;
  }

  // ------------------------------------------------------------------ expected checksums

  var ALGORITHMS = {
    crc32: { label: "CRC32", length: 8 },
    md5: { label: "MD5", length: 32 },
    sha1: { label: "SHA-1", length: 40 },
    sha256: { label: "SHA-256", length: 64 },
  };
  var ALGORITHM_BY_LENGTH = { 8: "crc32", 32: "md5", 40: "sha1", 64: "sha256" };

  function normalizeAlgorithmLabel(text) {
    var t = String(text).toLowerCase().replace(/[^a-z0-9]/g, "");
    return t === "crc32" || t === "md5" || t === "sha1" || t === "sha256" ? t : null;
  }

  var LABEL_PREFIX = /^\s*(crc-?32|md5|sha-?1|sha-?256)\s*[:=]?\s*(.*)$/i;
  var LABEL_SUFFIX = /^(.*?)\s*[(\[]?\s*(crc-?32|md5|sha-?1|sha-?256)\s*[)\]]?\s*$/i;

  function parseOneChecksum(line) {
    var label = null;
    var body = line;
    var m = LABEL_PREFIX.exec(line);
    if (m) {
      label = normalizeAlgorithmLabel(m[1]);
      body = m[2];
    } else {
      m = LABEL_SUFFIX.exec(line);
      if (m) {
        label = normalizeAlgorithmLabel(m[2]);
        body = m[1];
      }
    }
    // Tolerate "0x" prefixes and the separators checksums are printed with (spaces, colons, dashes).
    var digits = body.replace(/^\s*0x/i, "").replace(/[\s:_-]/g, "");
    if (digits === "") {
      return { ok: false, code: "empty-value", message: "There is a label but no checksum value after it." };
    }
    if (!/^[0-9a-f]+$/i.test(digits)) {
      return {
        ok: false,
        code: "invalid-characters",
        message: "A checksum only contains the digits 0-9 and the letters A-F. “" + line + "” has other characters.",
      };
    }
    digits = digits.toLowerCase();

    if (label) {
      var want = ALGORITHMS[label].length;
      if (digits.length === want) return { ok: true, item: { algorithm: label, value: digits } };
      // Some tools print CRC32 without its leading zeros; only accepted when the label says it is a CRC32.
      if (label === "crc32" && digits.length < want) {
        while (digits.length < want) digits = "0" + digits;
        return { ok: true, item: { algorithm: label, value: digits, padded: true } };
      }
      return {
        ok: false,
        code: "length-mismatch",
        message:
          ALGORITHMS[label].label + " has " + want + " hex digits, but this value has " + digits.length + ". Check that you copied all of it.",
      };
    }

    var algorithm = ALGORITHM_BY_LENGTH[digits.length];
    if (!algorithm) {
      return {
        ok: false,
        code: "unknown-length",
        message:
          "This has " +
          digits.length +
          " hex digits. Expected 8 (CRC32), 32 (MD5), 40 (SHA-1) or 64 (SHA-256). Check that you copied all of it.",
      };
    }
    return { ok: true, item: { algorithm: algorithm, value: digits } };
  }

  /**
   * Reads what a person pasted next to a ROM/patch download. Accepts one value or several (one per
   * line, or separated by commas/semicolons), with or without labels such as "CRC32:" / "SHA-1:".
   * The algorithm is taken from the label or, failing that, from the length.
   * @returns {{ok:true, items:{algorithm:string,value:string}[]} | {ok:false, code:string, message:string}}
   */
  function parseExpectedChecksums(text) {
    var lines = String(text == null ? "" : text)
      .split(/[\r\n;,]+/)
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);
    if (!lines.length) {
      return { ok: false, code: "empty", message: "Paste the checksum you want to compare against." };
    }
    var items = [];
    var byAlgorithm = {};
    for (var i = 0; i < lines.length; i++) {
      var parsed = parseOneChecksum(lines[i]);
      if (!parsed.ok) return parsed;
      var item = parsed.item;
      if (byAlgorithm[item.algorithm] && byAlgorithm[item.algorithm] !== item.value) {
        return {
          ok: false,
          code: "conflicting-values",
          message: "Two different " + ALGORITHMS[item.algorithm].label + " values were entered. Compare one at a time.",
        };
      }
      if (!byAlgorithm[item.algorithm]) {
        byAlgorithm[item.algorithm] = item.value;
        items.push(item);
      }
    }
    return { ok: true, items: items };
  }

  /**
   * @param {{crc32:string, md5:string, sha1:string, sha256:string}} actual hashes of the file
   * @param {{algorithm:string, value:string}[]} items from parseExpectedChecksums
   * @returns {{overall:"match"|"mismatch", results:{algorithm:string,label:string,expected:string,actual:string,match:boolean}[]}}
   */
  function compareChecksums(actual, items) {
    var results = items.map(function (item) {
      var got = String((actual && actual[item.algorithm]) || "").toLowerCase();
      return {
        algorithm: item.algorithm,
        label: ALGORITHMS[item.algorithm].label,
        expected: item.value,
        actual: got,
        match: got !== "" && got === item.value,
      };
    });
    var overall = results.length > 0 && results.every(function (r) {
      return r.match;
    }) ? "match" : "mismatch";
    return { overall: overall, results: results };
  }

  // ------------------------------------------------------------------ platform detection

  /**
   * Largest ROM the compatibility checker will load into memory whole. Only RUP, APS and PMSR patches need
   * that (their validateSource() in the patching library reads the ROM at arbitrary offsets or hashes it as
   * one block); UPS, BPS, IPS, xdelta and PPF checks stream the ROM and are not limited. Above this size the
   * check reports "cannot verify" with an explanation instead of risking the tab running out of memory.
   */
  var WHOLE_ROM_LIMIT = 256 * 1024 * 1024;

  /** Bytes the hash worker keeps from the start of a file so platform detection can inspect headers. */
  var HEAD_BYTES = 0x30000;
  /** Extra header locations beyond HEAD_BYTES (ExHiROM SNES headers, with and without a copier header). */
  var EXTRA_PROBES = [
    { offset: 0x40ffc0, length: 64 },
    { offset: 0x4101c0, length: 64 },
  ];

  var EXTENSION_PLATFORM = {
    gba: ["Game Boy Advance", "gba"],
    nds: ["Nintendo DS", "nds"],
    dsi: ["Nintendo DSi", "nds"],
    sfc: ["SNES", "snes"],
    smc: ["SNES", "snes"],
    swc: ["SNES", "snes"],
    fig: ["SNES", "snes"],
    nes: ["NES", "nes"],
    fds: ["NES (Famicom Disk System)", "fds"],
    gb: ["Game Boy", "gameboy"],
    gbc: ["Game Boy Color", "gameboy"],
    n64: ["Nintendo 64", "n64"],
    z64: ["Nintendo 64", "n64"],
    v64: ["Nintendo 64", "n64"],
    md: ["Sega Genesis / Mega Drive", "genesis"],
    gen: ["Sega Genesis / Mega Drive", "genesis"],
    smd: ["Sega Genesis / Mega Drive", "genesis"],
    sms: ["Sega Master System", "sms"],
    gg: ["Sega Game Gear", "sms"],
    "3ds": ["Nintendo 3DS", "3ds"],
    iso: ["Disc image", "disc"],
    bin: ["Disc image / Sega Genesis", "disc"],
  };

  function getExtension(fileName) {
    var match = /\.([a-z0-9]+)$/i.exec(fileName || "");
    return match ? match[1].toLowerCase() : "";
  }

  function makeReader(head, probes, size) {
    return {
      /** Byte at an absolute file offset, or -1 when that part of the file wasn't kept / doesn't exist. */
      byte: function (offset) {
        if (offset >= size) return -1;
        if (head && offset < head.length) return head[offset];
        if (probes) {
          for (var i = 0; i < probes.length; i++) {
            var p = probes[i];
            if (p && p.bytes && offset >= p.offset && offset < p.offset + p.bytes.length) return p.bytes[offset - p.offset];
          }
        }
        return -1;
      },
      has: function (offset, length) {
        return this.byte(offset) !== -1 && this.byte(offset + length - 1) !== -1;
      },
      ascii: function (offset, text) {
        for (var i = 0; i < text.length; i++) if (this.byte(offset + i) !== text.charCodeAt(i)) return false;
        return true;
      },
      u16le: function (offset) {
        return this.byte(offset) | (this.byte(offset + 1) << 8);
      },
    };
  }

  function crc16Modbus(reader, from, to) {
    var crc = 0xffff;
    for (var i = from; i < to; i++) {
      crc ^= reader.byte(i);
      for (var k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
    }
    return crc & 0xffff;
  }

  // Each check returns null (no match) or { platform, family, evidence, ... }.

  function checkNes(r) {
    if (r.ascii(0, "NES\x1a")) {
      var nes2 = r.byte(7) !== -1 && (r.byte(7) & 0x0c) === 0x08;
      return { platform: "NES", family: "nes", evidence: [(nes2 ? "NES 2.0" : "iNES") + " header (“NES” + 1A) at the start of the file"] };
    }
    if (r.ascii(0, "FDS\x1a")) {
      return { platform: "NES (Famicom Disk System)", family: "fds", evidence: ["FDS header (“FDS” + 1A) at the start of the file"] };
    }
    if (r.ascii(1, "*NINTENDO-HVC*")) {
      return { platform: "NES (Famicom Disk System)", family: "fds", evidence: ["Famicom Disk System disk header (“*NINTENDO-HVC*”)"] };
    }
    return null;
  }

  function checkN64(r) {
    var a = r.byte(0);
    var b = r.byte(1);
    var c = r.byte(2);
    var d = r.byte(3);
    if (a === 0x80 && b === 0x37 && c === 0x12 && d === 0x40) {
      return { platform: "Nintendo 64", family: "n64", evidence: ["N64 ROM header magic 80 37 12 40 (big-endian, usually .z64)"] };
    }
    if (a === 0x37 && b === 0x80 && c === 0x40 && d === 0x12) {
      return { platform: "Nintendo 64", family: "n64", evidence: ["N64 ROM header magic 37 80 40 12 (byte-swapped, usually .v64)"], notes: ["This dump is byte-swapped (.v64 style). Most patches expect the big-endian .z64 order."] };
    }
    if (a === 0x40 && b === 0x12 && c === 0x37 && d === 0x80) {
      return { platform: "Nintendo 64", family: "n64", evidence: ["N64 ROM header magic 40 12 37 80 (little-endian, usually .n64)"], notes: ["This dump is little-endian (.n64 style). Most patches expect the big-endian .z64 order."] };
    }
    return null;
  }

  function checkGba(r) {
    if (!r.has(0, 0xc0) || r.byte(0xb2) !== 0x96) return null;
    var sum = 0;
    for (var i = 0xa0; i <= 0xbc; i++) sum += r.byte(i);
    var complement = (-(sum + 0x19)) & 0xff;
    if (r.byte(0xbd) !== complement) return null;
    return { platform: "Game Boy Advance", family: "gba", evidence: ["GBA header: fixed value 96h at 0xB2 and a valid header complement check at 0xBD"] };
  }

  function checkNds(r) {
    if (!r.has(0, 0x160)) return null;
    var stored = r.u16le(0x15e);
    if (crc16Modbus(r, 0, 0x15e) !== stored) return null;
    var dsi = r.byte(0x12) === 0x02 || r.byte(0x12) === 0x03;
    return { platform: dsi ? "Nintendo DSi" : "Nintendo DS", family: "nds", evidence: ["Nintendo DS header with a valid header CRC16 at 0x15E"] };
  }

  function checkGameBoy(r) {
    if (!r.has(0, 0x150)) return null;
    var x = 0;
    for (var i = 0x134; i <= 0x14c; i++) x = (x - r.byte(i) - 1) & 0xff;
    if (x !== r.byte(0x14d)) return null;
    var cgb = r.byte(0x143);
    var platform = cgb === 0xc0 ? "Game Boy Color" : cgb === 0x80 ? "Game Boy Color (also runs on Game Boy)" : "Game Boy";
    return { platform: platform, family: "gameboy", evidence: ["Game Boy cartridge header with a valid header checksum at 0x14D"] };
  }

  function checkGenesis(r) {
    if (r.ascii(0x100, "SEGA")) {
      return { platform: "Sega Genesis / Mega Drive", family: "genesis", evidence: ["“SEGA” system identifier at 0x100"] };
    }
    return null;
  }

  function checkMasterSystem(r) {
    var offsets = [0x7ff0, 0x3ff0, 0x1ff0];
    for (var i = 0; i < offsets.length; i++) {
      if (r.ascii(offsets[i], "TMR SEGA")) {
        var region = r.byte(offsets[i] + 15);
        var nibble = region === -1 ? -1 : region >> 4;
        var gg = nibble >= 5 && nibble <= 7;
        return {
          platform: gg ? "Sega Game Gear" : "Sega Master System",
          family: "sms",
          evidence: ["“TMR SEGA” header signature at 0x" + offsets[i].toString(16).toUpperCase()],
        };
      }
    }
    return null;
  }

  var SNES_CANDIDATES = [
    { base: 0x7fc0, mapping: "LoROM" },
    { base: 0xffc0, mapping: "HiROM" },
    { base: 0x40ffc0, mapping: "ExHiROM" },
  ];

  /**
   * SNES: a ROM has a valid internal header when its checksum and checksum-complement add up to FFFFh.
   * Looks at the header with and without a 512-byte copier header in front of it.
   */
  function checkSnes(r, size) {
    var copierBySize = size % 1024 === 512;
    var found = null;
    for (var c = 0; c < SNES_CANDIDATES.length && !found; c++) {
      for (var shift = 0; shift <= 512 && !found; shift += 512) {
        var h = SNES_CANDIDATES[c].base + shift;
        if (!r.has(h + 0x1c, 4)) continue;
        var complement = r.u16le(h + 0x1c);
        var checksum = r.u16le(h + 0x1e);
        if (((complement + checksum) & 0xffff) !== 0xffff) continue;
        // Excludes the all-zero / all-FF look-alikes that also "add up".
        if ((complement === 0 && checksum === 0) || (complement === 0xffff && checksum === 0xffff)) continue;
        found = { mapping: SNES_CANDIDATES[c].mapping, headerAddress: h, copierHeader: shift === 512 };
      }
    }
    if (!found) return null;
    var evidence = ["SNES " + found.mapping + " internal header at 0x" + found.headerAddress.toString(16).toUpperCase() + " with a valid checksum/complement pair"];
    if (found.copierHeader) evidence.push("The header sits 512 bytes later than normal: the file starts with a 512-byte copier header");
    return {
      platform: "SNES",
      family: "snes",
      evidence: evidence,
      snes: { mapping: found.mapping, copierHeader: found.copierHeader, validated: true, sizeSuggestsHeader: copierBySize },
    };
  }

  var CHECKS = [checkNes, checkN64, checkGba, checkNds, checkGameBoy, checkGenesis, checkMasterSystem];

  /**
   * Works out a platform from the file's own headers, and reports how sure it is.
   * @param {{fileName?:string, size:number, head?:Uint8Array, probes?:{offset:number,bytes:Uint8Array}[]}} input
   * @returns {{platform:string|null, family:string|null, confidence:"confirmed"|"extension-only"|"unknown",
   *   extension:string, extensionPlatform:string|null, evidence:string[], notes:string[], conflict:boolean,
   *   snes:null|{mapping:string|null, copierHeader:boolean, validated:boolean, sizeSuggestsHeader:boolean}}}
   */
  function detectPlatform(input) {
    var size = input && typeof input.size === "number" ? input.size : 0;
    var extension = getExtension(input && input.fileName);
    var ext = EXTENSION_PLATFORM[extension] || null;
    var reader = makeReader(input && input.head, input && input.probes, size);

    var confirmed = null;
    for (var i = 0; i < CHECKS.length && !confirmed; i++) confirmed = CHECKS[i](reader);
    if (!confirmed) confirmed = checkSnes(reader, size);

    var result = {
      platform: null,
      family: null,
      confidence: "unknown",
      extension: extension,
      extensionPlatform: ext ? ext[0] : null,
      evidence: [],
      notes: [],
      conflict: false,
      snes: null,
    };

    if (confirmed) {
      result.platform = confirmed.platform;
      result.family = confirmed.family;
      result.confidence = "confirmed";
      result.evidence = confirmed.evidence.slice();
      result.notes = (confirmed.notes || []).slice();
      result.snes = confirmed.snes || null;
      if (ext && ext[1] !== confirmed.family) {
        result.conflict = true;
        result.notes.push(
          "The file extension (." + extension + ") suggests " + ext[0] + ", but the file's own header says " + confirmed.platform + ". Trust the header; the file may just have the wrong extension."
        );
      }
      return result;
    }

    if (ext) {
      result.platform = ext[0];
      result.family = ext[1];
      result.confidence = "extension-only";
      result.evidence = ["Based on the file extension (." + extension + ") only — no matching header was found to confirm it"];
      if (ext[1] === "snes") {
        result.snes = { mapping: null, copierHeader: false, validated: false, sizeSuggestsHeader: size % 1024 === 512 };
        if (size % 1024 === 512) {
          result.notes.push("The file size ends in 512 bytes beyond a whole number of kilobytes, which is typical of a 512-byte SNES copier header.");
        }
      }
      result.notes.push(
        "Hacked, translated or trimmed ROMs sometimes fail header checks, so this is not necessarily a problem — it just isn't confirmed."
      );
      return result;
    }

    // No extension hint, no header match: a copier-header-sized SNES dump with a damaged header, or something else entirely.
    return result;
  }

  // ------------------------------------------------------------------ IPS inspection

  /**
   * Walks an IPS patch's records. IPS embeds no checksum, so this can never prove compatibility; it only
   * reports facts (record count, how far into the ROM the patch writes) used for gentle warnings.
   */
  function scanIps(u8) {
    var out = { valid: false, records: 0, highestEnd: 0, truncateTo: null, rle: 0 };
    if (!u8 || u8.length < 8) return out;
    var magic = "PATCH";
    for (var m = 0; m < 5; m++) if (u8[m] !== magic.charCodeAt(m)) return out;
    var p = 5;
    while (p + 3 <= u8.length) {
      if (u8[p] === 0x45 && u8[p + 1] === 0x4f && u8[p + 2] === 0x46) {
        out.valid = true;
        if (p + 3 + 3 === u8.length) out.truncateTo = (u8[p + 3] << 16) | (u8[p + 4] << 8) | u8[p + 5];
        return out;
      }
      if (p + 5 > u8.length) return out;
      var offset = (u8[p] << 16) | (u8[p + 1] << 8) | u8[p + 2];
      var length = (u8[p + 3] << 8) | u8[p + 4];
      p += 5;
      if (length === 0) {
        if (p + 3 > u8.length) return out;
        length = (u8[p] << 8) | u8[p + 1];
        p += 3;
        out.rle++;
      } else {
        p += length;
        if (p > u8.length) return out;
      }
      out.records++;
      if (offset + length > out.highestEnd) out.highestEnd = offset + length;
    }
    return out;
  }

  // ------------------------------------------------------------------ patch format knowledge

  var FORMAT_LABELS = {
    IPS: "IPS",
    UPS: "UPS",
    BPS: "BPS",
    VCDIFF: "xdelta",
    APS: "APS (N64)",
    APSGBA: "APS (GBA)",
    PPF: "PPF",
    RUP: "RUP",
    BDF: "BDF",
    PMSR: "PMSR",
  };

  /**
   * What each format can really tell us about the ROM it was made for.
   *  checksum  CRC32 of the whole original ROM is stored in the patch (UPS, BPS)
   *  md5       MD5 of the original (and result) is stored (RUP)
   *  header    only part of the original's header is compared (APS N64)
   *  blocks    file size + CRC16 of every changed block is stored (APS GBA)
   *  fixed     the patch is for exactly one known ROM, checked by CRC32 (PMSR)
   *  none      nothing is stored — compatibility can't be checked (IPS, PPF, BDF, xdelta)
   */
  var FORMAT_VALIDATION = {
    IPS: "none",
    UPS: "checksum",
    BPS: "checksum",
    VCDIFF: "none",
    APS: "header",
    APSGBA: "blocks",
    PPF: "none",
    RUP: "md5",
    BDF: "none",
    PMSR: "fixed",
  };

  function formatLabel(name) {
    return (name && FORMAT_LABELS[name]) || (name ? String(name) : "Unknown");
  }

  function validationKind(name) {
    return (name && FORMAT_VALIDATION[name]) || "none";
  }

  /**
   * What a specific patch can verify. Differs from validationKind(format) when the file itself says
   * it carries no validation data (e.g. an APS patch in its plain, non-N64 mode records no ROM data).
   */
  function kindFor(patch) {
    if (!patch || !patch.recognized || patch.noValidation) return "none";
    return validationKind(patch.format);
  }

  // ------------------------------------------------------------------ the compatibility report

  function showSize(n) {
    return patchCompat().showSize(n);
  }

  function showCrc(n) {
    return patchCompat().showCrc(n);
  }

  function isNum(n) {
    return typeof n === "number" && isFinite(n);
  }

  var SNES_EXTENSIONS = { sfc: 1, smc: 1, swc: 1, fig: 1 };

  /** Header-related findings that can be stated without guessing. */
  function headerFindings(rom, patch, platform) {
    var findings = [];
    var snes = platform && platform.snes;
    var size = rom.size;
    var expected = isNum(patch.sourceSize) ? patch.sourceSize : null;
    var isSnes = platform && platform.family === "snes";
    var sizeLooksHeadered = size % 1024 === 512;

    if (!isSnes && !sizeLooksHeadered) return findings;

    if (rom.headerless) {
      findings.push({
        level: "info",
        title: "Your ROM has a " + rom.headerless.headerSize + "-byte " + rom.headerless.name + " header",
        message:
          "PatchMyROM recognises this header, sets it aside while checking and patching, and puts it back on the result. " +
          "Compatibility was checked on the ROM without it, the same way the patcher does.",
      });
      return findings;
    }

    if (isSnes && sizeLooksHeadered) {
      var ext = platform.extension;
      if (SNES_EXTENSIONS[ext]) {
        // The patching library handles it only for the extensions it knows AND sizes that are multiples of 256 KB.
        findings.push({
          level: "warning",
          title: "Your SNES ROM looks like it has a 512-byte copier header",
          message:
            "Its size is a whole number of kilobytes plus 512 bytes" +
            (snes && snes.validated ? ", and its internal header was found 512 bytes later than normal" : "") +
            ". PatchMyROM only removes a copier header automatically when the file size matches a standard SNES ROM size exactly, and this one doesn't, so it won't guess. " +
            "If the patch expects a header-less ROM, remove the 512-byte header with a dedicated tool and check the result against the patch author's checksum.",
        });
      } else {
        findings.push({
          level: "warning",
          title: "Your SNES ROM looks like it has a 512-byte copier header",
          message:
            "The file size is a whole number of kilobytes plus 512 bytes, which is typical of a copier header, but the file extension (." +
            (ext || "none") +
            ") isn't a SNES one, so PatchMyROM can't treat it as a header safely. Renaming to .sfc or .smc lets the patcher recognise standard SNES sizes; PatchMyROM never strips bytes it can't positively identify.",
        });
      }
    } else if (isSnes && expected !== null && expected === size + 512) {
      findings.push({
        level: "warning",
        title: "The patch expects a ROM with a 512-byte copier header",
        message:
          "The patch was made for a file " +
          showSize(expected) +
          ", which is exactly 512 bytes more than yours. Your ROM looks header-less. " +
          "PatchMyROM can't invent that header for you; use a copy of the ROM with the header the patch's author used, or ask for a header-less version of the patch.",
      });
    } else if (isSnes && expected !== null && size === expected + 512) {
      findings.push({
        level: "warning",
        title: "Your ROM is 512 bytes larger than the patch expects",
        message:
          "The patch was made for " +
          showSize(expected) +
          " and your file is exactly 512 bytes larger, the size of a SNES copier header. Remove that header and check again.",
      });
    }
    return findings;
  }

  /**
   * Turns everything the compatibility worker learned into the three outcomes people care about.
   *
   * @param {object} input
   * @param {{fileName:string,size:number,crc32:string,headerless?:{name:string,headerSize:number,size:number,crc32:string}|null,platform?:object}} input.rom
   * @param {{fileName:string,size:number,recognized:boolean,format:string|null,title?:string|null,sourceSize:number|null,
   *   targetSize:number|null,sourceCrc32:string|null,targetCrc32:string|null,ips?:object|null,
   *   problem?:{code:string,message:string}|null}} input.patch
   * @param {{kind:string, ok:boolean, undo?:boolean, viaHeader?:boolean}|null} input.validation result of the
   *   vendored library's own validateSource() for formats that have one beyond UPS/BPS (RUP, APS, PMSR)
   * @returns {{state:"compatible"|"mismatch"|"cannot-verify", code:string, level:"ok"|"warning"|"unknown"|"info",
   *   headline:string, summary:string, alreadyPatched:boolean, verification:string,
   *   evidence:{label:string,value:string,status:"ok"|"bad"|"info"}[],
   *   findings:{level:string,title:string,message:string}[], steps:string[]}}
   */
  function buildCompatReport(input) {
    var rom = (input && input.rom) || {};
    var patch = (input && input.patch) || {};
    var validation = (input && input.validation) || null;
    var platform = rom.platform || null;
    var label = formatLabel(patch.format);
    var kind = kindFor(patch);

    var report = {
      state: "cannot-verify",
      code: "unknown",
      level: "unknown",
      headline: "",
      summary: "",
      alreadyPatched: false,
      verification: "",
      evidence: [],
      findings: [],
      steps: [],
    };

    function ev(labelText, value, status) {
      report.evidence.push({ label: labelText, value: value, status: status || "info" });
    }

    ev("Your ROM", (rom.fileName || "ROM") + " · " + showSize(rom.size) + " · CRC32 " + showCrc(rom.crc32));
    if (platform && platform.platform) {
      ev(
        "Platform",
        platform.platform + (platform.confidence === "confirmed" ? " (confirmed from the file header)" : platform.confidence === "extension-only" ? " (from the file extension only)" : "")
      );
    }
    ev("Patch", (patch.fileName || "patch") + " · " + label + (patch.title ? " · “" + patch.title + "”" : ""));

    report.findings = headerFindings(rom, patch, platform);
    if (platform && platform.conflict) {
      report.findings.push({ level: "info", title: "File extension and header disagree", message: platform.notes[platform.notes.length - 1] });
    }

    // ---- a patch we can't even read
    if (patch.problem) {
      report.state = "cannot-verify";
      report.code = patch.problem.code || "patch-unreadable";
      report.level = "warning";
      report.headline = "The patch file couldn't be checked";
      report.summary = patch.problem.message;
      report.verification = "Nothing was compared: the patch itself isn't usable.";
      report.steps = [
        "Download the patch again from its original source and avoid editing or re-saving it.",
        "Make sure the file really is a patch (.ips, .ups, .bps, .xdelta …) and not a zip, a readme or a web page saved with the wrong extension.",
        "If it was inside a .zip or .rar archive, extract the patch first.",
      ];
      return report;
    }

    if (!patch.recognized) {
      report.code = "patch-unrecognized";
      report.level = "warning";
      report.headline = "This isn't a patch format PatchMyROM recognises";
      report.summary =
        "The file doesn't start with the signature of any supported patch format (IPS, UPS, BPS, xdelta, APS, PPF, RUP, BDF or PMSR), so nothing can be checked against your ROM.";
      report.verification = "Nothing was compared.";
      report.steps = [
        "Check that you selected the patch and not the ROM (or the other way round).",
        "Extract the patch from its .zip/.rar archive if it came in one.",
        "Download it again — a partly downloaded or text-converted file loses its signature.",
      ];
      return report;
    }

    // ---- UPS / BPS: the patch stores the CRC32 and size of the original ROM
    if (kind === "checksum") {
      var verdict = patchCompat().classify({
        rom: { size: rom.size, crc32: rom.crc32, headerless: rom.headerless },
        patch: { sourceSize: patch.sourceSize, targetSize: patch.targetSize, sourceCrc32: patch.sourceCrc32, targetCrc32: patch.targetCrc32 },
      });
      report.verification = label + " stores the CRC32 and size of the original ROM, and they were compared with yours.";
      ev("Original ROM this patch needs", "CRC32 " + showCrc(patch.sourceCrc32) + (isNum(patch.sourceSize) ? " · " + showSize(patch.sourceSize) : ""), "info");
      if (verdict.status === "compatible") {
        report.state = "compatible";
        report.level = "ok";
        report.code = verdict.code;
        report.headline = "Compatible: this is the ROM the patch was made for";
        report.summary = verdict.message;
        ev("Result", "CRC32 and size match", "ok");
        report.steps = [
          "Open the PatchMyROM patcher and apply the patch to this same file; it runs this check again before patching.",
          "Keep an untouched backup of your original ROM.",
        ];
      } else if (verdict.status === "already-patched") {
        report.state = "mismatch";
        report.level = "info";
        report.code = verdict.code;
        report.alreadyPatched = true;
        report.headline = "Mismatch: this ROM is already patched";
        report.summary = verdict.message;
        ev("Result", "Your file matches the finished, patched ROM", "bad");
        report.steps = [
          "You don't need to patch this file again — it already is the result of this patch.",
          "To patch again, start from the original, unmodified ROM.",
        ];
      } else if (verdict.status === "incompatible") {
        report.state = "mismatch";
        report.level = "warning";
        report.code = verdict.code;
        report.headline = "Mismatch: this isn't the ROM the patch needs";
        report.summary = verdict.message;
        ev("Result", "CRC32 or size differ", "bad");
        report.steps = mismatchSteps(rom, patch, platform);
      } else {
        report.state = "cannot-verify";
        report.level = "unknown";
        report.code = verdict.code;
        report.headline = "Cannot verify";
        report.summary = verdict.message;
        report.steps = unverifiableSteps(patch.format, rom);
      }
      return report;
    }

    // ---- a format that needs the whole ROM in memory, and the ROM is bigger than we are willing to load
    if ((kind === "md5" || kind === "header" || kind === "blocks" || kind === "fixed") && validation && validation.skipped === "too-large") {
      report.state = "cannot-verify";
      report.level = "unknown";
      report.code = "rom-too-large-for-validation";
      report.headline = "Cannot verify: this ROM is too large to check against a " + label + " patch in the browser";
      report.summary =
        label +
        " patches are validated by loading the whole ROM into memory at once. To keep your browser from running out of memory, PatchMyROM only does that for ROMs up to " +
        showSize(validation.limit) +
        ", and yours is " +
        showSize(rom.size) +
        ". Nothing is wrong with the patch or the ROM — they just can't be compared here.";
      report.verification = "No comparison was made: the ROM exceeds the " + showSize(validation.limit) + " limit for " + label + " validation.";
      ev("Size limit for " + label + " validation", showSize(validation.limit), "info");
      ev("Result", "Skipped to protect the browser from running out of memory", "info");
      report.steps = [
        "Check the exact base game, region and revision in the patch's readme, then compare your ROM's checksum with the one listed using the ROM Checksum Checker (it handles files of any size).",
        "Patching a ROM this large also needs a lot of memory. Use a desktop computer with other tabs closed, or the patch author's own tool.",
        "If you have a UPS, BPS or xdelta version of the same patch, use it: those can be checked and patched without this limit.",
      ];
      return report;
    }

    // ---- formats whose own library check exists (RUP / APS / PMSR)
    if ((kind === "md5" || kind === "header" || kind === "blocks" || kind === "fixed") && validation) {
      var how = {
        md5: label + " stores an MD5 of the original ROM, which was compared with the MD5 of yours (the patching library's own check).",
        header: label + " stores part of the original cartridge's header (its game ID and CRC), which was compared with yours. This does not cover the whole ROM.",
        blocks: label + " stores the original file size and a CRC16 of every block it changes, which were compared with your ROM.",
        fixed: label + " is made for exactly one known ROM, whose size and CRC32 were compared with yours.",
      };
      report.verification = how[kind];
      if (validation.ok && validation.undo) {
        report.state = "mismatch";
        report.level = "info";
        report.code = "rom-already-patched";
        report.alreadyPatched = true;
        report.headline = "Mismatch: this ROM is already patched";
        report.summary = "The file you selected matches the finished result of this patch, so there is nothing left to apply. To patch again, use the original, unmodified ROM.";
        ev("Result", "Your file matches the patched ROM", "bad");
        report.steps = [
          "You don't need to patch this file again — it already is the result of this patch.",
          "To patch again, start from the original, unmodified ROM.",
        ];
      } else if (validation.ok) {
        report.state = "compatible";
        report.level = "ok";
        report.code = "rom-compatible-" + kind;
        report.headline = "Compatible: this is the ROM the patch was made for";
        report.summary =
          kind === "header"
            ? "The cartridge header of your ROM matches the one this patch was made for. Because " + label + " only records the header, this is a strong but not a whole-file check."
            : "Your ROM matches the original this patch was made for.";
        ev("Result", "Validation data matches", "ok");
        report.steps = [
          "Open the PatchMyROM patcher and apply the patch to this same file; it runs this check again before patching.",
          "Keep an untouched backup of your original ROM.",
        ];
      } else {
        report.state = "mismatch";
        report.level = "warning";
        report.code = "rom-incompatible-" + kind;
        report.headline = "Mismatch: this isn't the ROM the patch needs";
        report.summary =
          "The validation data stored in this " + label + " patch doesn't match your ROM. This usually means a different game, region or revision, or a ROM that has already been modified.";
        ev("Result", "Validation data differs", "bad");
        report.steps = mismatchSteps(rom, patch, platform);
      }
      return report;
    }

    // ---- everything else: the format stores nothing to check against
    report.state = "cannot-verify";
    report.level = "unknown";
    report.code = kind === "none" ? "no-checksum" : "no-validation-data";
    report.headline = "Cannot verify: " + label + " patches don't include a checksum";
    report.summary = noChecksumSummary(patch.format);
    report.verification =
      "No comparison was possible. " + label + " does not store a checksum or size of the ROM it was made for, so any tool that says an " + label + " patch is “compatible” is guessing.";
    ev("Result", "Nothing to compare against", "info");

    if (patch.format === "IPS" && patch.ips && patch.ips.valid) {
      ev("IPS records", patch.ips.records + " (writes up to byte " + patch.ips.highestEnd + ")", "info");
      if (isNum(rom.size) && rom.size < patch.ips.highestEnd) {
        report.findings.push({
          level: "warning",
          title: "Your ROM is smaller than the area this patch writes to",
          message:
            "The patch writes data up to byte " +
            patch.ips.highestEnd +
            " (" +
            showSize(patch.ips.highestEnd) +
            ") and your ROM is only " +
            showSize(rom.size) +
            ". IPS patches are allowed to enlarge a ROM, so this does not prove a mismatch, but if the hack is not meant to expand the game it suggests the wrong base ROM or a trimmed dump.",
        });
      }
      if (isNum(rom.size) && rom.size > 0x1000000) {
        report.findings.push({
          level: "info",
          title: "IPS can only address the first 16 MB",
          message: "IPS offsets are 24-bit, so this patch can only change the first 16 MB of a ROM. That's normal for hacks of smaller games, but a ROM larger than that usually needs a BPS or xdelta patch.",
        });
      }
    }
    report.steps = unverifiableSteps(patch.format, rom);
    return report;
  }

  function noChecksumSummary(format) {
    if (format === "IPS") {
      return "IPS patches only store “write these bytes at this position”. PatchMyROM can't tell whether your ROM is the one the patch was made for, and neither can any other tool. Applying it to the wrong ROM does not fail — it produces a game that crashes or shows garbage.";
    }
    if (format === "VCDIFF") {
      return "xdelta (VCDIFF) patches don't record which ROM they were made for, so compatibility can't be proven in advance. Applying one to the wrong ROM either fails or produces a broken game.";
    }
    if (format === "PPF") {
      return "PPF patches may carry an optional validation block, but PatchMyROM does not rely on it, so compatibility can't be proven in advance. Applying one to the wrong disc image produces a broken result.";
    }
    return "This patch format doesn't store a checksum of the ROM it was made for, so compatibility can't be proven in advance.";
  }

  function unverifiableSteps(format, rom) {
    var steps = [
      "Find the exact base ROM on the patch's download page or readme: game, region and revision (for example USA v1.0 or Europe Rev 1).",
      "Check your ROM's checksum with the ROM Checksum Checker and compare it with the one the patch's author or a database such as No-Intro lists.",
      "If the patch is also offered as BPS or UPS, prefer that version: those formats verify the ROM before patching.",
      "After patching, test the game from the start. Crashes, a black screen or garbled graphics usually mean the base ROM was the wrong revision.",
    ];
    if (rom && rom.platform && rom.platform.family === "snes") {
      steps.push("For SNES, check whether the patch expects a ROM with or without the 512-byte copier header; the readme normally says.");
    }
    return steps;
  }

  function mismatchSteps(rom, patch, platform) {
    var steps = [
      "Check the patch's page or readme for the exact base game, region and revision it needs (for example FireRed USA v1.0 versus v1.1).",
      "Use a clean, unmodified dump. A ROM that is already patched, trainer-edited, translated, trimmed or expanded will not match.",
      "Compare your ROM's CRC32/SHA-1 with the one published for the right base ROM using the ROM Checksum Checker.",
    ];
    if (isNum(patch.sourceSize) && isNum(rom.size) && patch.sourceSize !== rom.size) {
      steps.push("The size differs from what the patch needs (" + showSize(patch.sourceSize) + " versus " + showSize(rom.size) + "), so this is most likely a different version of the game, or a trimmed or padded dump.");
    }
    if (platform && platform.family === "snes") {
      steps.push("For SNES, check whether the patch expects the ROM with or without its 512-byte copier header.");
    }
    return steps;
  }

  /** One plain-text copy of a report (for the “Copy report” button and bug reports). */
  function reportToPlainText(report) {
    var lines = [report.headline, "", report.summary, ""];
    if (report.verification) lines.push("How it was checked: " + report.verification, "");
    report.evidence.forEach(function (e) {
      lines.push(e.label + ": " + e.value);
    });
    if (report.findings.length) {
      lines.push("");
      report.findings.forEach(function (f) {
        lines.push("• " + f.title + " — " + f.message);
      });
    }
    if (report.steps.length) {
      lines.push("", "What to do next:");
      report.steps.forEach(function (s, i) {
        lines.push(i + 1 + ". " + s);
      });
    }
    lines.push("", "Checked locally in the browser with PatchMyROM — no file was uploaded.");
    return lines.join("\n");
  }

  return {
    ALGORITHMS: ALGORITHMS,
    WHOLE_ROM_LIMIT: WHOLE_ROM_LIMIT,
    HEAD_BYTES: HEAD_BYTES,
    EXTRA_PROBES: EXTRA_PROBES,
    EXTENSION_PLATFORM: EXTENSION_PLATFORM,
    parseExpectedChecksums: parseExpectedChecksums,
    compareChecksums: compareChecksums,
    detectPlatform: detectPlatform,
    scanIps: scanIps,
    formatLabel: formatLabel,
    validationKind: validationKind,
    kindFor: kindFor,
    buildCompatReport: buildCompatReport,
    reportToPlainText: reportToPlainText,
  };
});
