// Phase 1.1 regression tests for the ROM toolkit: damaged patches must not hang or exhaust memory, the whole-ROM memory
// limit follows the device, partial evidence is never reported as compatibility, header notes never imply a check that
// wasn't made, and platform detection no longer fires on unrelated data.
//
// Anything that could — if a guard regressed — send the vendored parsers into an endless loop runs in a throw-away child
// process with a hard timeout (tests/helpers/child-run.mjs), so a regression fails this file instead of freezing the run.
// Fixtures are generated; the three bzip2 streams used for BDF were produced once with Python's bz2 module from the plain
// bytes described next to them.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import zlib from "node:zlib";
import vm from "node:vm";
import { createRequire } from "node:module";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import { runInChild } from "./helpers/child-run.mjs";
import * as fx from "./helpers/fixtures.mjs";
import * as roms from "./helpers/rom-fixtures.mjs";

const require = createRequire(import.meta.url);
const RomToolkit = require("../public/workers/rom-toolkit.js");

const MB = 1024 * 1024;
const ascii = (text) => [...text].map((c) => c.charCodeAt(0));
const md5 = (bytes) => [...crypto.createHash("md5").update(bytes).digest()];

const compat = (romBytes, romName, patchBytes, patchName, limits) =>
  createWorker("compat-worker.js").run({ type: "check-compat", requestId: "h", rom: fakeFile(romBytes, romName), patch: fakeFile(patchBytes, patchName), limits });

const compatChild = (romBytes, romName, patchBytes, patchName, limits, timeoutMs = 20000) =>
  runInChild("compat-worker.js", { type: "check-compat", requestId: "h", rom: fakeFile(romBytes, romName), patch: fakeFile(patchBytes, patchName), limits }, { timeoutMs });

// ------------------------------------------------------------------ patch builders (independent of the vendored encoders)

const u64le = (n) => {
  const out = [];
  let low = n % 2 ** 32;
  let high = Math.floor(n / 2 ** 32);
  for (let i = 0; i < 4; i++, low = Math.floor(low / 256)) out.push(low % 256);
  for (let i = 0; i < 4; i++, high = Math.floor(high / 256)) out.push(high % 256);
  return out;
};

/** BDF (bsdiff) container around three already-compressed sections. */
function buildBdf({ ctrl, diff, extra, newSize = 6, ctrlLength = ctrl.length, diffLength = diff.length }) {
  return Uint8Array.from([...ascii("BSDIFF40"), ...u64le(ctrlLength), ...u64le(diffLength), ...u64le(newSize), ...ctrl, ...diff, ...extra]);
}
const b64 = (text) => [...Buffer.from(text, "base64")];
// bzip2 streams (Python bz2.compress): control records are three little-endian u64 (diff length, extra length, skip).
const BZ = {
  ctrlOk: b64("QlpoOTFBWSZTWQVDls4AAAVAAFwIIAAhhoGaAtTJpxdyRThQkAVDls4="), // (4, 2, 0)
  ctrlTooBig: b64("QlpoOTFBWSZTWeaO5KgAAALgAMAAQABAAKAAISGgzTRobDxdyRThQkOaO5Kg"), // (0xFFFFFFF0, 0, 0)
  ctrlHigh: b64("QlpoOTFBWSZTWQ9YHpcAAAbAAHQIIAAwzQDNNQiVJePF3JFOFCQD1gelwA=="), // (0x0000010000000004, 2, 0)
  ctrlOdd: b64("QlpoOTFBWSZTWeWk5SAAAAVAAFwEIAAhhoGaAtTJpxdyRThQkOWk5SA="), // 25 bytes: one record plus a stray byte
  diff: b64("QlpoOTFBWSZTWYbIyDIAAABAADwAIAAhmmgzTRM8XckU4UJCGyMgyA=="), // 01 02 03 04
  extra: b64("QlpoOTFBWSZTWXLzNkUAAABAAAMAIAAhAIKxdyRThQkHLzNkUA=="), // 05 06
};

/** RUP (NINJA 2) with one file entry; `body` replaces the command stream for malformed variants. */
const vlv = (n) => {
  const out = [];
  for (let v = n; v > 0; v = Math.floor(v / 256)) out.push(v % 256);
  return [out.length, ...out];
};
function buildRup({ source, target = source, name = "game.gba", records = [], body = null }) {
  const head = new Array(0x800).fill(0);
  head.splice(0, 6, ...ascii("NINJA2"));
  if (body) return Uint8Array.from([...head, ...body]);
  const open = [0x01, ...vlv(name.length), ...ascii(name), 0x00, ...vlv(source.length), ...vlv(target.length), ...md5(source), ...md5(target)];
  if (source.length !== target.length) open.push(source.length > target.length ? 0x4d : 0x41, ...vlv(0));
  const xors = records.flatMap((r) => [0x02, ...vlv(r.offset), ...vlv(r.bytes.length), ...r.bytes]);
  return Uint8Array.from([...head, ...open, ...xors, 0x00]);
}
const OPEN_FILE = (source) => [0x01, ...vlv(1), ...ascii("a"), 0x00, ...vlv(source.length), ...vlv(source.length), ...md5(source), ...md5(source)];

// ================================================================== structure preflight (pure)

describe("detectPatchFormat", () => {
  const cases = [
    ["IPS", ascii("PATCH")],
    ["UPS", ascii("UPS1")],
    ["BPS", ascii("BPS1")],
    ["APS", ascii("APS10")],
    ["APSGBA", ascii("APS1")],
    ["RUP", ascii("NINJA2")],
    ["PPF", ascii("PPF30")],
    ["BDF", ascii("BSDIFF40")],
    ["PMSR", ascii("PMSR")],
    ["VCDIFF", [0xd6, 0xc3, 0xc4, 0x00]],
  ];
  for (const [name, bytes] of cases) {
    test(`recognises ${name} from its first bytes, even when the rest of the file is junk`, () => {
      assert.equal(RomToolkit.detectPatchFormat(Uint8Array.from([...bytes, 1, 2, 3])), name);
    });
  }
  test("APS10 (N64) wins over APS1 (GBA), as in the patching library", () => {
    assert.equal(RomToolkit.detectPatchFormat(Uint8Array.from(ascii("APS10xx"))), "APS");
    assert.equal(RomToolkit.detectPatchFormat(Uint8Array.from(ascii("APS1xx"))), "APSGBA");
  });
  test("anything else, and tiny inputs, are not a patch", () => {
    assert.equal(RomToolkit.detectPatchFormat(Uint8Array.from(ascii("hello world"))), null);
    assert.equal(RomToolkit.detectPatchFormat(new Uint8Array(0)), null);
    assert.equal(RomToolkit.detectPatchFormat(Uint8Array.from(ascii("PAT"))), null);
    assert.equal(RomToolkit.detectPatchFormat(null), null);
  });
});

