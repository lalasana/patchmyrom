// Regression tests for the ROM toolkit: streaming hashes, checksum parsing/comparison, platform
// detection from headers, and the ROM & patch compatibility verdicts.
//
// Fixtures are synthetic (seeded PRNG + the public header-check algorithms) — see helpers/rom-fixtures.mjs.
// The workers under test are the real files from public/workers, run through the same vm harness as
// the rest of the suite, so what is verified is exactly what ships to browsers.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import zlib from "node:zlib";
import vm from "node:vm";
import { createRequire } from "node:module";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import * as fx from "./helpers/fixtures.mjs";
import * as roms from "./helpers/rom-fixtures.mjs";

const require = createRequire(import.meta.url);
const StreamHash = require("../public/workers/stream-hash.js");
const RomToolkit = require("../public/workers/rom-toolkit.js");

// objects coming out of the worker's vm context have a different Object.prototype; compare plain copies
const plain = (value) => JSON.parse(JSON.stringify(value));
const sha = (algo, bytes) => crypto.createHash(algo).update(bytes).digest("hex");
const crcHex = (bytes) => (zlib.crc32(bytes) >>> 0).toString(16).padStart(8, "0");

// ================================================================== streaming hashes

describe("streaming hashers", () => {
  const sizes = [0, 1, 55, 56, 63, 64, 65, 120, 4096, 100_003];
  const chunkSizes = [1, 13, 64, 1000, 65_536];

  for (const size of sizes) {
    test(`CRC32 / MD5 / SHA-1 / SHA-256 equal node's for ${size} bytes, whatever the chunking`, () => {
      const data = fx.randomBytes(size, size + 3);
      const expected = { crc32: crcHex(data), md5: sha("md5", data), sha1: sha("sha1", data), sha256: sha("sha256", data) };
      for (const chunk of chunkSizes) {
        const all = StreamHash.createAll();
        for (let i = 0; i < size; i += chunk) all.update(data.subarray(i, Math.min(size, i + chunk)));
        assert.deepEqual(all.digest(), expected, `chunk size ${chunk}`);
      }
    });
  }

  test("well-known vectors", () => {
    const text = new TextEncoder().encode("abc");
    const all = StreamHash.createAll();
    all.update(text);
    assert.deepEqual(all.digest(), {
      crc32: "352441c2",
      md5: "900150983cd24fb0d6963f7d28e17f72",
      sha1: "a9993e364706816aba3e25717850c26c9cd0d89d",
      sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    });
  });
});

// ================================================================== checksum input

describe("parseExpectedChecksums", () => {
  const p = (text) => RomToolkit.parseExpectedChecksums(text);

  test("detects the algorithm from the length", () => {
    assert.deepEqual(p("1A2B3C4D"), { ok: true, items: [{ algorithm: "crc32", value: "1a2b3c4d" }] });
    assert.equal(p("d41d8cd98f00b204e9800998ecf8427e").items[0].algorithm, "md5");
    assert.equal(p("da39a3ee5e6b4b0d3255bfef95601890afd80709").items[0].algorithm, "sha1");
    assert.equal(p("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855").items[0].algorithm, "sha256");
  });

  test("tolerates labels, 0x prefixes, separators, case and surrounding whitespace", () => {
    assert.equal(p("  CRC32: 0x1A2B3C4D  ").items[0].value, "1a2b3c4d");
    assert.equal(p("sha-1 = DA39A3EE 5E6B4B0D 3255BFEF 95601890 AFD80709").items[0].value, "da39a3ee5e6b4b0d3255bfef95601890afd80709");
    assert.equal(p("1a:2b:3c:4d").items[0].value, "1a2b3c4d");
    assert.equal(p("1A2B3C4D (CRC32)").items[0].algorithm, "crc32");
  });

  test("accepts several values (one per line) but only one per algorithm", () => {
    const r = p("CRC32: 1A2B3C4D\nMD5: d41d8cd98f00b204e9800998ecf8427e");
    assert.equal(r.items.length, 2);
    assert.equal(p("1a2b3c4d\n1A2B3C4D").items.length, 1);
    assert.equal(p("1a2b3c4d\n11111111").ok, false);
  });

  test("a CRC32 printed without its leading zeros is accepted only when it is labelled as a CRC32", () => {
    assert.equal(p("crc32: 3705974").items[0].value, "03705974");
    assert.equal(p("3705974").ok, false);
  });

  test("rejects empty input, non-hex characters, wrong lengths and mislabelled values with a specific message", () => {
    assert.equal(p("   ").code, "empty");
    assert.equal(p("zz2b3c4d").code, "invalid-characters");
    assert.equal(p("1a2b3c").code, "unknown-length");
    assert.equal(p("sha1: 1a2b3c4d").code, "length-mismatch");
    assert.match(p("1a2b3c").message, /8 \(CRC32\), 32 \(MD5\), 40 \(SHA-1\) or 64 \(SHA-256\)/);
  });
});

