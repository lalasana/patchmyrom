// xdelta / VCDIFF regression tests: secondary compression (LZMA), clear errors for unsupported
// compressors, and integrity (Adler-32) checks — driven through the REAL workers.
//
// tests/fixtures/xdelta/*.xd are genuine xdelta3 3.0.11 output (see generate.sh there); the data is
// synthetic. tests/fixtures/xz/*.xz are liblzma / xz-tool reference streams for the LZMA decoder.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import { runInChild } from "./helpers/child-run.mjs";
import * as fx from "./helpers/fixtures.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, "fixtures");
const read = (...p) => new Uint8Array(fs.readFileSync(path.join(FIXTURES, ...p)));
const V = createRequire(import.meta.url)("../public/workers/vcdiff-secondary.js");

const SRC = read("xdelta", "src.bin");
const TGT = Buffer.from(read("xdelta", "tgt.bin"));
const patch = (name) => read("xdelta", `${name}.xd`);
const OPTIONS = { requireValidation: true, removeHeader: true, fixChecksum: true, outputSuffix: true };

function apply(rom, patchBytes, { romName = "game.nds", patchName = "p.xdelta" } = {}) {
  return createWorker("rom-patcher-worker.js").run({
    type: "patch",
    romFile: fakeFile(rom, romName),
    patchFile: fakeFile(patchBytes, patchName),
    options: OPTIONS,
    romCrc32: null,
  });
}
const outBytes = (r) => Buffer.from(r.patchedRomU8Array.buffer, r.patchedRomU8Array.byteOffset, r.patchedRomU8Array.byteLength);
const assertNoOutput = (r) => {
  assert.equal(r.type, "error");
  assert.equal(r.patchedRomU8Array, undefined);
};

// -------------------------------------------------------------------------------------------------
describe("real xdelta3 patches: applied byte-exact and verified", () => {
  const cases = [
    ["none", "no secondary compression", true],
    ["lzma", "LZMA, single window", true],
    ["lzma9", "LZMA, -9", true],
    ["lzma_win", "LZMA, 9 windows, one LZMA stream per section type continuing across windows", true],
    ["lzma_noapp", "LZMA, no application header", true],
    ["lzma_nochk", "LZMA, no Adler-32 in the patch", false],
  ];
  for (const [name, label, verified] of cases) {
    test(`${name}: ${label}`, async () => {
      const r = await apply(SRC, patch(name));
      assert.equal(r.type, "success", r.message);
      assert.deepEqual(outBytes(r), TGT);
      assert.equal(r.outputVerified, verified ? true : null);
    });
  }

  test("secondary-compressed patch also works with a .gba ROM name and keeps the file name logic", async () => {
    const r = await apply(SRC, patch("lzma_win"), { romName: "hack.gba" });
    assert.equal(r.type, "success", r.message);
    assert.equal(r.fileName, "hack (patched).gba");
    assert.deepEqual(outBytes(r), TGT);
  });

  test("inspect() reports compressor, windows and Adler-32 availability", () => {
    assert.deepEqual(
      { s: V.inspect(patch("none")).secondary, w: V.inspect(patch("none")).windows },
      { s: "none", w: 1 }
    );
    const lz = V.inspect(patch("lzma"));
    assert.equal(lz.secondary, "LZMA");
    assert.equal(lz.windows, 1);
    assert.equal(lz.adlerWindows, 1);
    const win = V.inspect(patch("lzma_win"));
    assert.equal(win.windows, 9);
    assert.equal(win.adlerWindows, 9);
    assert.equal(V.inspect(patch("lzma_nochk")).adlerWindows, 0);
    assert.equal(win.targetSize, TGT.length);
  });

  test("prepare() leaves plain patches untouched (same array, no copy)", () => {
    const plain = patch("none");
    assert.equal(V.prepare(plain).plain, plain);
  });

  test("the plain patch produced from an LZMA patch is itself a valid, equivalent VCDIFF", () => {
    for (const name of ["lzma", "lzma_win"]) {
      const { plain } = V.prepare(patch(name));
      assert.equal(plain[4] & 1, 0, "secondary-compression flag must be cleared");
      assert.equal(V.inspect(plain).secondary, "none");
      assert.equal(V.inspect(plain).windows, V.inspect(patch(name)).windows);
    }
  });
});

