// End-to-end regression tests through the REAL workers (public/workers/*.js) and the vendored
// RomPatcher.js, driven with synthetic ROMs/patches generated in tests/helpers/fixtures.mjs.
//
// Covers: successful patching, wrong-ROM mismatches, already-patched files, defence in depth
// behind the compatibility gate, corrupted/truncated patches, header handling, other formats.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import { runInChild } from "./helpers/child-run.mjs";
import * as fx from "./helpers/fixtures.mjs";

// Same options the site passes (hooks/useRomPatcherEngine.ts PATCH_OPTIONS).
const OPTIONS = { requireValidation: true, removeHeader: true, fixChecksum: true, outputSuffix: true };

function apply(rom, romName, patch, patchName, { romCrc32 = "auto" } = {}) {
  const crc = romCrc32 === "auto" ? fx.hex8(fx.crc32(rom)) : romCrc32;
  return createWorker("rom-patcher-worker.js").run({
    type: "patch",
    romFile: fakeFile(rom, romName),
    patchFile: fakeFile(patch, patchName),
    options: OPTIONS,
    romCrc32: crc,
  });
}

const outBytes = (r) => Buffer.from(r.patchedRomU8Array.buffer, r.patchedRomU8Array.byteOffset, r.patchedRomU8Array.byteLength);

// Shared GBA-shaped fixtures.
const SRC = fx.makeSyntheticGba(0x10000, 1);
const DST = fx.applyEdits(SRC, fx.DEFAULT_EDITS);
const OTHER_SAME_SIZE = fx.makeSyntheticGba(0x10000, 2);
const OTHER_BIGGER = fx.makeSyntheticGba(0x20000, 1);
const BPS = fx.buildBps(SRC, DST);

describe("BPS: successful patching", () => {
  for (const known of [true, false]) {
    test(`correct original -> verified, byte-exact output (pre-computed CRC supplied: ${known})`, async () => {
      const r = await apply(SRC, "game.gba", BPS, "hack.bps", { romCrc32: known ? "auto" : null });
      assert.equal(r.type, "success", r.message);
      assert.equal(r.outputVerified, true);
      assert.deepEqual(outBytes(r), Buffer.from(DST));
      assert.equal(r.fileName, "game (patched).gba");
    });
  }
});

describe("BPS: wrong ROM -> one clear blocking message, no output", () => {
  for (const known of [true, false]) {
    test(`same size, different contents (pre-computed CRC supplied: ${known})`, async () => {
      const r = await apply(OTHER_SAME_SIZE, "game.gba", BPS, "hack.bps", { romCrc32: known ? "auto" : null });
      assert.equal(r.type, "error");
      assert.equal(r.code, "rom-incompatible");
      assert.equal(r.patchedRomU8Array, undefined);
      assert.match(r.message, new RegExp(fx.hex8(fx.crc32(SRC)).toUpperCase())); // names the required original
      assert.match(r.message, new RegExp(fx.hex8(fx.crc32(OTHER_SAME_SIZE)).toUpperCase())); // and what was supplied
    });
  }

  test("different size", async () => {
    const r = await apply(OTHER_BIGGER, "game.gba", BPS, "hack.bps");
    assert.equal(r.type, "error");
    assert.equal(r.code, "rom-incompatible-size");
    assert.match(r.message, /65,536 bytes/);
    assert.match(r.message, /131,072 bytes/);
  });

  test("an empty ROM file is rejected, not patched", async () => {
    const r = await apply(new Uint8Array(0), "game.gba", BPS, "hack.bps", { romCrc32: null });
    assert.equal(r.type, "error");
    assert.equal(r.patchedRomU8Array, undefined);
  });
});