describe("compareChecksums", () => {
  const hashes = { crc32: "1a2b3c4d", md5: "aa".repeat(16), sha1: "bb".repeat(20), sha256: "cc".repeat(32) };
  const items = (...pairs) => pairs.map(([algorithm, value]) => ({ algorithm, value }));

  test("matches when the compared algorithm agrees", () => {
    const r = RomToolkit.compareChecksums(hashes, items(["crc32", "1a2b3c4d"]));
    assert.equal(r.overall, "match");
    assert.equal(r.results[0].label, "CRC32");
  });

  test("a single wrong value is a mismatch, and every compared value is reported", () => {
    const r = RomToolkit.compareChecksums(hashes, items(["crc32", "1a2b3c4d"], ["sha1", "dd".repeat(20)]));
    assert.equal(r.overall, "mismatch");
    assert.deepEqual(r.results.map((x) => x.match), [true, false]);
  });

  test("an empty comparison is never a match", () => {
    assert.equal(RomToolkit.compareChecksums(hashes, []).overall, "mismatch");
  });
});

// ================================================================== platform detection

describe("detectPlatform: header-confirmed vs extension-only", () => {
  const detect = (name, bytes) => RomToolkit.detectPlatform({ fileName: name, size: bytes.length, head: bytes.subarray(0, RomToolkit.HEAD_BYTES) });

  test("GBA", () => {
    const r = detect("game.gba", roms.makeGba());
    assert.equal(r.platform, "Game Boy Advance");
    assert.equal(r.confidence, "confirmed");
    assert.equal(r.conflict, false);
  });

  test("a GBA-shaped file with a broken header is NOT confirmed — it falls back to the extension and says so", () => {
    const broken = roms.makeGba();
    broken[0xbd] ^= 0xff;
    const r = detect("hack.gba", broken);
    assert.equal(r.confidence, "extension-only");
    assert.equal(r.platform, "Game Boy Advance");
    assert.match(r.evidence[0], /extension/i);
  });

  test("Nintendo DS (header CRC16)", () => {
    const r = detect("game.nds", roms.makeNds());
    assert.equal(r.platform, "Nintendo DS");
    assert.equal(r.confidence, "confirmed");
  });

  test("Game Boy vs Game Boy Color from the CGB flag", () => {
    assert.equal(detect("a.gb", roms.makeGameBoy(0x8000, 3, 0x00)).platform, "Game Boy");
    assert.equal(detect("a.gbc", roms.makeGameBoy(0x8000, 3, 0xc0)).platform, "Game Boy Color");
    assert.match(detect("a.gb", roms.makeGameBoy(0x8000, 3, 0x80)).platform, /Game Boy Color/);
  });

  test("NES (iNES magic) and N64 in all three byte orders", () => {
    assert.equal(detect("a.nes", roms.makeNes()).platform, "NES");
    for (const order of ["z64", "v64", "n64"]) {
      const r = detect(`a.${order}`, roms.makeN64(order));
      assert.equal(r.platform, "Nintendo 64", order);
      assert.equal(r.confidence, "confirmed");
    }
    assert.ok(detect("a.v64", roms.makeN64("v64")).notes.some((n) => /byte-swapped/.test(n)));
  });

  test("Genesis and Master System / Game Gear", () => {
    assert.equal(detect("a.md", roms.makeGenesis()).platform, "Sega Genesis / Mega Drive");
    assert.equal(detect("a.sms", roms.makeSms(4)).platform, "Sega Master System");
    assert.equal(detect("a.gg", roms.makeSms(6)).platform, "Sega Game Gear");
  });

  test("SNES: LoROM and HiROM headers are confirmed by their checksum pair", () => {
    const lo = detect("a.sfc", roms.makeSnes(0x80000, 4, { mapping: "lorom" }));
    assert.equal(lo.platform, "SNES");
    assert.equal(lo.confidence, "confirmed");
    assert.equal(lo.snes.mapping, "LoROM");
    assert.equal(lo.snes.copierHeader, false);
    assert.equal(detect("a.sfc", roms.makeSnes(0x100000, 5, { mapping: "hirom" })).snes.mapping, "HiROM");
  });

  test("SNES with a 512-byte copier header is recognised from where the internal header sits", () => {
    const r = detect("a.smc", roms.makeSnes(0x80000, 4, { copierHeader: true }));
    assert.equal(r.confidence, "confirmed");
    assert.equal(r.snes.copierHeader, true);
    assert.ok(r.evidence.some((e) => /512-byte copier header/.test(e)));
  });

  test("the header wins over a misleading extension, and the disagreement is reported", () => {
    const r = detect("game.gba", roms.makeNds());
    assert.equal(r.platform, "Nintendo DS");
    assert.equal(r.conflict, true);
    assert.ok(r.notes.some((n) => /extension/.test(n)));
  });

  test("random data with no extension is unknown, not guessed", () => {
    const r = detect("mystery", fx.randomBytes(5000, 99));
    assert.equal(r.platform, null);
    assert.equal(r.confidence, "unknown");
  });

  test("an empty or tiny file does not throw", () => {
    assert.equal(detect("a.gba", new Uint8Array(0)).confidence, "extension-only");
    assert.equal(detect("a.sfc", new Uint8Array(10)).platform, "SNES");
  });
});