// -------------------------------------------------------------------------------------------------
describe("unsupported secondary compressors fail with a clear, actionable message", () => {
  for (const [name, label] of [["djw", "DJW"], ["djw_win", "DJW"], ["fgk", "FGK"]]) {
    test(`${name} (${label}): at apply time`, async () => {
      const r = await apply(SRC, patch(name));
      assertNoOutput(r);
      assert.equal(r.code, "xdelta-secondary-unsupported");
      assert.match(r.message, new RegExp(`${label} secondary compression`));
      assert.match(r.message, /xdelta3 -S none/);
      assert.doesNotMatch(r.message, /not implemented|windowHeader|deltaIndicator/i, "no raw library text");
    });

    test(`${name} (${label}): already flagged when the patch is selected`, async () => {
      const analysis = createWorker("analysis-worker.js");
      const r = await analysis.run({ type: "analyze-patch", requestId: "1", cacheKey: "1", file: fakeFile(patch(name), "p.xdelta") });
      assert.equal(r.type, "error");
      assert.equal(r.code, "xdelta-secondary-unsupported");
      assert.match(r.message, new RegExp(label));
    });
  }

  test("supported patches are NOT flagged at selection", async () => {
    const analysis = createWorker("analysis-worker.js");
    for (const name of ["none", "lzma", "lzma_win"]) {
      const r = await analysis.run({ type: "analyze-patch", requestId: name, cacheKey: name, file: fakeFile(patch(name), "p.xdelta") });
      assert.equal(r.type, "patch-result", name);
      assert.equal(r.data.recognized, true);
      assert.equal(r.data.format, "VCDIFF");
    }
  });

  test("an unknown secondary id and a custom code table are reported as such", () => {
    const withId = new Uint8Array(patch("lzma"));
    withId[5] = 77; // secondary id byte
    assert.throws(() => V.inspect(withId), (e) => e.code === "xdelta-secondary-unsupported" && /id 77/.test(e.message));
    const withTable = new Uint8Array(patch("none"));
    withTable[4] |= 2; // claim a code table
    // the app-header length byte is now read as the code-table length (17 != 0)
    assert.throws(() => V.inspect(withTable), (e) => e.code === "xdelta-codetable-unsupported");
  });

  test("safety net: raw library messages are translated if they ever reach the library", () => {
    const compat = createRequire(import.meta.url)("../public/workers/patch-compat.js");
    assert.equal(compat.explainError(new Error("not implemented: secondary decompressor")).code, "xdelta-secondary-unsupported");
    assert.equal(compat.explainError(new Error("unimplemented windowHeader.deltaIndicator:7")).code, "xdelta-secondary-unsupported");
    assert.equal(compat.explainError(new Error("not implemented: custom code table")).code, "xdelta-codetable-unsupported");
  });
});