describe("BPS: already-patched ROM", () => {
  for (const known of [true, false]) {
    test(`is recognised and explained, never re-patched (pre-computed CRC supplied: ${known})`, async () => {
      const r = await apply(DST, "game.gba", BPS, "hack.bps", { romCrc32: known ? "auto" : null });
      assert.equal(r.type, "error");
      assert.equal(r.code, "rom-already-patched");
      assert.match(r.message, /already the finished result/i);
      assert.match(r.message, new RegExp(fx.hex8(fx.crc32(SRC)).toUpperCase())); // where to get the right file
      assert.doesNotMatch(r.message, /different dump|region|revision|extra header/i); // not blamed on the user's ROM source
      assert.equal(r.patchedRomU8Array, undefined);
    });
  }

  test("pre-flight (analysis) and apply-time gate give the identical wording", async () => {
    const analysis = createWorker("analysis-worker.js");
    const rom = (await analysis.run({ type: "analyze-rom", requestId: "r", cacheKey: "k", file: fakeFile(DST, "g.gba") })).data;
    const patch = (await analysis.run({ type: "analyze-patch", requestId: "p", cacheKey: "k2", file: fakeFile(BPS, "h.bps") })).data;
    const compat = (await import("module")).createRequire(import.meta.url)("../public/workers/patch-compat.js");
    const verdict = compat.classify({
      rom: { size: rom.fileSize, crc32: rom.crc32, headerless: rom.headerless },
      patch: {
        sourceSize: patch.sourceSize,
        targetSize: patch.targetSize,
        sourceCrc32: patch.sourceChecksumCRC32,
        targetCrc32: patch.targetChecksumCRC32,
      },
    });
    const applied = await apply(DST, "g.gba", BPS, "h.bps");
    assert.equal(verdict.status, "already-patched");
    assert.equal(applied.message, compat.toPlainText(verdict));
  });
});

describe("invalid source ROMs can never silently produce output", () => {
  test("library gate still rejects when the pre-computed CRC is wrong/forged (defence in depth)", async () => {
    // Claim the (wrong) ROM has the right CRC: the compatibility gate trusts the supplied value,
    // so RomPatcher.js's own requireValidation must be what stops this.
    const forged = fx.hex8(fx.crc32(SRC));
    const r = await apply(OTHER_SAME_SIZE, "game.gba", BPS, "hack.bps", { romCrc32: forged });
    assert.equal(r.type, "error");
    assert.equal(r.code, "rom-incompatible");
    assert.equal(r.patchedRomU8Array, undefined);
  });

  test("a patch with a correct source CRC but a wrong target CRC is discarded, not offered", async () => {
    const poisoned = fx.buildBps(SRC, DST, { targetCrc: 0x12345678 });
    const r = await apply(SRC, "game.gba", poisoned, "hack.bps");
    assert.equal(r.type, "error");
    assert.equal(r.code, "output-mismatch");
    assert.match(r.message, /discarded/i);
    assert.equal(r.patchedRomU8Array, undefined);
  });
});

describe("corrupted patches", () => {
  const flipped = (u8, at) => {
    const c = new Uint8Array(u8);
    c[at] ^= 0xff;
    return c;
  };
  const cases = {
    "one flipped byte": flipped(BPS, Math.floor(BPS.length / 2)),
    "truncated mid-actions": BPS.subarray(0, Math.floor(BPS.length / 2)),
    "truncated inside the header numbers": BPS.subarray(0, 8),
    "magic only ('BPS1')": BPS.subarray(0, 4),
    "UPS: magic only ('UPS1')": fx.buildUps(SRC, DST).subarray(0, 4),
    "UPS: truncated": fx.buildUps(SRC, DST).subarray(0, 30),
    "UPS: one flipped byte": flipped(fx.buildUps(SRC, DST), 20),
  };
  for (const [label, patch] of Object.entries(cases)) {
    test(`${label}: analysis and apply both fail fast with a clear message (no hang)`, () => {
      const file = fakeFile(patch, label.startsWith("UPS") ? "p.ups" : "p.bps");
      const analysis = runInChild("analysis-worker.js", { type: "analyze-patch", requestId: "x", cacheKey: "y", file });
      assert.equal(analysis.timedOut, false, "analysis hung on a damaged patch");
      assert.equal(analysis.result.type, "error");
      assert.equal(analysis.result.code, "patch-corrupt");
      assert.match(analysis.result.message, /damaged or incomplete/i);

      const apply = runInChild("rom-patcher-worker.js", {
        type: "patch",
        romFile: fakeFile(SRC, "g.gba"),
        patchFile: file,
        options: OPTIONS,
        romCrc32: fx.hex8(fx.crc32(SRC)),
      });
      assert.equal(apply.timedOut, false, "apply hung on a damaged patch");
      assert.equal(apply.result.type, "error");
      assert.equal(apply.result.code, "patch-corrupt");
      assert.equal(apply.result.patchedRomU8Array, undefined);
    });
  }

  test("a file that is not a patch at all is reported as unrecognised", async () => {
    const r = await apply(SRC, "game.gba", fx.randomBytes(4096, 9), "notes.bps");
    assert.equal(r.type, "error");
    assert.equal(r.code, "patch-unrecognized");
  });

  test("a zero-byte patch is reported as unrecognised", async () => {
    const r = await apply(SRC, "game.gba", new Uint8Array(0), "empty.bps");
    assert.equal(r.type, "error");
    assert.equal(r.code, "patch-unrecognized");
  });
});