describe("preflightPatchStructure: PMSR", () => {
  const pre = (bytes) => RomToolkit.preflightPatchStructure(bytes);

  test("a well-formed patch passes, including one with zero records", () => {
    assert.equal(pre(fx.buildPmsr([{ offset: 0x100, bytes: [1, 2, 3] }, { offset: 0x2000, bytes: [9] }])).ok, true);
    assert.equal(pre(fx.buildPmsr([])).ok, true);
  });
  test("a record count that cannot fit in the file is refused before any record is read", () => {
    for (const count of [1, 0x10000, 0xfffffffe, 0xffffffff]) {
      const r = pre(fx.buildPmsr([{ offset: 0, bytes: [1] }], { count }));
      if (count === 1) {
        assert.equal(r.ok, true);
        continue;
      }
      assert.equal(r.ok, false, `count ${count}`);
      assert.equal(r.code, "patch-corrupt");
      assert.equal(r.format, "PMSR");
      assert.match(r.message, /announces \d+ records but the file is only \d+ bytes long/);
    }
  });
  test("a record whose length runs past the end of the file is refused", () => {
    const r = pre(fx.buildPmsr([{ offset: 0, bytes: [1, 2], length: 0xffffffff }]));
    assert.equal(r.ok, false);
    assert.match(r.message, /record 1 claims 4294967295 bytes but only 2 are left/);
  });
  test("a file cut off in the middle of a record is refused", () => {
    const whole = fx.buildPmsr([{ offset: 0, bytes: [1, 2, 3, 4] }, { offset: 8, bytes: [5, 6] }]);
    const cut = whole.subarray(0, whole.length - 3);
    assert.equal(pre(cut).ok, false);
    assert.equal(pre(Uint8Array.from(ascii("PMSR\0\0"))).ok, false);
  });
});

