// Security / integrity review tests for the xdelta secondary-compression decoder and for what the
// UI is allowed to claim about the output. Driven through the real workers.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createRequire } from "node:module";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import { describeVerification } from "../lib/output-verification.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (...p) => new Uint8Array(fs.readFileSync(path.join(HERE, "fixtures", ...p)));
const V = createRequire(import.meta.url)("../public/workers/vcdiff-secondary.js");
const SRC = read("xdelta", "src.bin");
const TGT = Buffer.from(read("xdelta", "tgt.bin"));
const patch = (n) => read("xdelta", `${n}.xd`);
const OPTIONS = { requireValidation: true, removeHeader: true, fixChecksum: true, outputSuffix: true };

const apply = (rom, p, romName = "game.nds") =>
  createWorker("rom-patcher-worker.js").run({ type: "patch", romFile: fakeFile(rom, romName), patchFile: fakeFile(p, "p.xdelta"), options: OPTIONS, romCrc32: null });
const outBytes = (r) => Buffer.from(r.patchedRomU8Array.buffer, r.patchedRomU8Array.byteOffset, r.patchedRomU8Array.byteLength);
const noOutput = (r) => {
  assert.equal(r.type, "error");
  assert.equal(r.patchedRomU8Array, undefined);
};

// ---- tiny VCDIFF builder for hostile / odd shapes -------------------------------------------------
const vi = (n) => {
  const o = [n % 128];
  n = Math.floor(n / 128);
  while (n > 0) {
    o.unshift(128 | (n % 128));
    n = Math.floor(n / 128);
  }
  return o;
};
function windowBytes({ source = null, tl, di = 0, data = [], inst = [], addr = [], adler = null }) {
  const delta = [...vi(tl), di, ...vi(data.length), ...vi(inst.length), ...vi(addr.length), ...(adler === null ? [] : [adler >>> 24, (adler >>> 16) & 255, (adler >>> 8) & 255, adler & 255]), ...data, ...inst, ...addr];
  return [(source ? 1 : 0) | (adler === null ? 0 : 4), ...(source ? [...vi(source[0]), ...vi(source[1])] : []), ...vi(delta.length), ...delta];
}
const craft = (secondary, windows) => Uint8Array.from([0xd6, 0xc3, 0xc4, 0, secondary ? 1 : 0, ...(secondary ? [secondary] : []), ...windows.flat()]);

// ---- window-level surgery on real patches ----------------------------------------------------------
function ranges(u8) {
  let p = 4;
  const rd = () => {
    let v = 0;
    let x;
    do {
      x = u8[p++];
      v = v * 128 + (x & 127);
    } while (x & 128);
    return v;
  };
  const hdr = u8[p++];
  if (hdr & 1) p++;
  if (hdr & 2) {
    const n = rd(); // (not `p += rd()`: the left operand would be read before rd() advances p)
    p += n;
  }
  if (hdr & 4) {
    const n = rd();
    p += n;
  }
  const headerEnd = p;
  const wins = [];
  while (p < u8.length) {
    const start = p;
    const wi = u8[p++];
    if (wi & 3) {
      rd();
      rd();
    }
    const dl = rd();
    p += dl;
    wins.push([start, p]);
  }
  return { headerEnd, wins };
}
const join = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of parts) {
    out.set(x, o);
    o += x.length;
  }
  return out;
};
/** Rebuilds a PLAIN VCDIFF window without its Adler-32 (clears the flag, drops 4 bytes, fixes the length). */
function stripAdler(win) {
  let p = 0;
  const rd = () => {
    let v = 0;
    let x;
    do {
      x = win[p++];
      v = v * 128 + (x & 127);
    } while (x & 128);
    return v;
  };
  const wi = win[p++];
  assert.ok(wi & 4, "window has no Adler-32");
  const head = [wi & ~4];
  if (wi & 3) head.push(...vi(rd()), ...vi(rd()));
  const dl = rd();
  const deltaStart = p;
  rd(); // target length
  p++; // delta indicator
  rd();
  rd();
  rd();
  const adlerAt = p;
  const delta = join(win.subarray(deltaStart, adlerAt), win.subarray(adlerAt + 4, deltaStart + dl));
  return join(Uint8Array.from(head), Uint8Array.from(vi(delta.length)), delta);
}

