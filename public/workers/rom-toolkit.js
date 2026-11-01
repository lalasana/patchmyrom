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
 *     really embeds) of the WHOLE original ROM was compared and matched. IPS, PPF, BDF and xdelta
 *     embed none, so they are always "cannot-verify" — never "compatible". APS (N64) stores only a
 *     game ID and header checksums and APS (GBA) only the checksums of the blocks it changes: a match
 *     there is reported as "cannot-verify" with the partial match explained; a difference is still a
 *     real "mismatch".
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

  var MB = 1024 * 1024;

  /**
   * Hard ceiling for the ROM size the compatibility checker will load into memory whole. Only RUP, APS and
   * PMSR patches need that (their validateSource() in the patching library reads the ROM at arbitrary
   * offsets or hashes it as one block); UPS, BPS, IPS, xdelta and PPF checks stream the ROM and are not
   * limited. Above the limit that applies to the device (see pickWholeRomLimit) the check reports "cannot
   * verify" with an explanation instead of risking the tab running out of memory.
   */
  var WHOLE_ROM_LIMIT = 256 * MB;

  /**
   * Limit used when the caller doesn't say what device it runs on (older callers, the Node tests): the
   * conservative mobile value. The app always passes pickWholeRomLimit(...) explicitly.
   */
  var DEFAULT_WHOLE_ROM_LIMIT = 64 * MB;

  /**
   * Chooses how large a ROM may be loaded whole on this device.
   *
   * Reasoning (measured, see README): validating a RUP or APS (GBA) patch peaks at about 1.2x the ROM size
   * in the worker (the ROM bytes plus the library's copy of them), plus the page itself. A phone browser
   * tab is killed far earlier than a desktop one and reports little about it, so:
   *   - 2 GB of device memory or less     -> 32 MB (also covers every GBA/NDS/SNES-sized ROM)
   *   - any mobile browser                -> 64 MB
   *   - desktop, memory not reported      -> 128 MB (Firefox and Safari don't expose deviceMemory)
   *   - desktop reporting less than 8 GB  -> 64 MB
   *   - desktop reporting 8 GB or more    -> 256 MB (the ceiling)
   * `deviceMemory` is the browser's rounded figure in GB (navigator.deviceMemory, capped at 8 by browsers).
   *
   * @param {{deviceMemory?:number|null, mobile?:boolean}} [env]
   * @returns {{bytes:number, tier:string, reason:string}}
   */
  function pickWholeRomLimit(env) {
    var memory = env && typeof env.deviceMemory === "number" && env.deviceMemory > 0 ? env.deviceMemory : null;
    var mobile = !!(env && env.mobile);
    if (memory !== null && memory <= 2) {
      return { bytes: 32 * MB, tier: "low-memory", reason: "this device reports " + memory + " GB of memory or less" };
    }
    if (mobile) return { bytes: 64 * MB, tier: "mobile", reason: "mobile browsers close tabs that use a lot of memory" };
    if (memory === null) return { bytes: 128 * MB, tier: "unknown-desktop", reason: "this browser doesn't report how much memory the device has" };
    if (memory < 8) return { bytes: 64 * MB, tier: "modest-memory", reason: "this device reports " + memory + " GB of memory" };
    return { bytes: WHOLE_ROM_LIMIT, tier: "desktop", reason: "this device reports 8 GB of memory or more" };
  }

  /** Reads the two facts pickWholeRomLimit needs from a navigator-like object (kept pure so it can be tested). */
  function deviceEnvironmentFrom(nav) {
    if (!nav) return {};
    var ua = typeof nav.userAgent === "string" ? nav.userAgent : "";
    var mobile;
    if (nav.userAgentData && typeof nav.userAgentData.mobile === "boolean") mobile = nav.userAgentData.mobile;
    else mobile = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(ua) || (nav.platform === "MacIntel" && typeof nav.maxTouchPoints === "number" && nav.maxTouchPoints > 1);
    return { deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null, mobile: !!mobile };
  }

  /**
   * How long the main thread should wait for a sign of life while the worker is inside one synchronous
   * step over `bytes` bytes (hashing the whole ROM for MD5, checking APS blocks). Generous on purpose:
   * a slow phone may only manage 2 MB/s, and a false "stopped responding" is worse than a longer wait.
   */
  function stageBudgetMs(bytes) {
    var n = typeof bytes === "number" && bytes > 0 ? bytes : 0;
    return 30000 + Math.ceil(n / (2 * MB)) * 1000;
  }

  /** Progress, rounded down to 0/25/50/75/100, for screen-reader announcements (so they aren't read out at every update). */
  function progressBucket(loaded, total) {
    if (!(total > 0) || loaded !== loaded) return 0; // also covers NaN
    var pct = Math.max(0, Math.min(100, (loaded / total) * 100));
    return Math.floor(pct / 25) * 25;
  }

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
      size: size,
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
    // The byte at 0xB5 and the six bytes after it are reserved and zero on every real GBA ROM. Together with the
    // two checks above, unrelated data matching by chance is practically impossible.
    for (var z = 0xb5; z <= 0xbb; z++) if (r.byte(z) !== 0) return null;
    return { platform: "Game Boy Advance", family: "gba", evidence: ["GBA header: fixed value 96h at 0xB2, a valid header complement check at 0xBD and the reserved bytes at 0xB5–0xBB all zero"] };
  }

  function checkNds(r) {
    if (!r.has(0, 0x160)) return null;
    var stored = r.u16le(0x15e);
    if (crc16Modbus(r, 0, 0x15e) !== stored) return null;
    // Nintendo's boot-logo checksum is the same constant (CF56h) in every DS/DSi header, and the unit code is 00h, 02h or 03h.
    if (r.u16le(0x15c) !== 0xcf56) return null;
    var unit = r.byte(0x12);
    if (unit !== 0x00 && unit !== 0x02 && unit !== 0x03) return null;
    var dsi = unit === 0x02 || unit === 0x03;
    return {
      platform: dsi ? "Nintendo DSi" : "Nintendo DS",
      family: "nds",
      evidence: ["Nintendo DS header with a valid header CRC16 at 0x15E, the standard boot-logo checksum (CF56h) and a valid unit code"],
    };
  }

  // Cartridge types that exist (0x147). Anything else in that byte is not a Game Boy header.
  var GB_CART_TYPES = {};
  [0x00, 0x01, 0x02, 0x03, 0x05, 0x06, 0x08, 0x09, 0x0b, 0x0c, 0x0d, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x20, 0x22, 0xfc, 0xfd, 0xfe, 0xff].forEach(function (t) {
    GB_CART_TYPES[t] = true;
  });

  function checkGameBoy(r) {
    if (!r.has(0, 0x150)) return null;
    var x = 0;
    for (var i = 0x134; i <= 0x14c; i++) x = (x - r.byte(i) - 1) & 0xff;
    if (x !== r.byte(0x14d)) return null;
    // The checksum alone is a 1-in-256 coincidence for any unrelated file, so the other fields have to make sense too:
    // a known cartridge type, a ROM-size code that exists, a RAM-size code that exists, and a size that is a whole
    // number of 16 KB banks.
    var romSize = r.byte(0x148);
    var validRomSize = romSize <= 0x08 || (romSize >= 0x52 && romSize <= 0x54);
    if (!GB_CART_TYPES[r.byte(0x147)] || !validRomSize || r.byte(0x149) > 0x05 || r.size % 0x4000 !== 0) return null;
    var cgb = r.byte(0x143);
    var platform = cgb === 0xc0 ? "Game Boy Color" : cgb === 0x80 ? "Game Boy Color (also runs on Game Boy)" : "Game Boy";
    return { platform: platform, family: "gameboy", evidence: ["Game Boy cartridge header with a valid header checksum at 0x14D and consistent cartridge, ROM-size and RAM-size fields"] };
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
        // The map-mode byte is 0x20–0x3F on every SNES ROM, and the ROM-size byte is a power of two up to 8 MB (2^13 KB).
        var mapMode = r.byte(h + 0x15);
        var romSizeCode = r.byte(h + 0x17);
        if (mapMode === -1 || (mapMode & 0xe0) !== 0x20 || romSizeCode === -1 || romSizeCode > 0x0d) continue;
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

  // ------------------------------------------------------------------ patch structure preflight

  // Same order and same prefixes as RomPatcher.parsePatchFile() uses to pick a parser.
  var PATCH_MAGICS = [
    ["IPS", "PATCH"],
    ["UPS", "UPS1"],
    ["APS", "APS10"],
    ["APSGBA", "APS1"],
    ["BPS", "BPS1"],
    ["RUP", "NINJA2"],
    ["PPF", "PPF"],
    ["BDF", "BSDIFF40"],
    ["PMSR", "PMSR"],
  ];

  function startsWithAscii(u8, text, at) {
    var base = at || 0;
    if (!u8 || u8.length < base + text.length) return false;
    for (var i = 0; i < text.length; i++) if (u8[base + i] !== text.charCodeAt(i)) return false;
    return true;
  }

  /** The patch format a file claims to be from its first bytes, or null. Says nothing about whether the file is intact. */
  function detectPatchFormat(u8) {
    for (var i = 0; i < PATCH_MAGICS.length; i++) if (startsWithAscii(u8, PATCH_MAGICS[i][1])) return PATCH_MAGICS[i][0];
    if (u8 && u8.length >= 3 && u8[0] === 0xd6 && u8[1] === 0xc3 && u8[2] === 0xc4) return "VCDIFF";
    return null;
  }

  function structureDamaged(format, detail) {
    return {
      ok: false,
      code: "patch-corrupt",
      format: format,
      message:
        "This " +
        formatLabel(format) +
        " patch file is damaged or incomplete" +
        (detail ? ": " + detail : "") +
        ". Download the patch again from its original source, and don't edit it or transfer it as text.",
    };
  }

  function u32be(u8, at) {
    return ((u8[at] << 24) | (u8[at + 1] << 16) | (u8[at + 2] << 8) | u8[at + 3]) >>> 0;
  }

  /**
   * PMSR: "PMSR", a big-endian record count, then that many (offset, length, bytes) records. The patching library
   * allocates `length` array slots per record without looking at the file size, so a damaged count or length would
   * keep the worker busy (or out of memory) for as long as it likes. Every record must fit inside the file.
   */
  function preflightPmsr(u8) {
    if (u8.length < 8) return structureDamaged("PMSR", "it is too short to hold a record list");
    var count = u32be(u8, 4);
    if (count > Math.floor((u8.length - 8) / 8)) {
      return structureDamaged("PMSR", "it announces " + count + " records but the file is only " + u8.length + " bytes long");
    }
    var pos = 8;
    for (var i = 0; i < count; i++) {
      if (pos + 8 > u8.length) return structureDamaged("PMSR", "record " + (i + 1) + " is cut off");
      var length = u32be(u8, pos + 4);
      pos += 8;
      if (length > u8.length - pos) return structureDamaged("PMSR", "record " + (i + 1) + " claims " + length + " bytes but only " + (u8.length - pos) + " are left in the file");
      pos += length;
    }
    return { ok: true, format: "PMSR" };
  }

  /** Little-endian 64-bit number that the library can only read correctly when its upper four bytes are zero. */
  function u64leLow(u8, at) {
    if (u8[at + 4] || u8[at + 5] || u8[at + 6] || u8[at + 7]) return null;
    return (u8[at] | (u8[at + 1] << 8) | (u8[at + 2] << 16) | (u8[at + 3] << 24)) >>> 0;
  }

  function isBz2Stream(u8, at) {
    return startsWithAscii(u8, "BZh", at) && u8[at + 3] >= 0x31 && u8[at + 3] <= 0x39;
  }

  /**
   * BDF (bsdiff): 32-byte header (magic, control/diff compressed sizes, new size) followed by three bzip2 streams.
   * The library reads sizes with a 64-bit reader that only works when the upper four bytes are zero, then allocates
   * arrays of the sizes found in the (compressed) control stream. Checked here: the header numbers fit the file, each
   * stream starts like bzip2, and — when a bzip2 decoder is supplied — the control records fit the decompressed streams.
   * Decompressing here is the same work the library does next, and is as exposed to a "decompression bomb"; see README.
   */
  function preflightBdf(u8, deps) {
    if (u8.length < 32) return structureDamaged("BDF", "it is shorter than the 32-byte header");
    var control = u64leLow(u8, 8);
    var diff = u64leLow(u8, 16);
    var newSize = u64leLow(u8, 24);
    if (control === null || diff === null || newSize === null) return structureDamaged("BDF", "a size in its header is larger than 4 GB");
    if (control + diff > u8.length - 32) return structureDamaged("BDF", "its header announces " + (control + diff) + " bytes of compressed data but the file has only " + (u8.length - 32));
    var diffAt = 32 + control;
    var extraAt = diffAt + diff;
    if (!isBz2Stream(u8, 32) || !isBz2Stream(u8, diffAt) || !isBz2Stream(u8, extraAt)) return structureDamaged("BDF", "one of its three compressed sections is missing");
    var decompress = deps && deps.bz2 && typeof deps.bz2.decompress === "function" ? deps.bz2.decompress : null;
    if (!decompress) return { ok: true, format: "BDF" };

    var ctrl;
    var diffData;
    var extraData;
    try {
      ctrl = decompress(u8.subarray(32, diffAt));
      diffData = decompress(u8.subarray(diffAt, extraAt));
      extraData = decompress(u8.subarray(extraAt));
    } catch {
      return structureDamaged("BDF", "one of its compressed sections can't be decompressed");
    }
    if (ctrl.length % 24 !== 0) return structureDamaged("BDF", "its control data is not a whole number of records");
    var usedDiff = 0;
    var usedExtra = 0;
    for (var p = 0; p < ctrl.length; p += 24) {
      var diffLen = u64leLow(ctrl, p);
      var extraLen = u64leLow(ctrl, p + 8);
      if (diffLen === null || extraLen === null) return structureDamaged("BDF", "record " + (p / 24 + 1) + " has an impossible length");
      if (diffLen > diffData.length - usedDiff || extraLen > extraData.length - usedExtra) {
        return structureDamaged("BDF", "record " + (p / 24 + 1) + " asks for more data than its section holds");
      }
      usedDiff += diffLen;
      usedExtra += extraLen;
    }
    return { ok: true, format: "BDF" };
  }

  /**
   * RUP (NINJA 2): walks the command stream the way the library does and requires every variable-length number and every
   * length it announces to fit in the file. The library's number reader uses 32-bit shifts, so more than four bytes
   * (or a top bit set) can only mean damage.
   */
  function preflightRup(u8) {
    var len = u8.length;
    var pos = 0x800;
    var bad = null;

    function fail(detail) {
      if (!bad) bad = structureDamaged("RUP", detail);
      return null;
    }
    function vlv() {
      if (pos >= len) return fail("it ends in the middle of a number");
      var n = u8[pos++];
      if (n > 4 || pos + n > len) return fail("it contains a number that doesn't fit");
      var value = 0;
      for (var i = 0; i < n; i++) value += u8[pos++] << (i * 8);
      if (value < 0) return fail("it contains an impossible length");
      return value;
    }
    function skip(count, what) {
      if (count > len - pos) return fail(what + " is longer than the rest of the file");
      pos += count;
      return count;
    }

    var fileOpen = false;
    while (pos < len) {
      var command = u8[pos++];
      if (command === 0x00) break;
      if (command === 0x01) {
        var nameLength = vlv();
        if (nameLength === null || skip(nameLength, "a file name") === null) return bad;
        if (skip(1, "a ROM type") === null) return bad;
        var sourceSize = vlv();
        var targetSize = vlv();
        if (sourceSize === null || targetSize === null) return bad;
        if (skip(32, "its checksum block") === null) return bad;
        if (sourceSize !== targetSize) {
          if (pos >= len) return structureDamaged("RUP", "it ends in the middle of a file entry");
          var mode = u8[pos++];
          if (mode !== 0x4d && mode !== 0x41) return structureDamaged("RUP", "a file entry has an invalid overflow mode");
          var overflow = vlv();
          if (overflow === null || skip(overflow, "overflow data") === null) return bad;
        }
        fileOpen = true;
      } else if (command === 0x02) {
        if (!fileOpen) return structureDamaged("RUP", "it changes data before any file is opened");
        var offset = vlv();
        var xorLength = offset === null ? null : vlv();
        if (xorLength === null || skip(xorLength, "a record") === null) return bad;
      } else {
        return structureDamaged("RUP", "it contains an unknown command");
      }
    }
    return { ok: true, format: "RUP" };
  }

  /**
   * Checks the inside of a patch before the (unsafe on damaged input) library parser sees it: record counts, offsets and
   * declared lengths must fit the file. UPS/BPS keep their CRC-based check in PatchCompat.preflightPatch.
   * @param {Uint8Array} u8
   * @param {{bz2?:{decompress:function}}} [deps] bzip2 decoder from the vendored library (workers only)
   * @returns {{ok:true, format:string|null} | {ok:false, code:string, format:string, message:string}}
   */
  function preflightPatchStructure(u8, deps) {
    var format = detectPatchFormat(u8);
    if (format === "PMSR") return preflightPmsr(u8);
    if (format === "BDF") return preflightBdf(u8, deps);
    if (format === "RUP") return preflightRup(u8);
    return { ok: true, format: format };
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

  /** A memory limit as people think of it: "64 MB". */
  function limitLabel(bytes) {
    var mb = bytes / MB;
    return (mb === Math.floor(mb) ? String(mb) : mb.toFixed(1)) + " MB";
  }

  var SNES_EXTENSIONS = { sfc: 1, smc: 1, swc: 1, fig: 1 };

  /**
   * Header-related findings that can be stated without guessing.
   * `compared` says whether this patch's own data was really compared with the ROM; when it wasn't, no finding
   * may suggest that the header was part of a check.
   */
  function headerFindings(rom, patch, platform, compared) {
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
        message: compared
          ? "PatchMyROM recognises this header, sets it aside while checking and patching, and puts it back on the result. " +
            "The comparison with the patch was made on the ROM without it, the same way the patcher does."
          : "PatchMyROM recognises this header and sets it aside when patching, then puts it back on the result. " +
            "This patch stores nothing to compare, so no check was made on the ROM either with or without the header. " +
            "Whether the patch was made for a ROM with the header or without it is something only the patch's author can tell you.",
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
    var needsWholeRom = kind === "md5" || kind === "header" || kind === "blocks" || kind === "fixed";
    // Was the patch's own data really compared with the ROM? (Decides what the header notes may say.)
    var compared =
      !patch.problem &&
      !!patch.recognized &&
      (kind === "checksum" || (needsWholeRom && !!validation && validation.skipped !== "too-large" && validation.ok !== null && validation.ok !== undefined));
    // A patch whose magic says what it is but whose insides are broken is named for what it is, so the report doesn't
    // call it "Unknown" in one place and "damaged BPS" in another.
    var patchLabel = patch.problem ? (patch.format ? label + " (damaged or incomplete)" : "not readable") : label;

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
    ev("Patch", (patch.fileName || "patch") + " · " + patchLabel + (patch.title ? " · “" + patch.title + "”" : ""), patch.problem ? "bad" : "info");

    report.findings = headerFindings(rom, patch, platform, compared);
    if (platform && platform.conflict) {
      report.findings.push({ level: "info", title: "File extension and header disagree", message: platform.notes[platform.notes.length - 1] });
    }

    // ---- a patch we can't even read
    if (patch.problem) {
      report.state = "cannot-verify";
      report.code = patch.problem.code || "patch-unreadable";
      report.level = "warning";
      var damagedKnown = patch.problem.code === "patch-corrupt" && !!patch.format;
      report.headline = damagedKnown ? "The " + label + " patch is damaged or incomplete" : "The patch file couldn't be checked";
      report.summary = patch.problem.message;
      report.verification = "Nothing was compared: the patch itself isn't usable.";
      report.steps = damagedKnown
        ? [
            "Download the patch again from its original source and avoid editing or re-saving it.",
            "If it came inside a .zip or .rar archive, extract it with a standard tool and don't transfer it as text.",
            "If a fresh download behaves the same way, ask the patch's author for a new copy.",
          ]
        : [
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
    if (needsWholeRom && validation && validation.skipped === "too-large") {
      report.state = "cannot-verify";
      report.level = "unknown";
      report.code = "rom-too-large-for-validation";
      report.headline = "Cannot verify: this ROM is too large to check against a " + label + " patch on this device";
      report.summary =
        label +
        " patches are validated by loading the whole ROM into memory at once. To keep your browser from running out of memory, PatchMyROM only does that for ROMs up to " +
        limitLabel(validation.limit) +
        " on this device" +
        (validation.reason ? " (" + validation.reason + ")" : "") +
        ", and yours is " +
        showSize(rom.size) +
        ". Nothing is wrong with the patch or the ROM — they just can't be compared here.";
      report.verification = "No comparison was made: the ROM exceeds the " + limitLabel(validation.limit) + " limit for " + label + " validation on this device.";
      ev("Size limit for " + label + " validation", limitLabel(validation.limit), "info");
      ev("Result", "Skipped to protect the browser from running out of memory", "info");
      report.steps = [
        "Check the exact base game, region and revision in the patch's readme, then compare your ROM's checksum with the one listed using the ROM Checksum Checker (it handles files of any size).",
        "Patching a ROM this large also needs a lot of memory. Use a desktop computer with other tabs closed, or the patch author's own tool.",
        "If you have a UPS, BPS or xdelta version of the same patch, use it: those can be checked and patched without this limit.",
      ];
      if (validation.limit < WHOLE_ROM_LIMIT) {
        report.steps.splice(2, 0, "A computer with more memory is allowed to check larger ROMs (up to " + limitLabel(WHOLE_ROM_LIMIT) + "), so try this check there if you need an answer.");
      }
      return report;
    }

    // ---- formats whose own library check exists (RUP / APS / PMSR)
    if (needsWholeRom && validation) {
      var how = {
        md5: label + " stores an MD5 of the original ROM, which was compared with the MD5 of yours (the patching library's own check).",
        header: label + " stores only the original cartridge's game ID and the checksums from its header. Those were compared with yours; they do not cover the whole ROM.",
        blocks: label + " stores the original file size and a 16-bit checksum of each block it changes. Those were compared with your ROM; the parts of the ROM the patch doesn't touch were not.",
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
      } else if (validation.ok && (kind === "header" || kind === "blocks")) {
        // Everything the patch stores matched, but what it stores covers only part of the ROM — so this is evidence,
        // not proof, and it is reported as "cannot verify" with the partial match spelled out.
        report.state = "cannot-verify";
        report.level = "unknown";
        report.code = "partial-match-" + kind;
        report.headline = "Cannot fully verify: only part of this ROM could be compared";
        report.summary =
          kind === "header"
            ? "The game ID and header checksums stored in this " +
              label +
              " patch match your ROM. That is encouraging, but those values describe only the start of the cartridge (an N64 header checksum covers the first megabyte of game code), so they cannot prove that the rest of the file is the one the patch was made for. A different revision or an already modified ROM can share the same header."
            : "The file size and the 16-bit checksums of the blocks this " +
              label +
              " patch changes match your ROM. That is encouraging, but the rest of the ROM was not compared and a 16-bit checksum can match by chance, so it cannot prove this is the exact ROM the patch was made for.";
        ev("Result", "Partial match only — not a check of the whole ROM", "info");
        report.steps = [
          "For a firm answer, compare your ROM's CRC32 or SHA-1 with the value published for the base ROM, using the ROM Checksum Checker.",
          "If the patch is also offered as BPS or UPS, prefer that version: those formats verify the whole ROM before patching.",
          "If the patch's readme names the same game, region and revision as your ROM, applying it is reasonable. Test the result from the start; crashes or garbled graphics point to the wrong base ROM.",
        ];
        var partialOrder = n64OrderStep(platform);
        if (partialOrder) report.steps.push(partialOrder);
      } else if (validation.ok) {
        report.state = "compatible";
        report.level = "ok";
        report.code = "rom-compatible-" + kind;
        report.headline = "Compatible: this is the ROM the patch was made for";
        report.summary = "Your ROM matches the original this patch was made for.";
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
    var order = n64OrderStep(rom && rom.platform);
    if (order) steps.push(order);
    return steps;
  }

  /** N64 dumps come in three byte orders; nearly every patch is made for the big-endian one (.z64). */
  function n64OrderStep(platform) {
    if (!platform || platform.family !== "n64" || platform.confidence !== "confirmed") return null;
    var swapped = (platform.notes || []).some(function (note) {
      return /byte-swapped|little-endian/i.test(note);
    });
    return swapped
      ? "Your N64 dump is not in the big-endian (.z64) byte order that nearly all patches are made for. Convert it to .z64 with a byte-order tool, then check it again — the checksum of a converted copy is different from this one."
      : null;
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
    var order = n64OrderStep(platform);
    if (order) steps.push(order);
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
    DEFAULT_WHOLE_ROM_LIMIT: DEFAULT_WHOLE_ROM_LIMIT,
    pickWholeRomLimit: pickWholeRomLimit,
    deviceEnvironmentFrom: deviceEnvironmentFrom,
    stageBudgetMs: stageBudgetMs,
    progressBucket: progressBucket,
    detectPatchFormat: detectPatchFormat,
    preflightPatchStructure: preflightPatchStructure,
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
