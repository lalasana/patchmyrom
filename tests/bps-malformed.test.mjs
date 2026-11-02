// Regression test for the BPS "freeze" found in release QA: the vendored BPS parser verifies a patch by re-exporting it,
// and BPS_getVLVLen uses 32-bit shifts, so a BPS patch with a valid checksum but a size >= 2^31, an action longer than
// 512 MiB, or a relative offset >= 2^30 makes it loop forever. PatchCompat.preflightPatch (run by the analysis worker, the
// patch worker and the compatibility worker) must refuse those before the parser sees them, and must keep accepting
// everything just inside the limits. The malformed cases run in a child process with a hard timeout, so a regression
// fails this file instead of freezing the test run.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import { runInChild } from "./helpers/child-run.mjs";
import * as fx from "./helpers/fixtures.mjs";

const PatchCompat = createRequire(import.meta.url)("../public/workers/patch-compat.js");

const OPTIONS = { requireValidation: true, removeHeader: true, fixChecksum: true, outputSuffix: true };

// BPS variable-length number encoder (spec), independent of the vendored one (which is the thing that hangs).
const vlv = (n) => {
  const out = [];
  for (;;) {
    const x = n % 128;
    n = Math.floor(n / 128);
    if (n === 0) {
      out.push(x | 128);
      break;
    }
    out.push(x);
    n -= 1;
  }
  return out;
};
const le32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];

/** A BPS file with a *valid* patch checksum around whatever numbers the test wants (the sizes need not be real). */
function bps({ source = 4, target = 4, actions }) {
  const body = [0x42, 0x50, 0x53, 0x31, ...vlv(source), ...vlv(target), ...vlv(0)];
  for (const a of actions) body.push(...a);
  const withCrcs = [...body, ...le32(0x11111111), ...le32(0x22222222)];
  return Uint8Array.from([...withCrcs, ...le32(zlib.crc32(Buffer.from(withCrcs)) >>> 0)]);
}
const sourceRead = (length) => vlv((length - 1) * 4);
const sourceCopy = (length, relative) => [...vlv((length - 1) * 4 + 2), ...vlv(relative >= 0 ? relative * 2 : -relative * 2 + 1)];

const MAX = 2 ** 31 - 1;
const MIB = 1024 * 1024;

// value -> [label, patch]: each of these made the vendored parser loop forever (measured with a VM timeout).
const HANGING = {
  "source size 2^31": bps({ source: 2 ** 31, actions: [sourceRead(4)] }),
  "target size 2^31": bps({ target: 2 ** 31, actions: [sourceRead(4)] }),
  "action longer than 512 MiB (2^29 + 1)": bps({ actions: [sourceRead(512 * MIB + 1)] }),
  "action of 1 GiB": bps({ actions: [sourceRead(1024 * MIB)] }),
  "action of 2^31 bytes": bps({ actions: [sourceRead(2 ** 31)] }),
  "SourceCopy relative offset +2^30": bps({ actions: [sourceCopy(4, 2 ** 30)] }),
  "SourceCopy relative offset -2^30": bps({ actions: [sourceCopy(4, -(2 ** 30))] }),
  "a number so long it overflows to infinity": Uint8Array.from([...bps({ actions: [[]] }).subarray(0, 7), ...new Array(40).fill(0x7f), ...new Array(30).fill(0)]),
};

// Just inside the limits: the vendored parser handles every one of these, so the preflight must let them through.
const ACCEPTED = {
  "sizes of 2^31 - 1": bps({ source: MAX, target: MAX, actions: [sourceRead(4)] }),
  "a single 512 MiB SourceRead (2^29)": bps({ actions: [sourceRead(512 * MIB)] }),
  "SourceCopy relative offset +(2^30 - 1)": bps({ actions: [sourceCopy(4, 2 ** 30 - 1)] }),
  "SourceCopy relative offset -(2^30 - 1)": bps({ actions: [sourceCopy(4, -(2 ** 30 - 1))] }),
};