// -------------------------------------------------------------------------------------------------
describe("decompression bombs and oversized declarations", () => {
  const bombXz = read("xz", "zeros_20m_bomb.xz");

  test("a REAL 3 KB LZMA stream that expands to 20 MB is refused before any decoding", async () => {
    const section = [...vi(20_000_000), ...bombXz];
    const evil = craft(2, [windowBytes({ tl: 20_000_000, di: 1, data: section })]);
    const t0 = Date.now();
    assert.throws(() => V.prepare(evil), (e) => e.code === "patch-corrupt" && /far more decompressed data/.test(e.message));
    assert.ok(Date.now() - t0 < 500, "must be rejected without decoding 20 MB");
    const r = await apply(SRC, evil);
    noOutput(r);
    assert.equal(r.code, "patch-corrupt");
  });

  test("the decoder itself still handles that stream correctly when given the matching size", () => {
    const out = V._decodeXz(bombXz, 20_000_000);
    assert.equal(out.length, 20_000_000);
    assert.equal(out[0] + out[19_999_999], 0);
  });

  test("declaring hundreds of MB from a few bytes is refused instantly", () => {
    const evil = craft(2, [windowBytes({ tl: 900_000_000, di: 1, data: [...vi(900_000_000), 0xfd, 0x37, 0x7a, 0x58, 0x5a, 0, 0, 0, 0, 0] })]);
    const t0 = Date.now();
    assert.throws(() => V.prepare(evil), (e) => e.code === "patch-corrupt");
    assert.ok(Date.now() - t0 < 200);
  });

  test("a patch declaring more than 1 GiB of output is refused with a clear message (selection time and apply time)", async () => {
    const evil = craft(0, [windowBytes({ tl: 2 ** 31 })]);
    assert.throws(() => V.inspect(evil), (e) => e.code === "patch-too-large" && /1024 MB/.test(e.message) && /xdelta3 command-line/.test(e.message));
    const analysis = await createWorker("analysis-worker.js").run({ type: "analyze-patch", requestId: "1", cacheKey: "1", file: fakeFile(evil, "p.xdelta") });
    assert.equal(analysis.type, "error");
    assert.equal(analysis.code, "patch-too-large");
    const r = await apply(SRC, evil);
    noOutput(r);
    assert.equal(r.code, "patch-too-large");
  });

  test("exactly 1 GiB of declared output is still accepted (a 512 MiB DS ROM patch is nowhere near the limit)", () => {
    assert.equal(V.inspect(craft(0, [windowBytes({ tl: 1024 * 1024 * 1024 })])).targetSize, 1024 * 1024 * 1024);
  });

  test("an absurd number of windows is refused; a large legitimate count is accepted", () => {
    const tiny = windowBytes({ tl: 0 });
    const many = (n) => craft(0, Array.from({ length: n }, () => tiny));
    assert.equal(V.inspect(many(131072)).windows, 131072);
    const t0 = Date.now();
    assert.throws(() => V.inspect(many(131073)), (e) => e.code === "patch-corrupt");
    assert.ok(Date.now() - t0 < 2000);
  });

  test("a failed allocation is reported as a clear 'not enough memory' error, not a raw browser error", () => {
    const RealU8 = globalThis.Uint8Array;
    globalThis.Uint8Array = class extends RealU8 {
      constructor(a, ...rest) {
        if (typeof a === "number" && a > 5000) throw new RangeError("Array buffer allocation failed");
        super(a, ...rest);
      }
    };
    try {
      assert.throws(() => V.prepare(patch("lzma")), (e) => e.code === "out-of-memory" && /couldn't allocate/.test(e.message) && /desktop/.test(e.message));
    } finally {
      globalThis.Uint8Array = RealU8;
    }
  });
});

// -------------------------------------------------------------------------------------------------
describe("cross-window state: tampering with window order never produces a trusted ROM", () => {
  const real = patch("lzma_win");
  const { headerEnd, wins } = ranges(real);
  const head = real.subarray(0, headerEnd);
  const w = (i) => real.subarray(wins[i][0], wins[i][1]);

  const variants = {
    "windows 2 and 3 swapped": () => join(head, w(0), w(2), w(1), ...wins.slice(3).map((_, k) => w(3 + k))),
    "window 2 duplicated": () => join(head, w(0), w(1), w(1), ...wins.slice(2).map((_, k) => w(2 + k))),
    "window 2 removed": () => join(head, w(0), ...wins.slice(2).map((_, k) => w(2 + k))),
    "first window removed (stream headers lost)": () => join(head, ...wins.slice(1).map((_, k) => w(1 + k))),
    "last two windows swapped": () => join(head, ...wins.slice(0, -2).map((_, k) => w(k)), w(wins.length - 1), w(wins.length - 2)),
  };
  for (const [label, build] of Object.entries(variants)) {
    test(`${label}: rejected (never a successful, verified patch)`, async () => {
      const tampered = build();
      const r = await apply(SRC, tampered);
      noOutput(r);
      assert.ok(r.code, `uncoded error: ${r.message}`);
    });
  }

  test("an untouched copy rebuilt from the same windows still works (the surgery itself is sound)", async () => {
    const r = await apply(SRC, join(head, ...wins.map((_, k) => w(k))));
    assert.equal(r.type, "success", r.message);
    assert.deepEqual(outBytes(r), TGT);
  });
});

// -------------------------------------------------------------------------------------------------
describe("verification claims are exact", () => {
  test("every checksum-carrying fixture reports verified with ALL windows checked", async () => {
    for (const name of ["none", "lzma", "lzma9", "lzma_win", "lzma_noapp"]) {
      const r = await apply(SRC, patch(name));
      assert.equal(r.type, "success", `${name}: ${r.message}`);
      assert.equal(r.outputVerified, true, name);
      assert.equal(r.verification.checked, r.verification.total, name);
      assert.ok(r.verification.total >= 1);
    }
  });

  test("a patch with no Adler-32 is never reported as verified", async () => {
    const r = await apply(SRC, patch("lzma_nochk"));
    assert.equal(r.type, "success");
    assert.equal(r.outputVerified, null);
    assert.equal(r.verification, null); // nothing to count: no window carries a checksum
  });

  test("only SOME windows carrying a checksum = partly verified, not verified (and still fail-closed on mismatch)", async () => {
    const plain = V.prepare(patch("lzma_win")).plain;
    const { headerEnd, wins } = ranges(plain);
    const parts = wins.map(([a, b], i) => (i < 4 ? stripAdler(plain.subarray(a, b)) : plain.subarray(a, b)));
    const partial = join(plain.subarray(0, headerEnd), ...parts);
    const r = await apply(SRC, partial);
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, null);
    assert.deepEqual({ ...r.verification }, { checked: 5, total: 9 }); // spread: the object comes from the worker's vm realm
    assert.deepEqual(outBytes(r), TGT);
    // a wrong ROM is still caught by the windows that do carry a checksum
    const wrong = new Uint8Array(SRC);
    for (let i = 0; i < wrong.length; i += 4099) wrong[i] ^= 0x55;
    const bad = await apply(wrong, partial);
    noOutput(bad);
    assert.equal(bad.code, "output-mismatch");
  });

  test("patches without checksums: any silent success is reported as unverified, never verified", async () => {
    const full = patch("lzma_nochk");
    for (let at = 20; at < full.length; at += 211) {
      const flipped = new Uint8Array(full);
      flipped[at] ^= 0xff;
      const r = await apply(SRC, flipped);
      if (r.type === "success") assert.equal(r.outputVerified, null, `byte ${at}: claimed verified without a checksum`);
    }
  });

  test("UI wording: verified / partial / unverified / mismatch are distinct and honest", () => {
    assert.equal(describeVerification(true, { checked: 9, total: 9 }).state, "verified");
    assert.match(describeVerification(true).label, /^Output verified/);
    const partial = describeVerification(null, { checked: 5, total: 9 });
    assert.equal(partial.state, "partial");
    assert.match(partial.label, /5 of 9/);
    assert.doesNotMatch(partial.label, /^Output verified/);
    for (const detail of [null, undefined, { checked: 0, total: 1 }, { checked: 0, total: 0 }]) {
      const none = describeVerification(null, detail);
      assert.equal(none.state, "unverified");
      assert.match(none.label, /couldn't be verified/);
      assert.doesNotMatch(none.label, /verified against/);
    }
    assert.equal(describeVerification(false).state, "mismatch");
  });

  test("the claim is never made for a failed run", async () => {
    const wrong = new Uint8Array(SRC);
    for (let i = 0; i < wrong.length; i += 4099) wrong[i] ^= 0x55;
    const r = await apply(wrong, patch("lzma"));
    noOutput(r);
    assert.equal(r.outputVerified, undefined);
  });
});

// -------------------------------------------------------------------------------------------------
describe("seeded structural fuzzing of the whole prepare() path", () => {
  // mulberry32: deterministic, so a failure reproduces
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (const name of ["lzma", "lzma_win", "lzma_nochk"]) {
    test(`${name}: 1500 mutations — every outcome is a result or a CODED error, each in well under a second`, () => {
      const base = patch(name);
      const rand = rng(name.length * 7919);
      let ok = 0;
      let coded = 0;
      let slowest = 0;
      for (let i = 0; i < 1500; i++) {
        let m = new Uint8Array(base);
        const kind = Math.floor(rand() * 6);
        if (kind === 0) for (let k = 1 + Math.floor(rand() * 8); k > 0; k--) m[Math.floor(rand() * m.length)] ^= 1 + Math.floor(rand() * 255);
        else if (kind === 1) m = m.subarray(0, Math.floor(rand() * m.length));
        else if (kind === 2) {
          const at = Math.floor(rand() * m.length);
          m = join(m.subarray(0, at), Uint8Array.from({ length: 1 + Math.floor(rand() * 40) }, () => Math.floor(rand() * 256)), m.subarray(at));
        } else if (kind === 3) {
          const at = Math.floor(rand() * m.length);
          m = join(m.subarray(0, at), m.subarray(at + 1 + Math.floor(rand() * 40)));
        } else if (kind === 4) {
          const at = Math.floor(rand() * Math.min(80, m.length)); // overwrite header / first-window length fields
          for (let k = 0; k < 1 + Math.floor(rand() * 6) && at + k < m.length; k++) m[at + k] = rand() < 0.5 ? 0xff : 0x80 | Math.floor(rand() * 128);
        } else {
          const at = Math.floor(rand() * m.length);
          m.fill(Math.floor(rand() * 256), at, Math.min(m.length, at + 1 + Math.floor(rand() * 300)));
        }
        const t0 = performance.now();
        try {
          V.prepare(m);
          ok++;
        } catch (e) {
          assert.ok(e && e.code, `mutation ${i} (kind ${kind}) threw an UNCODED error: ${e && e.stack}`);
          coded++;
        }
        slowest = Math.max(slowest, performance.now() - t0);
      }
      assert.ok(slowest < 1000, `slowest mutation took ${slowest.toFixed(0)} ms`);
      assert.ok(coded > ok, "most mutations must be rejected");
    });
  }
});

// -------------------------------------------------------------------------------------------------
describe("memory pressure inside the worker: graceful, friendly failure for every format", () => {
  async function applyWithFailingAllocator(rom, p, name) {
    const w = createWorker("rom-patcher-worker.js");
    // Installed from INSIDE the worker's realm: any big typed-array allocation now fails like an
    // exhausted browser would (the worker's own Uint8Array is a vm intrinsic, not a sandbox property).
    vm.runInContext(
      `(function () {
        var Real = Uint8Array;
        globalThis.Uint8Array = class extends Real {
          constructor(a, ...rest) {
            if (typeof a === "number" && a > 50000) throw new RangeError("Array buffer allocation failed");
            super(a, ...rest);
          }
        };
      })();`,
      w.context
    );
    return w.run({ type: "patch", romFile: fakeFile(rom, name), patchFile: fakeFile(p, "p.bin"), options: OPTIONS, romCrc32: null });
  }

  test("xdelta (LZMA): an allocation failure becomes 'out-of-memory', not a raw RangeError", async () => {
    const r = await applyWithFailingAllocator(SRC, patch("lzma"), "game.nds");
    noOutput(r);
    assert.equal(r.code, "out-of-memory");
    assert.match(r.message, /ran out of memory|couldn't allocate/);
    assert.doesNotMatch(r.message, /Array buffer allocation failed/);
  });

  test("BPS: the same, via the shared translator", async () => {
    const fx = await import("./helpers/fixtures.mjs");
    const src = fx.makeSyntheticGba(0x20000, 1);
    const dst = fx.applyEdits(src, fx.DEFAULT_EDITS);
    const r = await applyWithFailingAllocator(src, fx.buildBps(src, dst), "game.gba");
    noOutput(r);
    assert.equal(r.code, "out-of-memory");
    assert.doesNotMatch(r.message, /Array buffer allocation failed/);
  });

  test("an unrelated RangeError is not mislabelled as an out-of-memory condition", () => {
    const compat = createRequire(import.meta.url)("../public/workers/patch-compat.js");
    assert.notEqual(compat.explainError(new RangeError("Maximum call stack size exceeded")).code, "out-of-memory");
    assert.notEqual(compat.explainError(new Error("Array buffer allocation failed")).code, "out-of-memory");
  });
});