// -------------------------------------------------------------------------------------------------
describe("integrity: wrong source, damaged and truncated patches never yield a silent bad ROM", () => {
  const wrongRom = new Uint8Array(SRC);
  for (let i = 0; i < wrongRom.length; i += 4099) wrongRom[i] ^= 0x55;

  for (const name of ["none", "lzma", "lzma9", "lzma_win", "lzma_noapp"]) {
    test(`${name}: wrong source ROM is rejected by the patch's own Adler-32`, async () => {
      const r = await apply(wrongRom, patch(name));
      assertNoOutput(r);
      assert.equal(r.code, "output-mismatch");
      assert.match(r.message, /isn't the exact original|integrity check/i);
    });
  }

  test("a source ROM that is too short is rejected, not padded with zeros", async () => {
    const r = await apply(SRC.subarray(0, 30000), patch("lzma_win"));
    assertNoOutput(r);
    assert.ok(["output-mismatch", "patch-corrupt"].includes(r.code), r.code);
  });

  test("a patch without Adler-32 (xdelta3 -n) cannot be verified: applies, reported as unverified", async () => {
    const r = await apply(SRC, patch("lzma_nochk"));
    assert.equal(r.type, "success");
    assert.equal(r.outputVerified, null);
  });

  for (const name of ["none", "lzma_win"]) {
    test(`${name}: every truncation is an error with a clear message (many cut points)`, async () => {
      const full = patch(name);
      const cuts = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 20, 24, 30, 40, full.length - 1, full.length - 2, full.length - 4]);
      for (let c = 50; c < full.length; c += 37) cuts.add(c);
      for (const cut of cuts) {
        const r = await apply(SRC, full.subarray(0, cut));
        assertNoOutput(r);
        assert.ok(["patch-corrupt", "patch-unrecognized"].includes(r.code), `cut ${cut}: ${r.code} ${r.message}`);
      }
    });
  }

  test("truncation never hangs (isolated process, hard timeout)", () => {
    for (const cut of [4, 6, 20, 5000]) {
      const res = runInChild("rom-patcher-worker.js", {
        type: "patch",
        romFile: fakeFile(SRC, "game.nds"),
        patchFile: fakeFile(patch("lzma_win").subarray(0, cut), "p.xdelta"),
        options: OPTIONS,
        romCrc32: null,
      });
      assert.equal(res.timedOut, false, `cut ${cut} hung`);
      assert.equal(res.result.type, "error");
    }
  });

  for (const name of ["none", "lzma", "lzma_win"]) {
    test(`${name}: flipping any single byte either fails or still yields the exact target (never wrong output)`, async () => {
      const full = patch(name);
      let rejected = 0;
      let identical = 0;
      for (let at = 0; at < full.length; at += 127) {
        const flipped = new Uint8Array(full);
        flipped[at] ^= 0xff;
        const r = await apply(SRC, flipped);
        if (r.type === "success") {
          assert.deepEqual(outBytes(r), TGT, `byte ${at}: success with WRONG output`);
          identical++;
        } else {
          assert.ok(r.code, `byte ${at}: uncoded error ${r.message}`);
          assert.doesNotMatch(String(r.message), /Cannot read properties|undefined|is not a function/i, `byte ${at}: raw JS error leaked`);
          rejected++;
        }
      }
      assert.ok(rejected > identical, "most corruptions must be caught");
    });
  }

  test("hostile declared sizes are rejected cheaply (no giant allocation)", () => {
    // header: secondary LZMA; one window claiming a 2^40-byte decoded data section
    const vi = (n) => {
      const o = [n % 128];
      n = Math.floor(n / 128);
      while (n > 0) {
        o.unshift(128 | (n % 128));
        n = Math.floor(n / 128);
      }
      return o;
    };
    const section = [...vi(2 ** 40), 0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00, 0, 0, 0, 0];
    const delta = [...vi(10), 1 /* data section compressed */, ...vi(section.length), 0, 0, ...section];
    const evil = Uint8Array.from([0xd6, 0xc3, 0xc4, 0, 1, 2 /* LZMA */, 0 /* window: no source */, ...vi(delta.length), ...delta]);
    const t0 = Date.now();
    assert.throws(() => V.prepare(evil), (e) => e.code === "patch-corrupt");
    assert.ok(Date.now() - t0 < 500);
  });

  test("compressed sections without a declared secondary compressor are rejected", () => {
    const bad = new Uint8Array(patch("none"));
    // walk to the first window's delta indicator and set the "data section compressed" bit
    let p = 5;
    const varint = () => {
      let v = 0;
      let x;
      do {
        x = bad[p++];
        v = v * 128 + (x & 127);
      } while (x & 128);
      return v;
    };
    p += varint(); // application header (length + bytes)
    p++; // window indicator
    varint(); // source segment length
    varint(); // source segment position
    varint(); // delta length
    varint(); // target window length
    bad[p] = 1; // delta indicator
    assert.throws(() => V.inspect(bad), (e) => e.code === "patch-corrupt");
  });
});

