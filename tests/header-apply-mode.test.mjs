// Regression tests for how the patch worker treats ROM headers and the Game Boy header checksum.
// These pin the behaviour that the NES / SNES / GBC pages describe to users.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import * as fx from "./helpers/fixtures.mjs";

// Same options the site passes (hooks/useRomPatcherEngine.ts PATCH_OPTIONS).
const OPTIONS = { requireValidation: true, removeHeader: true, fixChecksum: true, outputSuffix: true };

function apply(rom, romName, patch, patchName) {
  return createWorker("rom-patcher-worker.js").run({
    type: "patch",
    romFile: fakeFile(rom, romName),
    patchFile: fakeFile(patch, patchName),
    options: OPTIONS,
    romCrc32: fx.hex8(fx.crc32(rom)),
  });
}
const outBytes = (r) => Buffer.from(r.patchedRomU8Array.buffer, r.patchedRomU8Array.byteOffset, r.patchedRomU8Array.byteLength);

describe("IPS applies to the file exactly as supplied (no silent header stripping)", () => {
  // iNES-headered NES ROM: 16-byte header + 32 KiB. The IPS offsets include the header.
  const nes = new Uint8Array(16 + 32768);
  nes.set([0x4e, 0x45, 0x53, 0x1a, 2, 1, 0, 0], 0);
  for (let i = 16; i < nes.length; i++) nes[i] = (i * 7) & 255;
  const edits = [{ offset: 0x100, bytes: [0xde, 0xad, 0xbe, 0xef] }];

  test("NES: a headered .nes + an IPS built against the headered file lands byte-exact", async () => {
    const r = await apply(nes, "game.nes", fx.buildIps(edits), "hack.ips");
    assert.equal(r.type, "success", r.message);
    assert.deepEqual(outBytes(r), Buffer.from(fx.applyEdits(nes, edits)));
  });

  test("SNES: a copier-headered .sfc + an IPS built against the headered file lands byte-exact", async () => {
    const body = fx.randomBytes(262144, 9);
    const headered = new Uint8Array(512 + body.length);
    headered.set(fx.randomBytes(512, 3), 0);
    headered.set(body, 512);
    const e = [{ offset: 0x2000, bytes: [1, 2, 3, 4] }];
    const r = await apply(headered, "game.sfc", fx.buildIps(e), "hack.ips");
    assert.equal(r.type, "success", r.message);
    assert.deepEqual(outBytes(r), Buffer.from(fx.applyEdits(headered, e)));
  });
});

describe("BPS built against a headered file", () => {
  test("NES: BPS whose source checksum matches the whole headered file applies to the whole file", async () => {
    const src = new Uint8Array(16 + 32768);
    src.set([0x4e, 0x45, 0x53, 0x1a, 2, 1, 0, 0], 0);
    for (let i = 16; i < src.length; i++) src[i] = (i * 5) & 255;
    const dst = fx.applyEdits(src, [{ offset: 0x400, bytes: [9, 8, 7, 6] }]);
    const r = await apply(src, "game.nes", fx.buildBps(src, dst), "hack.bps");
    assert.equal(r.type, "success", r.message);
    assert.equal(r.outputVerified, true);
    assert.deepEqual(outBytes(r), Buffer.from(dst));
  });
});

describe("Game Boy header checksum (what the GBC page claims)", () => {
  const LOGO = [
    0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
    0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  ];
  const headerChecksum = (u) => {
    let c = 0;
    for (let i = 0x134; i <= 0x14c; i++) c = (c - u[i] - 1) & 255;
    return c;
  };
  const gb = new Uint8Array(0x8000);
  for (let i = 0; i < gb.length; i++) gb[i] = (i * 13) & 255;
  gb.set(LOGO, 0x104);
  gb[0x14d] = headerChecksum(gb);
  const edits = [{ offset: 0x140, bytes: [0x41, 0x42, 0x43] }]; // edits the title -> header checksum goes stale
  const raw = fx.applyEdits(gb, edits);

  test("IPS on a .gb/.gbc: the stale header checksum (0x14D) is recalculated", async () => {
    assert.notEqual(raw[0x14d], headerChecksum(raw), "fixture must make the checksum stale");
    for (const name of ["game.gb", "game.gbc"]) {
      const r = await apply(gb, name, fx.buildIps(edits), "hack.ips");
      assert.equal(r.type, "success", r.message);
      const out = outBytes(r);
      assert.equal(out[0x14d], headerChecksum(out));
      // only that one byte differs from the raw patched result
      const diffs = [...out].flatMap((b, i) => (b === raw[i] ? [] : [i]));
      assert.deepEqual(diffs, [0x14d]);
    }
  });

  test("IPS on a file without a .gb/.gbc extension: left exactly as patched", async () => {
    const r = await apply(gb, "game.bin", fx.buildIps(edits), "hack.ips");
    assert.equal(r.type, "success", r.message);
    assert.deepEqual(outBytes(r), Buffer.from(raw));
  });

  test("UPS and BPS: the patch defines the output, so no checksum rewrite happens", async () => {
    for (const [patch, name] of [[fx.buildUps(gb, raw), "hack.ups"], [fx.buildBps(gb, raw), "hack.bps"]]) {
      const r = await apply(gb, "game.gb", patch, name);
      assert.equal(r.type, "success", r.message);
      assert.deepEqual(outBytes(r), Buffer.from(raw));
    }
  });
});