// ================================================================== IPS inspection

describe("scanIps", () => {
  test("counts records and finds how far the patch writes", () => {
    const ips = fx.buildIps([
      { offset: 0x10, bytes: [1, 2, 3] },
      { offset: 0x2000, bytes: Array(40).fill(7) },
    ]);
    const r = RomToolkit.scanIps(ips);
    assert.deepEqual({ valid: r.valid, records: r.records, highestEnd: r.highestEnd, truncateTo: r.truncateTo }, { valid: true, records: 2, highestEnd: 0x2000 + 40, truncateTo: null });
  });

  test("a truncated or non-IPS file is reported as invalid, never as a crash", () => {
    assert.equal(RomToolkit.scanIps(fx.buildIps([{ offset: 0, bytes: [1] }]).subarray(0, 9)).valid, false);
    assert.equal(RomToolkit.scanIps(fx.randomBytes(40, 1)).valid, false);
    assert.equal(RomToolkit.scanIps(new Uint8Array(0)).valid, false);
  });
});

// ================================================================== hash worker

describe("hash worker", () => {
  const run = (file) => createWorker("hash-worker.js").run({ type: "hash-file", requestId: "h1", file });

  test("returns the four hashes, size and platform for a small ROM", async () => {
    const rom = roms.makeGba(0x20000, 21);
    const result = await run(fakeFile(rom, "synthetic.gba"));
    assert.equal(result.type, "hash-result");
    assert.deepEqual(plain(result.data.hashes), { crc32: crcHex(rom), md5: sha("md5", rom), sha1: sha("sha1", rom), sha256: sha("sha256", rom) });
    assert.equal(result.data.fileSize, rom.length);
    assert.equal(result.data.platform.platform, "Game Boy Advance");
    assert.equal(result.data.platform.confidence, "confirmed");
  });

  test("progress is reported monotonically and ends at the file size", async () => {
    const rom = fx.randomBytes(10 * 1024 * 1024, 5);
    const result = await run(fakeFile(rom, "big.bin"));
    const progress = result.log.filter((m) => m.type === "hash-progress").map((m) => m.loaded);
    assert.ok(progress.length >= 3);
    assert.deepEqual(progress, [...progress].sort((a, b) => a - b));
    assert.equal(progress.at(-1), rom.length);
  });

  test("an empty file hashes to the well-known empty digests", async () => {
    const result = await run(fakeFile(new Uint8Array(0), "empty.gba"));
    assert.equal(result.data.hashes.crc32, "00000000");
    assert.equal(result.data.hashes.md5, "d41d8cd98f00b204e9800998ecf8427e");
    assert.equal(result.data.hashes.sha1, "da39a3ee5e6b4b0d3255bfef95601890afd80709");
  });

  test("SNES files bigger than the kept header window are still recognised (extra probe locations)", async () => {
    // ExHiROM-style header at 0x40FFC0 in a 6 MB file
    const rom = fx.randomBytes(0x600000, 31);
    const h = 0x40ffc0;
    rom[h + 0x1c] = 0x00;
    rom[h + 0x1d] = 0xff;
    rom[h + 0x1e] = 0xff;
    rom[h + 0x1f] = 0x00;
    const result = await run(fakeFile(rom, "big.sfc"));
    assert.equal(result.data.platform.confidence, "confirmed");
    assert.equal(result.data.platform.snes.mapping, "ExHiROM");
  });

  test("large files are read in bounded chunks — never as one big read (memory stays flat)", async () => {
    const SIZE = 48 * 1024 * 1024;
    const gen = (i) => (i * 31 + (i >>> 9)) & 0xff;
    const reads = [];
    const lazy = {
      name: "huge.bin",
      type: "",
      size: SIZE,
      lastModified: 0,
      slice(start, end) {
        reads.push(end - start);
        return {
          arrayBuffer: async () => {
            const out = new Uint8Array(end - start);
            for (let i = 0; i < out.length; i++) out[i] = gen(start + i);
            return out.buffer;
          },
        };
      },
    };
    // expected values, hashed the same chunked way with node's own implementations
    const md5 = crypto.createHash("md5");
    const sha256 = crypto.createHash("sha256");
    let crc = 0;
    for (let start = 0; start < SIZE; start += 1 << 20) {
      const part = new Uint8Array(Math.min(1 << 20, SIZE - start));
      for (let i = 0; i < part.length; i++) part[i] = gen(start + i);
      md5.update(part);
      sha256.update(part);
      crc = zlib.crc32(part, crc);
    }
    const result = await run(lazy);
    assert.equal(result.data.hashes.md5, md5.digest("hex"));
    assert.equal(result.data.hashes.sha256, sha256.digest("hex"));
    assert.equal(result.data.hashes.crc32, (crc >>> 0).toString(16).padStart(8, "0"));
    const biggest = Math.max(...reads);
    assert.ok(biggest <= 4 * 1024 * 1024, `largest single read was ${biggest} bytes`);
    assert.ok(reads.length >= SIZE / (4 * 1024 * 1024), "the file was read in many chunks");
  });

  test("an unreadable file produces a friendly error instead of hanging", async () => {
    const broken = {
      name: "gone.gba",
      size: 100,
      slice() {
        return {
          arrayBuffer: async () => {
            throw Object.assign(new Error("denied"), { name: "NotReadableError" });
          },
        };
      },
    };
    const result = await run(broken);
    assert.equal(result.type, "error");
    assert.match(result.message, /couldn't read this file/i);
  });
});

// ================================================================== compatibility worker

const ctxOf = (worker) => worker.context;

/** Builds a patch with the vendored library inside the worker's own context (for formats the fixtures don't encode). */
function buildWithLibrary(worker, format, original, modified) {
  const ctx = ctxOf(worker);
  ctx.__orig = original;
  ctx.__mod = modified;
  const code = `(function(){
    var a = new BinFile(__orig); a.fileName = "a.gba";
    var b = new BinFile(__mod); b.fileName = "b.gba";
    var p = RomPatcher.createPatch(a, b, ${JSON.stringify(format)});
    return Array.from(p.export("x")._u8array);
  })()`;
  return Uint8Array.from(vm.runInContext(code, ctx));
}

describe("compatibility worker: UPS / BPS (checksum formats)", () => {
  const SOURCE = roms.makeGba(0x20000, 41);
  const TARGET = fx.applyEdits(SOURCE, [{ offset: 0x400, bytes: [9, 9, 9, 9] }, { offset: 0x5000, bytes: [1, 2, 3] }]);
  const check = (romBytes, patchBytes, names = ["game.gba", "hack.bps"]) =>
    createWorker("compat-worker.js").run({ type: "check-compat", requestId: "c1", rom: fakeFile(romBytes, names[0]), patch: fakeFile(patchBytes, names[1]) });

  for (const [label, build, name] of [
    ["BPS", fx.buildBps, "hack.bps"],
    ["UPS", fx.buildUps, "hack.ups"],
  ]) {
    test(`${label}: the right original is Compatible`, async () => {
      const r = await check(SOURCE, build(SOURCE, TARGET), ["game.gba", name]);
      assert.equal(r.type, "compat-result");
      assert.equal(r.data.report.state, "compatible");
      assert.match(r.data.report.headline, /^Compatible/);
      assert.equal(r.data.patch.format, label);
      assert.equal(r.data.rom.crc32, crcHex(SOURCE));
    });

    test(`${label}: a different ROM is a Mismatch with troubleshooting steps`, async () => {
      const other = roms.makeGba(0x20000, 99);
      const r = await check(other, build(SOURCE, TARGET), ["game.gba", name]);
      assert.equal(r.data.report.state, "mismatch");
      assert.match(r.data.report.headline, /^Mismatch/);
      assert.ok(r.data.report.steps.length >= 3);
      assert.ok(r.data.report.evidence.some((e) => e.status === "bad"));
    });

    test(`${label}: an already-patched ROM is a Mismatch that says so`, async () => {
      const r = await check(TARGET, build(SOURCE, TARGET), ["game.gba", name]);
      assert.equal(r.data.report.state, "mismatch");
      assert.equal(r.data.report.alreadyPatched, true);
      assert.match(r.data.report.headline, /already patched/i);
    });

    test(`${label}: a damaged patch is Cannot Verify, with a re-download hint`, async () => {
      const damaged = Uint8Array.from(build(SOURCE, TARGET));
      damaged[damaged.length - 20] ^= 0xff;
      const r = await check(SOURCE, damaged, ["game.gba", name]);
      assert.equal(r.data.report.state, "cannot-verify");
      assert.equal(r.data.report.code, "patch-corrupt");
      assert.match(r.data.report.steps.join(" "), /Download the patch again/);
    });
  }

  test("the verdict never disagrees with the real patcher: same wording as the apply-time gate", async () => {
    const patch = fx.buildBps(SOURCE, TARGET);
    const other = roms.makeGba(0x20000, 77);
    const verdict = await check(other, patch);
    const gate = await createWorker("rom-patcher-worker.js").run({
      type: "patch",
      romFile: fakeFile(other, "game.gba"),
      patchFile: fakeFile(patch, "hack.bps"),
      options: { requireValidation: true, removeHeader: true, fixChecksum: true, outputSuffix: true },
    });
    assert.equal(verdict.data.report.state, "mismatch");
    assert.equal(gate.type, "error");
  });
});

describe("compatibility worker: formats that cannot be verified are never called Compatible", () => {
  const SOURCE = roms.makeGba(0x20000, 51);
  const check = (romBytes, patchBytes, name) =>
    createWorker("compat-worker.js").run({ type: "check-compat", requestId: "c2", rom: fakeFile(romBytes, "game.gba"), patch: fakeFile(patchBytes, name) });

  test("IPS applied to the very ROM it was made for is still Cannot Verify", async () => {
    const ips = fx.buildIps([{ offset: 0x40, bytes: [1, 2, 3] }]);
    const r = await check(SOURCE, ips, "hack.ips");
    assert.equal(r.data.report.state, "cannot-verify");
    assert.equal(r.data.report.code, "no-checksum");
    assert.doesNotMatch(r.data.report.headline, /^Compatible/);
    assert.match(r.data.report.summary, /can't tell|compatibility can't be proven|neither can any other tool/i);
    assert.equal(r.data.patch.format, "IPS");
    assert.equal(r.data.patch.ips.records, 1);
  });

  test("IPS applied to a completely different ROM is also Cannot Verify (not Mismatch): no evidence either way", async () => {
    const ips = fx.buildIps([{ offset: 0x40, bytes: [1, 2, 3] }]);
    const r = await check(roms.makeNds(), ips, "hack.ips");
    assert.equal(r.data.report.state, "cannot-verify");
  });

  test("IPS: a ROM smaller than the area the patch writes gets a hedged warning — not a verdict", async () => {
    const ips = fx.buildIps([{ offset: 0x30000, bytes: [1, 2, 3, 4] }]);
    const r = await check(SOURCE, ips, "hack.ips");
    assert.equal(r.data.report.state, "cannot-verify");
    const finding = r.data.report.findings.find((f) => /smaller than the area/.test(f.title));
    assert.ok(finding);
    assert.match(finding.message, /does not prove a mismatch/);
  });

  test("xdelta (VCDIFF) is Cannot Verify with an honest explanation", async () => {
    const xd = fx.buildVcdiff(SOURCE, [1, 2, 3, 4]);
    const r = await check(SOURCE, xd, "hack.xdelta");
    assert.equal(r.data.patch.format, "VCDIFF");
    assert.equal(r.data.report.state, "cannot-verify");
    assert.match(r.data.report.summary, /don't record which ROM/);
  });

  test("a file that is not a patch is reported as unrecognised, not as a mismatch", async () => {
    const r = await check(SOURCE, fx.randomBytes(500, 3), "notes.txt");
    assert.equal(r.data.report.state, "cannot-verify");
    assert.equal(r.data.report.code, "patch-unrecognized");
  });

  test("an empty patch file does not crash the check", async () => {
    const r = await check(SOURCE, new Uint8Array(0), "empty.ips");
    assert.equal(r.type, "compat-result");
    assert.equal(r.data.report.state, "cannot-verify");
  });
});

describe("compatibility worker: formats validated by the patching library itself", () => {
  const ORIGINAL = roms.makeGba(0x20000, 61);
  const MODIFIED = fx.applyEdits(ORIGINAL, [{ offset: 0x400, bytes: [1, 2, 3, 4, 5] }]);

  const make = (format) => buildWithLibrary(createWorker("compat-worker.js"), format, ORIGINAL, MODIFIED);
  const check = (romBytes, patchBytes, name) =>
    createWorker("compat-worker.js").run({ type: "check-compat", requestId: "c3", rom: fakeFile(romBytes, "game.gba"), patch: fakeFile(patchBytes, name) });

  test("RUP (MD5): original is Compatible, a different ROM is a Mismatch, the patched ROM is 'already patched'", async () => {
    const rup = make("rup");
    const ok = await check(ORIGINAL, rup, "hack.rup");
    assert.equal(ok.data.patch.format, "RUP");
    assert.equal(ok.data.report.state, "compatible");
    assert.match(ok.data.report.verification, /MD5/);

    const bad = await check(roms.makeGba(0x20000, 62), rup, "hack.rup");
    assert.equal(bad.data.report.state, "mismatch");

    const done = await check(MODIFIED, rup, "hack.rup");
    assert.equal(done.data.report.state, "mismatch");
    assert.equal(done.data.report.alreadyPatched, true);
  });

  test("APS in its plain mode records no ROM data, so it is Cannot Verify — not Compatible", async () => {
    const aps = make("aps");
    const r = await check(ORIGINAL, aps, "hack.aps");
    assert.equal(r.data.patch.format, "APS");
    assert.equal(r.data.patch.noValidation, true);
    assert.equal(r.data.report.state, "cannot-verify");
  });

  test("APS in N64 mode: the cartridge header it records is compared, and the report says this is not a whole-file check", async () => {
    const original = roms.makeN64("z64", 0x100000, 64);
    const modified = fx.applyEdits(original, [{ offset: 0x2000, bytes: [1, 2, 3, 4] }]);
    const aps = buildWithLibrary(createWorker("compat-worker.js"), "aps", original, modified);
    const ok = await check(original, aps, "hack.aps");
    assert.equal(ok.data.patch.noValidation, false);
    assert.equal(ok.data.report.state, "compatible");
    assert.match(ok.data.report.verification, /does not cover the whole ROM/);
    const bad = await check(roms.makeN64("z64", 0x100000, 65), aps, "hack.aps");
    assert.equal(bad.data.report.state, "mismatch");
  });
});

describe("compatibility worker: APS (GBA) block checks", () => {
  const ORIGINAL = roms.makeGba(0x20000, 66);
  const check = (romBytes, patchBytes) =>
    createWorker("compat-worker.js").run({ type: "check-compat", requestId: "g1", rom: fakeFile(romBytes, "game.gba"), patch: fakeFile(patchBytes, "hack.aps") });

  function buildApsGba(original, modified) {
    const worker = createWorker("compat-worker.js");
    const ctx = worker.context;
    ctx.__orig = original;
    ctx.__mod = modified;
    const code = `(function(){
      var p = new APSGBA();
      p.sourceSize = __orig.length;
      p.targetSize = __mod.length;
      var BLOCK = 0x10000;
      for (var off = 0; off < __orig.length; off += BLOCK) {
        var a = __orig.subarray(off, off + BLOCK);
        var b = __mod.subarray(off, off + BLOCK);
        var xor = new Uint8Array(BLOCK);
        for (var i = 0; i < a.length; i++) xor[i] = a[i] ^ b[i];
        p.addRecord(off, HashCalculator.crc16(a.buffer, a.byteOffset, a.length), HashCalculator.crc16(b.buffer, b.byteOffset, b.length), Array.from(xor));
      }
      return Array.from(p.export("x")._u8array);
    })()`;
    return Uint8Array.from(vm.runInContext(code, ctx));
  }

  test("original ROM is Compatible; a ROM with different contents is a Mismatch", async () => {
    const modified = fx.applyEdits(ORIGINAL, [{ offset: 0x400, bytes: [1, 2, 3, 4] }]);
    const aps = buildApsGba(ORIGINAL, modified);
    const ok = await check(ORIGINAL, aps);
    assert.equal(ok.data.patch.format, "APSGBA");
    assert.equal(ok.data.report.state, "compatible");
    assert.match(ok.data.report.verification, /CRC16 of every block/);
    const bad = await check(roms.makeGba(0x20000, 67), aps);
    assert.equal(bad.data.report.state, "mismatch");
    const wrongSize = await check(roms.makeGba(0x10000, 66), aps);
    assert.equal(wrongSize.data.report.state, "mismatch");
  });
});

describe("compatibility worker: memory limit for formats that need the whole ROM", () => {
  const LIMIT = 1024 * 1024; // shrunk for the test; the shipped limit is RomToolkit.WHOLE_ROM_LIMIT (256 MB)
  const BIG = roms.makeGba(0x200000, 101); // 2 MB
  const BIG_MODIFIED = fx.applyEdits(BIG, [{ offset: 0x800, bytes: [1, 2, 3, 4] }]);
  const run = (rom, patch, patchName, limits) =>
    createWorker("compat-worker.js").run({ type: "check-compat", requestId: "lim", rom: fakeFile(rom, "game.gba"), patch: fakeFile(patch, patchName), limits });

  test("the shipped limit is 256 MB", () => {
    assert.equal(RomToolkit.WHOLE_ROM_LIMIT, 256 * 1024 * 1024);
  });

  test("RUP: a ROM over the limit is Cannot Verify with an honest explanation, not a crash and not a guess", async () => {
    const rup = buildWithLibrary(createWorker("compat-worker.js"), "rup", BIG, BIG_MODIFIED);
    const r = await run(BIG, rup, "hack.rup", { wholeRomBytes: LIMIT });
    assert.equal(r.type, "compat-result");
    assert.equal(r.data.report.state, "cannot-verify");
    assert.equal(r.data.report.code, "rom-too-large-for-validation");
    assert.match(r.data.report.summary, /whole ROM into memory/);
    assert.ok(r.data.report.evidence.some((e) => /Size limit for RUP validation/.test(e.label)));
    assert.match(r.data.report.steps.join(" "), /ROM Checksum Checker/);
    // the ROM is still streamed, so its facts are still reported
    assert.equal(r.data.rom.crc32, crcHex(BIG));
  });

  test("the very same files are fully checked when the ROM is within the limit", async () => {
    const rup = buildWithLibrary(createWorker("compat-worker.js"), "rup", BIG, BIG_MODIFIED);
    const r = await run(BIG, rup, "hack.rup", { wholeRomBytes: 4 * LIMIT });
    assert.equal(r.data.report.state, "compatible");
  });

  test("the limit never applies to formats that are checked by streaming (UPS, BPS, IPS)", async () => {
    const ups = await run(BIG, fx.buildUps(BIG, BIG_MODIFIED), "hack.ups", { wholeRomBytes: LIMIT });
    assert.equal(ups.data.report.state, "compatible");
    const bps = await run(BIG, fx.buildBps(BIG, BIG_MODIFIED), "hack.bps", { wholeRomBytes: LIMIT });
    assert.equal(bps.data.report.state, "compatible");
    const ips = await run(BIG, fx.buildIps([{ offset: 4, bytes: [1] }]), "hack.ips", { wholeRomBytes: LIMIT });
    assert.equal(ips.data.report.code, "no-checksum");
  });

  test("a file that is not a patch is still reported as unrecognised, whatever the ROM size", async () => {
    const r = await run(BIG, fx.randomBytes(300, 9), "notes.txt", { wholeRomBytes: LIMIT });
    assert.equal(r.type, "compat-result");
    assert.equal(r.data.report.code, "patch-unrecognized");
  });
});

describe("compatibility worker: SNES copier headers", () => {
  const BODY = roms.makeSnes(0x80000, 71);
  const HACKED = fx.applyEdits(BODY, [{ offset: 0x1000, bytes: [5, 6, 7, 8] }]);
  const patchForHeaderless = fx.buildBps(BODY, HACKED);
  const withHeader = (bytes) => {
    const out = new Uint8Array(bytes.length + 512);
    out.set(bytes, 512);
    return out;
  };
  const check = (romBytes, romName, patchBytes, patchName = "hack.bps") =>
    createWorker("compat-worker.js").run({ type: "check-compat", requestId: "s1", rom: fakeFile(romBytes, romName), patch: fakeFile(patchBytes, patchName) });

  test("a headered ROM matches a header-less patch once the header is set aside, and the report explains it", async () => {
    const r = await check(withHeader(BODY), "game.smc", patchForHeaderless);
    assert.equal(r.data.report.state, "compatible");
    assert.equal(r.data.report.code, "rom-compatible-header");
    assert.ok(r.data.report.findings.some((f) => /512-byte SNES copier header/.test(f.title)));
    assert.equal(r.data.rom.headerless.headerSize, 512);
    assert.equal(r.data.rom.platform.snes.copierHeader, true);
  });

  test("a header-less ROM is Compatible with a header-less patch and raises no header warning", async () => {
    const r = await check(BODY, "game.sfc", patchForHeaderless);
    assert.equal(r.data.report.state, "compatible");
    assert.equal(r.data.report.findings.length, 0);
  });

  test("a patch made for a HEADERED ROM, given a header-less one: Mismatch, 512 bytes explained, no guessing", async () => {
    const patchForHeadered = fx.buildBps(withHeader(BODY), withHeader(HACKED));
    const r = await check(BODY, "game.sfc", patchForHeadered);
    assert.equal(r.data.report.state, "mismatch");
    const finding = r.data.report.findings.find((f) => /expects a ROM with a 512-byte copier header/.test(f.title));
    assert.ok(finding, "the 512-byte difference is explained");
    assert.match(finding.message, /can't invent that header/);
  });

  test("a headered ROM with an extension PatchMyROM does not treat as SNES is warned about, never silently stripped", async () => {
    const r = await check(withHeader(BODY), "game.bin", patchForHeaderless);
    assert.equal(r.data.report.state, "mismatch");
    assert.ok(r.data.report.findings.some((f) => /copier header/.test(f.title)));
    assert.equal(r.data.rom.headerless, null);
  });

  test("a headered SNES ROM of a non-standard size is not stripped (the library won't guess) and the user is told why", async () => {
    const odd = withHeader(roms.makeSnes(0x80000 - 0x400, 72));
    const r = await check(odd, "game.smc", patchForHeaderless);
    assert.equal(r.data.report.state, "mismatch");
    assert.ok(r.data.report.findings.some((f) => /won't guess/.test(f.message)));
  });

  test("IPS + a headered SNES ROM: still Cannot Verify, with the header called out", async () => {
    const ips = fx.buildIps([{ offset: 0x100, bytes: [1, 2, 3] }]);
    const r = await check(withHeader(BODY), "game.smc", ips, "hack.ips");
    assert.equal(r.data.report.state, "cannot-verify");
    assert.ok(r.data.report.findings.some((f) => /512-byte/.test(f.title)));
  });
});

describe("compatibility worker: memory and reuse", () => {
  test("a large ROM checked against a checksum-free patch is streamed in chunks, not loaded whole", async () => {
    const SIZE = 40 * 1024 * 1024;
    const gen = (i) => (i * 17 + (i >>> 10)) & 0xff;
    const reads = [];
    const lazy = {
      name: "large.nds",
      type: "",
      size: SIZE,
      lastModified: 0,
      slice(start, end) {
        reads.push(end - start);
        return {
          arrayBuffer: async () => {
            const out = new Uint8Array(end - start);
            for (let i = 0; i < out.length; i++) out[i] = gen(start + i);
            return out.buffer;
          },
        };
      },
    };
    let crc = 0;
    for (let start = 0; start < SIZE; start += 1 << 20) {
      const part = new Uint8Array(Math.min(1 << 20, SIZE - start));
      for (let i = 0; i < part.length; i++) part[i] = gen(start + i);
      crc = zlib.crc32(part, crc);
    }
    const ips = fx.buildIps([{ offset: 0x100, bytes: [1, 2, 3] }]);
    const r = await createWorker("compat-worker.js").run({ type: "check-compat", requestId: "m1", rom: lazy, patch: fakeFile(ips, "hack.ips") });
    assert.equal(r.data.rom.crc32, (crc >>> 0).toString(16).padStart(8, "0"));
    assert.ok(Math.max(...reads) <= 4 * 1024 * 1024, `largest read ${Math.max(...reads)} bytes`);
  });

  test("patch facts agree exactly with what the existing analysis worker reports for the same files", async () => {
    const source = roms.makeGba(0x10000, 81);
    const target = fx.applyEdits(source, [{ offset: 0x200, bytes: [1, 2, 3] }]);
    const patches = [
      ["a.bps", fx.buildBps(source, target)],
      ["a.ups", fx.buildUps(source, target)],
      ["a.ips", fx.buildIps([{ offset: 0x10, bytes: [1] }])],
    ];
    for (const [name, bytes] of patches) {
      const analysis = await createWorker("analysis-worker.js").run({ type: "analyze-patch", requestId: "p", cacheKey: "k", file: fakeFile(bytes, name) });
      const compat = await createWorker("compat-worker.js").run({ type: "check-compat", requestId: "q", rom: fakeFile(source, "g.gba"), patch: fakeFile(bytes, name) });
      assert.equal(compat.data.patch.format, analysis.data.format, name);
      assert.equal(compat.data.patch.sourceSize, analysis.data.sourceSize, name);
      assert.equal(compat.data.patch.targetSize, analysis.data.targetSize, name);
      assert.equal(compat.data.patch.sourceCrc32, analysis.data.sourceChecksumCRC32, name);
      assert.equal(compat.data.patch.targetCrc32, analysis.data.targetChecksumCRC32, name);
    }
  });

  test("the ROM CRC32 and header-less CRC32 agree with the existing analysis worker", async () => {
    const rom = roms.makeSnes(0x80000, 91, { copierHeader: true });
    const analysis = await createWorker("analysis-worker.js").run({ type: "analyze-rom", requestId: "r", cacheKey: "k", file: fakeFile(rom, "g.smc") });
    const compat = await createWorker("compat-worker.js").run({
      type: "check-compat",
      requestId: "q",
      rom: fakeFile(rom, "g.smc"),
      patch: fakeFile(fx.buildIps([{ offset: 1, bytes: [1] }]), "a.ips"),
    });
    assert.equal(compat.data.rom.crc32, analysis.data.crc32);
    assert.deepEqual(plain(compat.data.rom.headerless), plain(analysis.data.headerless));
  });
});

// ================================================================== report text

describe("report text", () => {
  test("the plain-text copy contains the verdict, how it was checked and the next steps", async () => {
    const source = roms.makeGba(0x10000, 95);
    const target = fx.applyEdits(source, [{ offset: 0x200, bytes: [1, 2, 3] }]);
    const other = roms.makeGba(0x10000, 96);
    const r = await createWorker("compat-worker.js").run({ type: "check-compat", requestId: "t", rom: fakeFile(other, "g.gba"), patch: fakeFile(fx.buildBps(source, target), "a.bps") });
    const text = RomToolkit.reportToPlainText(r.data.report);
    assert.match(text, /^Mismatch/);
    assert.match(text, /How it was checked: BPS stores the CRC32 and size/);
    assert.match(text, /What to do next:/);
    assert.match(text, /no file was uploaded/);
  });
});