describe("preflightPatchStructure: BDF", () => {
  const pre = (bytes, deps) => RomToolkit.preflightPatchStructure(bytes, deps);
  const bz2 = {
    // minimal stand-in: the real decoder is exercised through the worker below; here only the control-record walk matters
    decompress: (u8) => {
      const key = Buffer.from(u8).toString("base64");
      const known = new Map([
        [Buffer.from(BZ.ctrlOk).toString("base64"), Uint8Array.from([...u64le(4), ...u64le(2), ...u64le(0)])],
        [Buffer.from(BZ.ctrlTooBig).toString("base64"), Uint8Array.from([...u64le(0xfffffff0), ...u64le(0), ...u64le(0)])],
        [Buffer.from(BZ.ctrlHigh).toString("base64"), Uint8Array.from([...u64le(0x10000000004), ...u64le(2), ...u64le(0)])],
        [Buffer.from(BZ.ctrlOdd).toString("base64"), Uint8Array.from([...u64le(4), ...u64le(2), ...u64le(0), 0])],
        [Buffer.from(BZ.diff).toString("base64"), Uint8Array.from([1, 2, 3, 4])],
        [Buffer.from(BZ.extra).toString("base64"), Uint8Array.from([5, 6])],
      ]);
      if (!known.has(key)) throw new Error("bad bz2");
      return known.get(key);
    },
  };
  const make = (ctrl) => buildBdf({ ctrl, diff: BZ.diff, extra: BZ.extra });

  test("header checks need no decoder: sizes must fit the file, stay under 4 GB, and each section must look like bzip2", () => {
    assert.equal(pre(make(BZ.ctrlOk)).ok, true);
    assert.match(pre(Uint8Array.from(ascii("BSDIFF40........"))).message, /shorter than the 32-byte header/);
    const hugeDeclared = buildBdf({ ctrl: BZ.ctrlOk, diff: BZ.diff, extra: BZ.extra, ctrlLength: 0xffffffff });
    assert.match(pre(hugeDeclared).message, /announces \d+ bytes of compressed data but the file has only/);
    const over4G = buildBdf({ ctrl: BZ.ctrlOk, diff: BZ.diff, extra: BZ.extra, ctrlLength: 2 ** 40 });
    assert.match(pre(over4G).message, /larger than 4 GB/);
    const noStream = buildBdf({ ctrl: ascii("not bzip2"), diff: BZ.diff, extra: BZ.extra });
    assert.match(pre(noStream).message, /compressed sections is missing/);
  });
  test("with a decoder, control records must fit the decompressed sections", () => {
    assert.equal(pre(make(BZ.ctrlOk), { bz2 }).ok, true);
    assert.match(pre(make(BZ.ctrlTooBig), { bz2 }).message, /record 1 asks for more data than its section holds/);
    assert.match(pre(make(BZ.ctrlHigh), { bz2 }).message, /record 1 has an impossible length/);
    assert.match(pre(make(BZ.ctrlOdd), { bz2 }).message, /not a whole number of records/);
  });
  test("a section the decoder rejects is reported as damaged, not thrown", () => {
    const r = pre(buildBdf({ ctrl: [0x42, 0x5a, 0x68, 0x39, 1, 2, 3], diff: BZ.diff, extra: BZ.extra }), { bz2 });
    assert.equal(r.ok, false);
    assert.match(r.message, /can't be decompressed/);
  });
});

describe("preflightPatchStructure: RUP", () => {
  const source = fx.randomBytes(0x1000, 5);
  const pre = (bytes) => RomToolkit.preflightPatchStructure(bytes);

  test("a well-formed patch passes (with and without a size change, with XOR records)", () => {
    assert.equal(pre(buildRup({ source, records: [{ offset: 4, bytes: [1, 2, 3] }] })).ok, true);
    assert.equal(pre(buildRup({ source, target: fx.randomBytes(0x1800, 6) })).ok, true);
  });
  test("numbers and lengths that cannot fit are refused", () => {
    const cases = {
      "a file name of 16 MB": [0x01, 3, 0xff, 0xff, 0xff],
      "a record of 2 GB": [...OPEN_FILE(source), 0x02, ...vlv(0), 4, 0xff, 0xff, 0xff, 0x7f],
      "a 200-byte number": [0x01, 200, 1, 2, 3],
      "a number cut off by the end of the file": [0x01, 0x04, 0xff],
      "an unknown command": [...OPEN_FILE(source), 0x07],
      "a change before any file is opened": [0x02, ...vlv(0), ...vlv(1), 9],
      "an invalid overflow mode": [0x01, ...vlv(1), ...ascii("a"), 0x00, ...vlv(10), ...vlv(20), ...md5(source), ...md5(source), 0x58, 0],
      "a number with the top bit set (negative in the library)": [...OPEN_FILE(source), 0x02, 4, 0, 0, 0, 0x80, 1, 0],
    };
    for (const [what, body] of Object.entries(cases)) {
      const r = pre(buildRup({ source, body }));
      assert.equal(r.ok, false, what);
      assert.equal(r.format, "RUP");
    }
  });
  test("a patch with no command stream at all is left to the library (it ends immediately)", () => {
    assert.equal(pre(Uint8Array.from(ascii("NINJA2"))).ok, true);
  });
});

// ================================================================== damaged patches through the real worker

describe("compatibility worker: damaged patches are refused quickly, with one consistent explanation", () => {
  const ROM = roms.makeGba(0x20000, 21);
  const damagedCases = [
    ["PMSR with 4 billion records", "PMSR", fx.buildPmsr([], { count: 0xffffffff }), "bad.pmsr"],
    ["PMSR with a count larger than the file", "PMSR", fx.buildPmsr([{ offset: 0, bytes: [1] }], { count: 0x7fffffff }), "bad.pmsr"],
    ["PMSR with a 4 GB record", "PMSR", fx.buildPmsr([{ offset: 0, bytes: [1, 2, 3], length: 0xffffffff }]), "bad.pmsr"],
    ["PMSR cut off after the magic", "PMSR", Uint8Array.from(ascii("PMSR\0\0")), "bad.pmsr"],
    ["BDF with a control section larger than the file", "BDF", buildBdf({ ctrl: BZ.ctrlOk, diff: BZ.diff, extra: BZ.extra, ctrlLength: 0xffffffff }), "bad.bdf"],
    ["BDF with 64-bit sizes", "BDF", buildBdf({ ctrl: BZ.ctrlOk, diff: BZ.diff, extra: BZ.extra, diffLength: 2 ** 41 }), "bad.bdf"],
    ["BDF cut off after the magic", "BDF", Uint8Array.from(ascii("BSDIFF40abcdef")), "bad.bdf"],
    ["BDF whose control record asks for 4 GB", "BDF", buildBdf({ ctrl: BZ.ctrlTooBig, diff: BZ.diff, extra: BZ.extra }), "bad.bdf"],
    ["BDF whose control record has 64-bit lengths", "BDF", buildBdf({ ctrl: BZ.ctrlHigh, diff: BZ.diff, extra: BZ.extra }), "bad.bdf"],
    ["BDF whose control data ends in a partial record", "BDF", buildBdf({ ctrl: BZ.ctrlOdd, diff: BZ.diff, extra: BZ.extra }), "bad.bdf"],
    ["BDF with a section that is not bzip2", "BDF", buildBdf({ ctrl: ascii("not bzip2 at all"), diff: BZ.diff, extra: BZ.extra }), "bad.bdf"],
    ["RUP with a 16 MB file name", "RUP", buildRup({ source: ROM, body: [0x01, 3, 0xff, 0xff, 0xff] }), "bad.rup"],
    ["RUP with a 2 GB record", "RUP", buildRup({ source: ROM, body: [...OPEN_FILE(ROM), 0x02, ...vlv(0), 4, 0xff, 0xff, 0xff, 0x7f] }), "bad.rup"],
    ["RUP with an unknown command", "RUP", buildRup({ source: ROM, body: [...OPEN_FILE(ROM), 0x07] }), "bad.rup"],
  ];
  for (const [what, format, patch, name] of damagedCases) {
    test(`${what}: reported as a damaged ${format} patch, no hang`, () => {
      const t0 = Date.now();
      const res = compatChild(ROM, "game.gba", patch, name);
      assert.equal(res.timedOut, false, "the worker must not get stuck on this file");
      assert.ok(Date.now() - t0 < 15000);
      assert.equal(res.result.type, "compat-result");
      const { report, patch: p } = res.result.data;
      assert.equal(report.state, "cannot-verify");
      assert.equal(report.code, "patch-corrupt");
      assert.equal(p.format, format, "the format is taken from the patch's own first bytes");
      assert.equal(p.recognized, false);
      assert.match(report.headline, new RegExp(`^The ${format === "APSGBA" ? "APS \\(GBA\\)" : format} patch is damaged or incomplete$`));
      assert.match(report.summary, /damaged or incomplete/);
      const patchLine = report.evidence.find((e) => e.label === "Patch");
      assert.match(patchLine.value, new RegExp(`${format} \\(damaged or incomplete\\)`));
      assert.equal(patchLine.status, "bad");
      assert.doesNotMatch(JSON.stringify(report), /Unknown/, "the report never calls a patch it just named 'Unknown'");
      assert.match(report.steps.join(" "), /Download the patch again/);
      assert.doesNotMatch(report.steps.join(" "), /really is a patch/, "steps for a damaged patch don't ask whether it is a patch at all");
    });
  }

  test("a well-formed BDF still passes the preflight and is parsed by the real library (Cannot Verify: it stores no checksum)", () => {
    const res = compatChild(ROM, "game.gba", buildBdf({ ctrl: BZ.ctrlOk, diff: BZ.diff, extra: BZ.extra }), "ok.bdf");
    assert.equal(res.timedOut, false);
    const { report, patch } = res.result.data;
    assert.equal(patch.recognized, true);
    assert.equal(patch.format, "BDF");
    assert.equal(report.state, "cannot-verify");
    assert.equal(report.code, "no-checksum");
  });

  test("damaged BPS and UPS patches get the same wording: named, flagged as damaged, never 'Unknown'", async () => {
    const original = fx.randomBytes(0x8000, 3);
    const edited = fx.applyEdits(original, [{ offset: 0x100, bytes: [1, 2, 3] }]);
    for (const [format, build, name] of [["BPS", fx.buildBps, "hack.bps"], ["UPS", fx.buildUps, "hack.ups"]]) {
      const good = build(original, edited);
      const flipped = Uint8Array.from(good);
      flipped[Math.floor(flipped.length / 2)] ^= 0xff; // body damaged, trailing checksum no longer matches
      const truncated = good.subarray(0, 8); // cut off right after the header
      for (const [how, bytes] of [["with a flipped byte", flipped], ["cut off", truncated]]) {
        const r = await compat(original, "game.bin", bytes, name);
        const { report, patch } = r.data;
        assert.equal(report.code, "patch-corrupt", `${format} ${how}`);
        assert.equal(patch.format, format);
        assert.equal(report.headline, `The ${format} patch is damaged or incomplete`);
        assert.equal(report.evidence.find((e) => e.label === "Patch").value.includes(`${format} (damaged or incomplete)`), true);
        assert.doesNotMatch(JSON.stringify(report), /Unknown/);
      }
    }
  });

  test("a file that is not a patch at all is still 'not a patch format we recognise' (not described as a damaged patch)", async () => {
    const r = await compat(ROM, "game.gba", fx.randomBytes(500, 4), "readme.txt");
    assert.equal(r.data.report.code, "patch-unrecognized");
    assert.equal(r.data.patch.format, null);
    assert.doesNotMatch(r.data.report.headline, /damaged/);
  });
});

describe("compatibility worker: extreme but well-formed inputs finish promptly (PPF, IPS, APS, RUP)", () => {
  const ROM = roms.makeGba(0x20000, 22);
  const ppfHeader = (version = 3) => [...ascii("PPF"), ...ascii(version === 3 ? "30" : "20"), version - 1, ...new Array(50).fill(0x20), 0, 0, 0, 0];
  const bounded = (res) => {
    assert.equal(res.timedOut, false, "must not get stuck");
    assert.ok(res.result && (res.result.type === "compat-result" || res.result.type === "error"), "must end with a result or a clean error");
    return res.result;
  };

  test("a PPF with 200,000 records is read in well under a second per 100k, and is Cannot Verify", () => {
    const body = [];
    for (let i = 0; i < 200000; i++) body.push(i & 0xff, (i >> 8) & 0xff, (i >> 16) & 0xff, 0, 0, 0, 0, 0, 1, 0xaa);
    const res = compatChild(ROM, "game.gba", Uint8Array.from([...ppfHeader(), ...body]), "big.ppf");
    const r = bounded(res);
    assert.equal(r.type, "compat-result");
    assert.equal(r.data.patch.format, "PPF");
    assert.equal(r.data.report.code, "no-checksum");
  });
  test("PPF files that end in the middle of the header, a block-check area or a record complete without hanging", () => {
    for (const cut of [4, 7, 30, 60, 62]) bounded(compatChild(ROM, "game.gba", Uint8Array.from(ppfHeader().slice(0, cut)), "cut.ppf"));
    const blockCheck = ppfHeader();
    blockCheck[57] = 1; // blockCheck flag set, but the 1024-byte block is missing
    bounded(compatChild(ROM, "game.gba", Uint8Array.from(blockCheck), "nocheck.ppf"));
    bounded(compatChild(ROM, "game.gba", Uint8Array.from([...ppfHeader(), 1, 2, 3, 0, 0, 0, 0, 0, 255, 1, 2]), "cutrecord.ppf"));
  });
  test("IPS with a huge record count and a record that runs past the end finish without hanging", () => {
    const edits = Array.from({ length: 50000 }, (_, i) => ({ offset: (i * 3) & 0xffff, bytes: [i & 0xff] }));
    const r = bounded(compatChild(ROM, "game.gba", fx.buildIps(edits), "many.ips"));
    assert.equal(r.data.report.code, "no-checksum");
    const truncated = Uint8Array.from([...ascii("PATCH"), 0, 0, 0, 0xff, 0xff, 1, 2, 3]);
    bounded(compatChild(ROM, "game.gba", truncated, "cut.ips"));
  });
  test("APS (N64 and GBA layouts) with junk and impossible counts complete without hanging", () => {
    bounded(compatChild(ROM, "game.gba", Uint8Array.from([...ascii("APS10"), ...fx.randomBytes(300, 7)]), "junk.aps"));
    bounded(compatChild(ROM, "game.gba", Uint8Array.from([...ascii("APS1"), 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, ...new Array(65544).fill(0x7)]), "junk-gba.aps"));
    bounded(compatChild(ROM, "game.gba", Uint8Array.from([...ascii("APS1"), 1, 2, 3]), "short.aps"));
  });
  test("RUP shorter than its own 2 KB header completes", () => {
    bounded(compatChild(ROM, "game.gba", Uint8Array.from(ascii("NINJA2....")), "short.rup"));
  });
  test("a valid RUP is still fully checked: its ROM is Compatible, another ROM is a Mismatch", async () => {
    const rup = buildRup({ source: ROM, target: fx.applyEdits(ROM, [{ offset: 10, bytes: [1] }]), records: [{ offset: 10, bytes: [ROM[10] ^ 1] }] });
    assert.equal((await compat(ROM, "game.gba", rup, "ok.rup")).data.report.state, "compatible");
    const other = await compat(roms.makeGba(0x20000, 23), "game.gba", rup, "ok.rup");
    assert.equal(other.data.report.state, "mismatch");
    assert.equal(other.data.report.code, "rom-incompatible-md5");
  });
});

// ================================================================== PMSR against its one known ROM

describe("compatibility worker: PMSR (Star Rod) with a forged base ROM of the exact size and CRC32", () => {
  const BASE = roms.makePmsrBaseRom(12);
  const PATCH = fx.buildPmsr([{ offset: 0x100, bytes: [1, 2, 3] }, { offset: 0x2000000, bytes: [9, 9] }]);

  test("the fixture really has the size and CRC32 the format is made for", () => {
    assert.equal(BASE.length, roms.PMSR_ROM_SIZE);
    assert.equal(zlib.crc32(BASE) >>> 0, roms.PMSR_ROM_CRC32);
  });
  test("that ROM is Compatible, and the report says what was compared (size and CRC32 of one known ROM)", async () => {
    const r = await compat(BASE, "game.z64", PATCH, "mod.pmsr", { wholeRomBytes: 64 * MB });
    assert.equal(r.data.patch.format, "PMSR");
    assert.equal(r.data.report.state, "compatible");
    assert.equal(r.data.report.code, "rom-compatible-fixed");
    assert.match(r.data.report.verification, /exactly one known ROM, whose size and CRC32 were compared/);
  });
  test("a patch with zero records is still a valid PMSR patch", async () => {
    const r = await compat(BASE, "game.z64", fx.buildPmsr([]), "empty.pmsr", { wholeRomBytes: 64 * MB });
    assert.equal(r.data.report.state, "compatible");
  });
  test("one flipped bit anywhere makes it a Mismatch", async () => {
    const flipped = Uint8Array.from(BASE);
    flipped[12345678] ^= 0x01;
    const r = await compat(flipped, "game.z64", PATCH, "mod.pmsr", { wholeRomBytes: 64 * MB });
    assert.equal(r.data.report.state, "mismatch");
    assert.equal(r.data.report.code, "rom-incompatible-fixed");
  });
  test("the right CRC32 on the wrong size is a Mismatch (the format checks both)", async () => {
    const extended = new Uint8Array(BASE.length + 4);
    extended.set(BASE);
    const r = await compat(extended, "game.z64", PATCH, "mod.pmsr", { wholeRomBytes: 64 * MB });
    assert.equal(r.data.report.state, "mismatch");
  });
  test("on a low-memory device (32 MB limit) the same files are Cannot Verify, with the reason and a way forward", async () => {
    const limit = RomToolkit.pickWholeRomLimit({ deviceMemory: 2 });
    const r = await compat(BASE, "game.z64", PATCH, "mod.pmsr", { wholeRomBytes: limit.bytes, reason: limit.reason });
    assert.equal(r.data.report.state, "cannot-verify");
    assert.equal(r.data.report.code, "rom-too-large-for-validation");
    assert.match(r.data.report.headline, /too large to check against a PMSR patch on this device/);
    assert.match(r.data.report.summary, /up to 32 MB on this device \(this device reports 2 GB of memory or less\)/);
    assert.match(r.data.report.steps.join(" "), /ROM Checksum Checker/);
    assert.match(r.data.report.steps.join(" "), /more memory is allowed to check larger ROMs \(up to 256 MB\)/);
    assert.equal(r.data.rom.crc32, roms.PMSR_ROM_CRC32.toString(16), "the ROM was still streamed, so its facts are reported");
  });
});

// ================================================================== memory limits

describe("pickWholeRomLimit: the limit follows the device", () => {
  const pick = (env) => RomToolkit.pickWholeRomLimit(env);
  const table = [
    [{ deviceMemory: 8, mobile: false }, 256, "desktop"],
    [{ deviceMemory: 16, mobile: false }, 256, "desktop"],
    [{ deviceMemory: 4, mobile: false }, 64, "modest-memory"],
    [{ deviceMemory: 2, mobile: false }, 32, "low-memory"],
    [{ deviceMemory: 0.5, mobile: false }, 32, "low-memory"],
    [{ deviceMemory: 0.25, mobile: true }, 32, "low-memory"],
    [{ deviceMemory: 8, mobile: true }, 64, "mobile"],
    [{ deviceMemory: 4, mobile: true }, 64, "mobile"],
    [{ mobile: true }, 64, "mobile"],
    [{ deviceMemory: null, mobile: true }, 64, "mobile"],
    [{}, 128, "unknown-desktop"],
    [{ mobile: false }, 128, "unknown-desktop"],
    [undefined, 128, "unknown-desktop"],
    [null, 128, "unknown-desktop"],
    [{ deviceMemory: 0 }, 128, "unknown-desktop"],
    [{ deviceMemory: -4 }, 128, "unknown-desktop"],
    [{ deviceMemory: Number.NaN }, 128, "unknown-desktop"],
    [{ deviceMemory: "8" }, 128, "unknown-desktop"],
  ];
  for (const [env, mb, tier] of table) {
    test(`${JSON.stringify(env)} -> ${mb} MB (${tier})`, () => {
      const r = pick(env);
      assert.equal(r.bytes, mb * MB);
      assert.equal(r.tier, tier);
      assert.ok(r.reason.length > 10, "every limit comes with a reason that can be shown to the person");
    });
  }
  test("no device ever gets more than the 256 MB ceiling or less than 32 MB", () => {
    for (const memory of [undefined, 0.25, 0.5, 1, 2, 3, 4, 6, 8, 32, 1e9]) {
      for (const mobile of [false, true]) {
        const bytes = pick({ deviceMemory: memory, mobile }).bytes;
        assert.ok(bytes >= 32 * MB && bytes <= RomToolkit.WHOLE_ROM_LIMIT);
      }
    }
    assert.equal(RomToolkit.WHOLE_ROM_LIMIT, 256 * MB);
  });
  test("the limit never grows when the device reports less memory or is mobile", () => {
    for (const mobile of [false, true]) {
      let previous = 0;
      for (const memory of [0.25, 0.5, 1, 2, 4, 8]) {
        const bytes = pick({ deviceMemory: memory, mobile }).bytes;
        assert.ok(bytes >= previous, `${memory} GB, mobile=${mobile}`);
        previous = bytes;
      }
    }
    for (const memory of [0.5, 2, 4, 8]) assert.ok(pick({ deviceMemory: memory, mobile: true }).bytes <= pick({ deviceMemory: memory, mobile: false }).bytes);
  });
});

describe("deviceEnvironmentFrom: reads the two facts from a navigator", () => {
  const from = (nav) => RomToolkit.deviceEnvironmentFrom(nav);
  test("Chromium on a phone (userAgentData) and on a desktop", () => {
    assert.deepEqual(plain(from({ userAgentData: { mobile: true }, deviceMemory: 4, userAgent: "x" })), { deviceMemory: 4, mobile: true });
    assert.deepEqual(plain(from({ userAgentData: { mobile: false }, deviceMemory: 8, userAgent: "Android" })), { deviceMemory: 8, mobile: false }, "userAgentData wins over the user-agent text");
  });
  test("browsers without userAgentData: phones and tablets by user agent, iPadOS pretending to be a Mac by touch points", () => {
    assert.equal(from({ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari" }).mobile, true);
    assert.equal(from({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" }).mobile, true);
    assert.equal(from({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 5 }).mobile, true);
    assert.equal(from({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", platform: "MacIntel", maxTouchPoints: 0 }).mobile, false);
    assert.equal(from({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/130.0" }).mobile, false);
  });
  test("deviceMemory is only passed through when it is a number (Firefox and Safari don't have it)", () => {
    assert.equal(from({ userAgent: "Firefox" }).deviceMemory, null);
    assert.equal(from({ userAgent: "x", deviceMemory: "8" }).deviceMemory, null);
  });
  test("no navigator at all is an empty environment", () => {
    assert.deepEqual(plain(from(undefined)), {});
    assert.deepEqual(plain(from(null)), {});
  });
});

describe("compatibility worker: the whole-ROM limit it receives", () => {
  const rupFor = (rom) => buildRup({ source: rom });
  const smallPatch = rupFor(fx.randomBytes(0x1000, 9));

  test("with no limit given it uses the conservative 64 MB default, not the 256 MB ceiling", async () => {
    assert.equal(RomToolkit.DEFAULT_WHOLE_ROM_LIMIT, 64 * MB);
    const r = await compat(new Uint8Array(65 * MB), "big.bin", smallPatch, "x.rup");
    assert.equal(r.data.report.code, "rom-too-large-for-validation");
    assert.ok(r.data.report.evidence.some((e) => /Size limit for RUP validation/.test(e.label) && /64/.test(e.value)));
  });
  test("a 65 MB ROM is checked when the page grants 128 MB", async () => {
    const r = await compat(new Uint8Array(65 * MB), "big.bin", smallPatch, "x.rup", { wholeRomBytes: 128 * MB });
    assert.equal(r.data.report.state, "mismatch");
    assert.equal(r.data.report.code, "rom-incompatible-md5");
  });
  test("a page can lower the limit but never raise it above the 256 MB ceiling", async () => {
    const r = await compat(new Uint8Array(257 * MB), "huge.bin", smallPatch, "x.rup", { wholeRomBytes: 10 * 1024 * MB });
    assert.equal(r.data.report.code, "rom-too-large-for-validation");
    assert.ok(r.data.report.evidence.some((e) => /Size limit for RUP validation/.test(e.label) && /256/.test(e.value)));
    assert.doesNotMatch(r.data.report.steps.join(" "), /more memory is allowed/, "at the ceiling there is no bigger device to suggest");
  });
  test("nonsense limits (negative, NaN, text) fall back to the default", async () => {
    for (const wholeRomBytes of [-1, Number.NaN, "999999999999"]) {
      const r = await compat(new Uint8Array(65 * MB), "big.bin", smallPatch, "x.rup", { wholeRomBytes });
      assert.equal(r.data.report.code, "rom-too-large-for-validation", String(wholeRomBytes));
    }
  });
  test("when the limit is exceeded the explanation names the limit, why it applies, and what to do", async () => {
    const r = await compat(new Uint8Array(33 * MB), "big.bin", smallPatch, "x.rup", { wholeRomBytes: 32 * MB, reason: "mobile browsers close tabs that use a lot of memory" });
    const { report } = r.data;
    assert.equal(report.state, "cannot-verify");
    assert.match(report.summary, /up to 32 MB on this device \(mobile browsers close tabs/);
    assert.match(report.verification, /exceeds the 32 MB limit/);
    assert.match(report.steps[0], /ROM Checksum Checker/);
  });
  test("streamed formats (UPS, BPS, IPS) ignore the limit completely", async () => {
    const rom = new Uint8Array(40 * MB);
    const edited = fx.applyEdits(rom, [{ offset: 5, bytes: [1] }]);
    const r = await compat(rom, "big.bin", fx.buildBps(rom, edited), "x.bps", { wholeRomBytes: 32 * MB });
    assert.equal(r.data.report.state, "compatible");
  });
});

// ================================================================== stage budgets and progress buckets

describe("stageBudgetMs and progressBucket", () => {
  test("the watchdog budget is 30 s plus a second per 2 MB, and tolerates nonsense", () => {
    assert.equal(RomToolkit.stageBudgetMs(0), 30000);
    assert.equal(RomToolkit.stageBudgetMs(2 * MB), 31000);
    assert.equal(RomToolkit.stageBudgetMs(64 * MB), 62000);
    assert.equal(RomToolkit.stageBudgetMs(256 * MB), 158000);
    for (const bad of [-5, Number.NaN, undefined, null, "12"]) assert.equal(RomToolkit.stageBudgetMs(bad), 30000);
  });
  test("progress is announced in steps of 25%", () => {
    const b = RomToolkit.progressBucket;
    assert.deepEqual([b(0, 100), b(24, 100), b(25, 100), b(49, 100), b(50, 100), b(74, 100), b(75, 100), b(99, 100), b(100, 100)], [0, 0, 25, 25, 50, 50, 75, 75, 100]);
    assert.equal(b(5, 0), 0);
    assert.equal(b(-5, 100), 0);
    assert.equal(b(250, 100), 100);
    assert.equal(b(Number.NaN, 100), 0);
  });
  test("the worker announces how long each step without progress may take, before it starts", () => {
    const rom = roms.makeGba(0x20000, 31);
    const rup = buildRup({ source: rom });
    const res = compatChild(rom, "game.gba", rup, "x.rup");
    assert.equal(res.timedOut, false);
    assert.ok(res.result.stageBudgets.length >= 2, "one for reading the patch's structure, one for the whole-ROM check");
    for (const ms of res.result.stageBudgets) assert.ok(ms >= 30000 && Number.isInteger(ms));
    const streamed = compatChild(rom, "game.gba", fx.buildBps(rom, fx.applyEdits(rom, [{ offset: 3, bytes: [9] }])), "x.bps");
    assert.equal(streamed.result.stageBudgets.length, 1, "a streamed check reports progress by itself, so only the patch step announces a budget");
  });
});

const plain = (value) => JSON.parse(JSON.stringify(value));

// ================================================================== accuracy: partial evidence and header notes

describe("accuracy: nothing implies a check that was not made", () => {
  const BODY = roms.makeSnes(0x80000, 71);
  const HACKED = fx.applyEdits(BODY, [{ offset: 0x1000, bytes: [5, 6, 7, 8] }]);
  const withHeader = (bytes) => {
    const out = new Uint8Array(bytes.length + 512);
    out.set(bytes, 512);
    return out;
  };
  const text = (report) => [report.headline, report.summary, report.verification, ...report.findings.flatMap((f) => [f.title, f.message]), ...report.steps].join("\n");

  test("headered SNES ROM + IPS (Cannot Verify): the header note says no check was made, in either direction", async () => {
    const ips = fx.buildIps([{ offset: 0x1000, bytes: [5, 6, 7, 8] }]);
    const r = await compat(withHeader(BODY), "game.smc", ips, "hack.ips");
    const { report } = r.data;
    assert.equal(report.state, "cannot-verify");
    const note = report.findings.find((f) => /512-byte SNES copier header/.test(f.title));
    assert.ok(note, "the header is still reported");
    assert.match(note.message, /stores nothing to compare, so no check was made on the ROM either with or without the header/);
    assert.doesNotMatch(text(report), /was checked on the ROM|comparison with the patch was made/i);
  });
  test("the same ROM against a BPS patch (really compared) says the comparison was made without the header", async () => {
    const r = await compat(withHeader(BODY), "game.smc", fx.buildBps(BODY, HACKED), "hack.bps");
    assert.equal(r.data.report.state, "compatible");
    const note = r.data.report.findings.find((f) => /512-byte SNES copier header/.test(f.title));
    assert.match(note.message, /comparison with the patch was made on the ROM without it/);
  });
  test("a header-set-aside note never accompanies a Cannot Verify verdict as if it were a check (xdelta, PPF, APS partial, too large)", async () => {
    const xdelta = fx.buildVcdiff(BODY, new Uint8Array(0));
    const ppf = Uint8Array.from([...ascii("PPF30"), 2, ...new Array(50).fill(0x20), 0, 0, 0, 0]);
    const reports = [];
    for (const [patch, name] of [[xdelta, "x.xdelta"], [ppf, "x.ppf"]]) reports.push((await compat(withHeader(BODY), "game.smc", patch, name)).data.report);
    for (const report of reports) {
      assert.equal(report.state, "cannot-verify");
      assert.doesNotMatch(text(report), /was checked on the ROM|comparison with the patch was made/i);
    }
  });
  test("an N64 APS match is explained as partial and never as compatibility, anywhere in the text", async () => {
    const original = roms.makeN64("z64", 0x100000, 64);
    const modified = fx.applyEdits(original, [{ offset: 0x2000, bytes: [1, 2, 3, 4] }]);
    const worker = createWorker("compat-worker.js");
    worker.context.__a = original;
    worker.context.__b = modified;
    const aps = Uint8Array.from(vm.runInContext(`(function(){var x=new BinFile(__a);x.fileName="a.z64";var y=new BinFile(__b);y.fileName="b.z64";return Array.from(RomPatcher.createPatch(x,y,"aps").export("p")._u8array);})()`, worker.context));
    const r = await compat(original, "game.z64", aps, "hack.aps");
    assert.equal(r.data.report.state, "cannot-verify");
    assert.equal(r.data.report.code, "partial-match-header");
    assert.doesNotMatch(text(r.data.report), /\bCompatible\b/);
    assert.equal(r.data.report.level, "unknown");
  });
});

describe("N64 byte order: the next steps say what to do about a swapped dump", () => {
  test("a .v64 (byte-swapped) ROM with a BPS made for .z64 is a Mismatch whose steps mention converting to .z64", async () => {
    const z64 = roms.makeN64("z64", 0x100000, 64);
    const swapped = Uint8Array.from(z64);
    for (let i = 0; i < swapped.length; i += 2) [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    const patch = fx.buildBps(z64, fx.applyEdits(z64, [{ offset: 0x2000, bytes: [9, 9, 9] }]));
    const r = await compat(swapped, "game.v64", patch, "hack.bps");
    assert.equal(r.data.report.state, "mismatch");
    assert.match(r.data.report.steps.join(" "), /big-endian \(\.z64\) byte order/);
  });
  test("the same advice appears when nothing can be compared (IPS), and not for a big-endian dump", async () => {
    const z64 = roms.makeN64("z64", 0x100000, 64);
    const v64 = roms.makeN64("v64", 0x100000, 64);
    const ips = fx.buildIps([{ offset: 0x2000, bytes: [1] }]);
    assert.match((await compat(v64, "game.v64", ips, "hack.ips")).data.report.steps.join(" "), /\.z64/);
    assert.doesNotMatch((await compat(z64, "game.z64", ips, "hack.ips")).data.report.steps.join(" "), /byte order/);
  });
});

// ================================================================== platform detection sanity checks

describe("detectPlatform: unrelated data is no longer 'confirmed' as a Game Boy, GBA, DS or SNES ROM", () => {
  const detect = (name, bytes, size = bytes.length) => RomToolkit.detectPlatform({ fileName: name, size, head: bytes.subarray(0, RomToolkit.HEAD_BYTES) });
  const oldGameBoyRule = (b) => {
    let x = 0;
    for (let i = 0x134; i <= 0x14c; i++) x = (x - b[i] - 1) & 0xff;
    return x === b[0x14d];
  };

  test("3,000 random 64 KB files: the old checksum-only Game Boy rule would have 'confirmed' some; the new detection confirms none", () => {
    let oldHits = 0;
    const confirmed = [];
    for (let seed = 1; seed <= 3000; seed++) {
      const bytes = fx.randomBytes(0x10000, seed * 7919);
      if (oldGameBoyRule(bytes)) oldHits++;
      for (const name of ["x.gb", "x.gba", "x.nds", "x.sfc", "x.bin"]) {
        const r = detect(name, bytes);
        if (r.confidence === "confirmed") confirmed.push(`${name} seed ${seed}: ${r.platform}`);
      }
    }
    assert.ok(oldHits >= 3, `the old rule must have produced false positives for this test to mean anything (got ${oldHits})`);
    assert.deepEqual(confirmed, []);
  });
  test("unrelated data with a valid Game Boy header checksum is only extension-based (and says so)", () => {
    const rom = fx.randomBytes(0x8000, 5);
    rom[0x147] = 0x77; // not a cartridge type
    let x = 0;
    for (let i = 0x134; i <= 0x14c; i++) x = (x - rom[i] - 1) & 0xff;
    rom[0x14d] = x;
    const r = detect("random.gb", rom);
    assert.equal(r.confidence, "extension-only");
    assert.match(r.evidence[0], /extension/i);
  });
  test("each Game Boy field the sanity check looks at matters: cartridge type, ROM-size code, RAM-size code, 16 KB banks", () => {
    const fix = (mutate, size = 0x8000) => {
      const rom = roms.makeGameBoy(size, 3);
      mutate(rom);
      let x = 0;
      for (let i = 0x134; i <= 0x14c; i++) x = (x - rom[i] - 1) & 0xff;
      rom[0x14d] = x;
      return rom;
    };
    assert.equal(detect("a.gb", fix(() => {})).confidence, "confirmed");
    assert.equal(detect("a.gb", fix((r) => (r[0x147] = 0x04))).confidence, "extension-only", "cartridge type 04h does not exist");
    assert.equal(detect("a.gb", fix((r) => (r[0x148] = 0x20))).confidence, "extension-only");
    assert.equal(detect("a.gb", fix((r) => (r[0x149] = 0x09))).confidence, "extension-only");
    assert.equal(detect("a.gb", fix(() => {}, 0x8001)).confidence, "extension-only", "size is not a whole number of 16 KB banks");
    assert.equal(detect("a.gb", fix((r) => (r[0x147] = 0x1b))).confidence, "confirmed", "MBC5+RAM+battery is real");
  });
  test("GBA: reserved bytes must be zero", () => {
    const rom = roms.makeGba(0x10000, 3);
    assert.equal(detect("a.gba", rom).confidence, "confirmed");
    rom[0xb7] = 1;
    let sum = 0;
    for (let i = 0xa0; i <= 0xbc; i++) sum += rom[i];
    rom[0xbd] = -(sum + 0x19) & 0xff; // the complement check passes again; only the reserved byte is wrong
    assert.equal(detect("a.gba", rom).confidence, "extension-only");
  });
  test("Nintendo DS: the boot-logo checksum and the unit code must be right", () => {
    const crc16 = (b) => {
      let crc = 0xffff;
      for (const v of b) {
        crc ^= v;
        for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
      }
      return crc & 0xffff;
    };
    const refresh = (rom) => {
      const c = crc16(rom.subarray(0, 0x15e));
      rom[0x15e] = c & 0xff;
      rom[0x15f] = c >>> 8;
      return rom;
    };
    assert.equal(detect("a.nds", roms.makeNds()).confidence, "confirmed");
    const badLogo = roms.makeNds();
    badLogo[0x15c] = 0x00;
    assert.equal(detect("a.nds", refresh(badLogo)).confidence, "extension-only");
    const badUnit = roms.makeNds();
    badUnit[0x12] = 0x07;
    assert.equal(detect("a.nds", refresh(badUnit)).confidence, "extension-only");
    const dsi = roms.makeNds();
    dsi[0x12] = 0x03;
    assert.equal(detect("a.nds", refresh(dsi)).platform, "Nintendo DSi");
  });
  test("SNES: a checksum/complement pair alone is not enough — map mode and ROM size must make sense", () => {
    assert.equal(detect("a.sfc", roms.makeSnes(0x80000, 4)).confidence, "confirmed");
    const badMap = roms.makeSnes(0x80000, 4);
    badMap[0x7fc0 + 0x15] = 0x00;
    assert.equal(detect("a.sfc", badMap).confidence, "extension-only");
    const badSize = roms.makeSnes(0x80000, 4);
    badSize[0x7fc0 + 0x17] = 0x30;
    assert.equal(detect("a.sfc", badSize).confidence, "extension-only");
    assert.equal(detect("a.sfc", roms.makeSnes(0x100000, 5, { mapping: "hirom" })).snes.mapping, "HiROM");
    assert.equal(detect("a.smc", roms.makeSnes(0x80000, 4, { copierHeader: true })).snes.copierHeader, true);
  });
  test("the explicit confidence labels are unchanged: confirmed / extension-only / unknown", () => {
    assert.equal(detect("a.gba", roms.makeGba()).confidence, "confirmed");
    assert.equal(detect("a.gba", fx.randomBytes(0x400, 1)).confidence, "extension-only");
    assert.equal(detect("noextension", fx.randomBytes(0x400, 1)).confidence, "unknown");
  });
});