describe("BPS preflight: numbers the vendored parser cannot survive", () => {
  for (const [label, patch] of Object.entries(HANGING)) {
    test(`refused before parsing: ${label}`, () => {
      const r = PatchCompat.preflightPatch(patch);
      assert.equal(r.ok, false);
      assert.equal(r.code, "patch-corrupt");
      assert.match(r.message, /damaged or incomplete/i);
    });
  }
  test("the too-large explanation names the 2 GB limit", () => {
    assert.match(PatchCompat.preflightPatch(HANGING["source size 2^31"]).message, /larger than 2 GB/);
  });
  for (const [label, patch] of Object.entries(ACCEPTED)) {
    test(`still accepted: ${label}`, () => {
      assert.equal(PatchCompat.preflightPatch(patch).ok, true);
    });
  }
  test("a TargetRead that runs past the end of the file is damaged, not accepted", () => {
    const patch = bps({ actions: [[...vlv((100 - 1) * 4 + 1), 1, 2, 3]] }); // announces 100 bytes, carries 3
    const r = PatchCompat.preflightPatch(patch);
    assert.equal(r.ok, false);
    assert.equal(r.code, "patch-corrupt");
  });
  test("a SourceCopy whose offset number is cut off is damaged", () => {
    const patch = bps({ actions: [vlv((4 - 1) * 4 + 2)] }); // no offset follows
    assert.equal(PatchCompat.preflightPatch(patch).ok, false);
  });
  test("real encoder output passes: BPS built from ROMs, with TargetRead, SourceCopy and TargetCopy-style content", () => {
    const source = fx.makeSyntheticGba(0x10000, 1);
    const target = fx.applyEdits(source, fx.DEFAULT_EDITS);
    assert.equal(PatchCompat.preflightPatch(fx.buildBps(source, target)).ok, true);
    assert.equal(PatchCompat.preflightPatch(fx.buildBps(source, target, { metadata: "some metadata" })).ok, true);
  });
});

describe("BPS freeze regression: every worker ends with a clear error, in well under a second", () => {
  const SRC = fx.makeSyntheticGba(0x10000, 1);
  for (const [label, patch] of Object.entries(HANGING)) {
    test(`${label}: analysis worker (patcher page), patch worker (Apply) and compat worker all return an error`, () => {
      const file = fakeFile(patch, "evil.bps");

      const analysis = runInChild("analysis-worker.js", { type: "analyze-patch", requestId: "x", cacheKey: "y", file }, { timeoutMs: 15000 });
      assert.equal(analysis.timedOut, false, "the analysis worker (existing patcher page) froze");
      assert.equal(analysis.result.type, "error");
      assert.equal(analysis.result.code, "patch-corrupt");

      const apply = runInChild(
        "rom-patcher-worker.js",
        { type: "patch", romFile: fakeFile(SRC, "g.gba"), patchFile: file, options: OPTIONS, romCrc32: fx.hex8(fx.crc32(SRC)) },
        { timeoutMs: 15000 },
      );
      assert.equal(apply.timedOut, false, "the patch worker froze");
      assert.equal(apply.result.type, "error");
      assert.equal(apply.result.code, "patch-corrupt");

      const compat = runInChild("compat-worker.js", { type: "check-compat", requestId: "c", rom: fakeFile(SRC, "g.gba"), patch: file }, { timeoutMs: 15000 });
      assert.equal(compat.timedOut, false, "the compatibility worker froze");
      assert.equal(compat.result.type, "compat-result");
      assert.equal(compat.result.data.report.code, "patch-corrupt");
      assert.equal(compat.result.data.report.state, "cannot-verify");
    });
  }
});

describe("valid BPS is unaffected", () => {
  const SRC = fx.makeSyntheticGba(0x10000, 1);
  const DST = fx.applyEdits(SRC, fx.DEFAULT_EDITS);
  const PATCH = fx.buildBps(SRC, DST);

  test("the patch worker still produces the byte-exact, verified output", async () => {
    const r = await createWorker("rom-patcher-worker.js").run({
      type: "patch",
      romFile: fakeFile(SRC, "g.gba"),
      patchFile: fakeFile(PATCH, "h.bps"),
      options: OPTIONS,
      romCrc32: fx.hex8(fx.crc32(SRC)),
    });
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, true);
    assert.equal(fx.crc32(Buffer.from(r.patchedRomU8Array.buffer, r.patchedRomU8Array.byteOffset, r.patchedRomU8Array.byteLength)), fx.crc32(DST));
  });
  test("the analysis worker still describes it", async () => {
    const r = await createWorker("analysis-worker.js").run({ type: "analyze-patch", requestId: "p", cacheKey: "k", file: fakeFile(PATCH, "h.bps") });
    assert.equal(r.type, "patch-result");
    assert.equal(r.data.format, "BPS");
    assert.equal(r.data.recognized, true);
  });
  test("the compatibility worker still reports Compatible", async () => {
    const r = await createWorker("compat-worker.js").run({ type: "check-compat", requestId: "c", rom: fakeFile(SRC, "g.gba"), patch: fakeFile(PATCH, "h.bps") });
    assert.equal(r.data.report.state, "compatible");
  });
});