// -------------------------------------------------------------------------------------------------
describe("synthetic xdelta patches with Adler-32 (header handling and checksum fix-ups)", () => {
  const body = fx.randomBytes(262144, 5);
  const appended = [9, 8, 7, 6, 5];

  test("copier-headered SNES ROM: the header is set aside, Adler-32 covers the header-less part only", async () => {
    const copier = fx.randomBytes(512, 77);
    const headered = new Uint8Array(512 + body.length);
    headered.set(copier, 0);
    headered.set(body, 512);
    const r = await apply(headered, fx.buildVcdiff(body, appended, { adler: true }), { romName: "game.sfc" });
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, true);
    const out = outBytes(r);
    assert.deepEqual(out.subarray(0, 512), Buffer.from(copier));
    assert.deepEqual([...out.subarray(512 + body.length)], appended);
  });

  test("Mega Drive ROM with a stale header checksum: a checksummed patch's output is not silently 'fixed'", async () => {
    const md = fx.randomBytes(0x20000, 7);
    md.set(new TextEncoder().encode("SEGA GENESIS    "), 0x100);
    md[0x18e] = 0x12;
    md[0x18f] = 0x34;
    const r = await apply(md, fx.buildVcdiff(md, appended, { adler: true }), { romName: "game.md" });
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, true);
    const out = outBytes(r);
    assert.equal(out[0x18e], 0x12);
    assert.equal(out[0x18f], 0x34);
  });

  test("a wrong Adler-32 in the patch discards the output", async () => {
    const rom = fx.randomBytes(40000, 3);
    const r = await apply(rom, fx.buildVcdiff(rom, appended, { adler: true, adlerOverride: 0x12345678 }));
    assertNoOutput(r);
    assert.equal(r.code, "output-mismatch");
  });

  test("a wrong source ROM is caught even for a tiny hand-built patch", async () => {
    const rom = fx.randomBytes(40000, 3);
    const other = fx.randomBytes(40000, 4);
    const r = await apply(other, fx.buildVcdiff(rom, appended, { adler: true }));
    assertNoOutput(r);
    assert.equal(r.code, "output-mismatch");
  });

  test("patches without Adler-32 keep their previous behaviour (apply, unverified)", async () => {
    const rom = fx.randomBytes(40000, 3);
    const r = await apply(rom, fx.buildVcdiff(rom, appended));
    assert.equal(r.type, "success");
    assert.equal(r.outputVerified, null);
  });
});

// -------------------------------------------------------------------------------------------------
describe("XZ / LZMA2 decoder against liblzma reference streams", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURES, "xz", "manifest.json"), "utf8"));
  const crc = (u8) => zlib.crc32(u8) >>> 0;

  for (const entry of manifest) {
    test(`${entry.name}`, () => {
      const out = V._decodeXz(read("xz", `${entry.name}.xz`), entry.size);
      assert.equal(out.length, entry.size);
      assert.equal(crc(out), entry.crc32);
    });
  }

  test("a declared size that disagrees with the stream is rejected", () => {
    const e = manifest.find((m) => m.name === "text_40k");
    assert.throws(() => V._decodeXz(read("xz", "text_40k.xz"), e.size - 1), (err) => err.code === "patch-corrupt");
    assert.throws(() => V._decodeXz(read("xz", "text_40k.xz"), e.size + 1), (err) => err.code === "patch-corrupt");
  });

  test("truncation: always a coded error, or exactly the right data (xdelta3-style cut-off streams)", () => {
    for (const name of ["text_40k", "mixed_120k_check_crc32", "random_150k_uncompressed_chunks"]) {
      const e = manifest.find((m) => m.name === name);
      const full = read("xz", `${name}.xz`);
      for (let cut = 0; cut < full.length; cut += Math.max(1, Math.floor(full.length / 97))) {
        try {
          const out = V._decodeXz(full.subarray(0, cut), e.size);
          assert.equal(crc(out), e.crc32, `${name} cut ${cut} returned wrong data`);
        } catch (err) {
          assert.ok(err.code, `${name} cut ${cut}: uncoded ${err && err.message}`);
        }
      }
    }
  });

  test("bit flips: coded errors only, and streams with a CRC check never return wrong data", () => {
    for (const name of ["text_40k", "mixed_120k_check_crc32", "mixed_120k_check_crc64"]) {
      const e = manifest.find((m) => m.name === name);
      const full = read("xz", `${name}.xz`);
      const hasCheck = /check_crc/.test(name);
      for (let at = 0; at < full.length; at += Math.max(1, Math.floor(full.length / 151))) {
        const bad = new Uint8Array(full);
        bad[at] ^= 0x10;
        try {
          const out = V._decodeXz(bad, e.size);
          if (hasCheck) assert.equal(crc(out), e.crc32, `${name} flip ${at}: wrong data passed the check`);
        } catch (err) {
          assert.ok(err.code, `${name} flip ${at}: uncoded ${err && err.message}`);
        }
      }
    }
  });
});