describe("analysis worker", () => {
  test("reports BPS source/target sizes and checksums plus ROM hashes", async () => {
    const w = createWorker("analysis-worker.js");
    const rom = (await w.run({ type: "analyze-rom", requestId: "1", cacheKey: "a", file: fakeFile(SRC, "g.gba") })).data;
    const patch = (await w.run({ type: "analyze-patch", requestId: "2", cacheKey: "b", file: fakeFile(BPS, "p.bps") })).data;
    assert.equal(rom.crc32, fx.hex8(fx.crc32(SRC)));
    assert.equal(rom.headerless, null);
    assert.equal(patch.recognized, true);
    assert.equal(patch.format, "BPS");
    assert.equal(patch.sourceSize, SRC.length);
    assert.equal(patch.targetSize, DST.length);
    assert.equal(patch.sourceChecksumCRC32, fx.hex8(fx.crc32(SRC)));
    assert.equal(patch.targetChecksumCRC32, fx.hex8(fx.crc32(DST)));
  });
});

describe("header handling", () => {
  // SNES-style: patch built for the 256 KiB header-less ROM; the user's file has a 512-byte copier header.
  const BODY = fx.randomBytes(262144, 5);
  const BODY_HACKED = fx.applyEdits(BODY, [{ offset: 0x100, bytes: [9, 9, 9, 9] }]);
  const SNES_BPS = fx.buildBps(BODY, BODY_HACKED);
  const COPIER = fx.randomBytes(512, 77);
  const headered = new Uint8Array(512 + BODY.length);
  headered.set(COPIER, 0);
  headered.set(BODY, 512);

  test("copier-headered SNES ROM: recognised, patched with the header set aside and restored, output verified", async () => {
    const r = await apply(headered, "game.sfc", SNES_BPS, "p.bps");
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, true, "verification must cover the header-less part only");
    const out = outBytes(r);
    assert.equal(out.length, 512 + BODY.length);
    assert.deepEqual(out.subarray(0, 512), Buffer.from(COPIER)); // header preserved untouched
    assert.deepEqual(out.subarray(512), Buffer.from(BODY_HACKED)); // body patched exactly
  });

  test("analysis exposes the header-less view only for headers the library positively identifies", async () => {
    const w = createWorker("analysis-worker.js");
    const a = (await w.run({ type: "analyze-rom", requestId: "1", cacheKey: "a", file: fakeFile(headered, "game.sfc") })).data;
    assert.equal(a.headerless.name, "SNES copier");
    assert.equal(a.headerless.headerSize, 512);
    assert.equal(a.headerless.size, BODY.length);
    assert.equal(a.headerless.crc32, fx.hex8(fx.crc32(BODY)));
    assert.equal(a.crc32, fx.hex8(fx.crc32(headered))); // the file's own CRC is still reported as-is

    const plain = (await w.run({ type: "analyze-rom", requestId: "2", cacheKey: "b", file: fakeFile(BODY, "game.sfc") })).data;
    assert.equal(plain.headerless, null);
  });

  test("an already-patched copier-headered ROM is still recognised as already patched", async () => {
    const patchedWithHeader = new Uint8Array(512 + BODY.length);
    patchedWithHeader.set(COPIER, 0);
    patchedWithHeader.set(BODY_HACKED, 512);
    const r = await apply(patchedWithHeader, "game.sfc", SNES_BPS, "p.bps");
    assert.equal(r.type, "error");
    assert.equal(r.code, "rom-already-patched");
  });

  test("an unidentified extra header on a GBA ROM is NOT stripped or guessed at: blocked with an explanation", async () => {
    const junk = new Uint8Array(512 + SRC.length);
    junk.set(fx.randomBytes(512, 3), 0);
    junk.set(SRC, 512);
    const r = await apply(junk, "game.gba", BPS, "hack.bps");
    assert.equal(r.type, "error");
    assert.equal(r.code, "rom-incompatible-size");
    assert.match(r.message, /extra header/i);
    assert.match(r.message, /never guesses/i);
    assert.equal(r.patchedRomU8Array, undefined);

    const a = (await createWorker("analysis-worker.js").run({ type: "analyze-rom", requestId: "1", cacheKey: "a", file: fakeFile(junk, "game.gba") })).data;
    assert.equal(a.headerless, null);
  });

  test("Mega Drive hack with a stale header checksum: output is byte-exact to the patch's target (not silently 'fixed')", async () => {
    const md = fx.randomBytes(0x20000, 7);
    md.set(new TextEncoder().encode("SEGA GENESIS    "), 0x100);
    md[0x18e] = 0x12; // stale checksum word, as many hacks ship
    md[0x18f] = 0x34;
    const hacked = fx.applyEdits(md, [{ offset: 0x1000, bytes: [1, 2, 3, 4] }]);
    const r = await apply(md, "game.md", fx.buildBps(md, hacked), "p.bps");
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, true);
    assert.deepEqual(outBytes(r), Buffer.from(hacked));
  });

  test("IPS (no declared target checksum) keeps the library's Game Boy header-checksum fix-up", async () => {
    const gb = fx.randomBytes(0x8000, 11);
    gb.set([0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
            0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99], 0x104);
    const ips = fx.buildIps([{ offset: 0x140, bytes: [0x41, 0x42, 0x43, 0x44] }]); // edits the title => checksum stale
    const r = await apply(gb, "game.gb", ips, "p.ips", { romCrc32: null });
    assert.equal(r.type, "success", r.message);
    let expected = 0;
    const out = outBytes(r);
    for (let i = 0x134; i <= 0x14c; i++) expected = (expected - out[i] - 1) & 0xff;
    assert.equal(out[0x14d], expected);
  });
});

describe("other patch formats keep working", () => {
  test("UPS: correct original -> verified, byte-exact", async () => {
    const r = await apply(SRC, "game.gba", fx.buildUps(SRC, DST), "p.ups");
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, true);
    assert.deepEqual(outBytes(r), Buffer.from(DST));
  });

  test("UPS: wrong ROM and already-patched ROM get the same two verdicts as BPS", async () => {
    const ups = fx.buildUps(SRC, DST);
    const wrong = await apply(OTHER_SAME_SIZE, "game.gba", ups, "p.ups");
    assert.equal(wrong.code, "rom-incompatible");
    const done = await apply(DST, "game.gba", ups, "p.ups");
    assert.equal(done.code, "rom-already-patched");
  });

  test("IPS: applies edits; reports no checksum verification (format has none)", async () => {
    const r = await apply(SRC, "game.gba", fx.buildIps(fx.DEFAULT_EDITS), "p.ips", { romCrc32: null });
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, null);
    assert.deepEqual(outBytes(r), Buffer.from(DST));
  });

  test("IPS: cannot be pre-checked, so it is not blocked on a different ROM (documented behaviour)", async () => {
    const r = await apply(OTHER_SAME_SIZE, "game.gba", fx.buildIps(fx.DEFAULT_EDITS), "p.ips", { romCrc32: null });
    assert.equal(r.type, "success");
    assert.equal(r.outputVerified, null);
  });

  test("xdelta / VCDIFF: copy + add", async () => {
    const appended = [1, 2, 3, 4, 5];
    const r = await apply(SRC, "game.gba", fx.buildVcdiff(SRC, appended), "p.xdelta", { romCrc32: null });
    assert.equal(r.type, "success", r.message);
    const out = outBytes(r);
    assert.equal(out.length, SRC.length + appended.length);
    assert.deepEqual(out.subarray(0, SRC.length), Buffer.from(SRC));
    assert.deepEqual([...out.subarray(SRC.length)], appended);
  });

  test("analysis recognises every supported format signature", async () => {
    const w = createWorker("analysis-worker.js");
    const formats = [
      ["p.bps", BPS, "BPS"],
      ["p.ups", fx.buildUps(SRC, DST), "UPS"],
      ["p.ips", fx.buildIps(fx.DEFAULT_EDITS), "IPS"],
      ["p.xdelta", fx.buildVcdiff(SRC, [1]), "VCDIFF"],
    ];
    for (const [name, bytes, format] of formats) {
      const r = await w.run({ type: "analyze-patch", requestId: name, cacheKey: name, file: fakeFile(bytes, name) });
      assert.equal(r.data.recognized, true, name);
      assert.equal(r.data.format, format, name);
    }
  });
});
