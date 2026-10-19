// OPTIONAL: reproduces a user report with real files you already own. Skipped unless both
// environment variables point at local files, so the repository never contains or needs ROM data.
//
//   PMR_REAL_GBA=path/to/patched.gba PMR_REAL_BPS=path/to/patch.bps npm test
//
// Scenario (Prince of Tennis 2004 Thai v6): the .gba supplied is the *already patched* result,
// so selecting it as the "original ROM" must produce the single "already patched" verdict.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import * as fx from "./helpers/fixtures.mjs";

const gbaPath = process.env.PMR_REAL_GBA;
const bpsPath = process.env.PMR_REAL_BPS;
const skip = !gbaPath || !bpsPath ? "set PMR_REAL_GBA and PMR_REAL_BPS to run" : false;

test("real patched ROM selected as the original -> single 'already patched' verdict, no output", { skip }, async () => {
  const gba = new Uint8Array(fs.readFileSync(gbaPath));
  const bps = new Uint8Array(fs.readFileSync(bpsPath));

  const analysis = createWorker("analysis-worker.js");
  const patch = (await analysis.run({ type: "analyze-patch", requestId: "p", cacheKey: "p", file: fakeFile(bps, "p.bps") })).data;
  assert.equal(patch.format, "BPS");
  assert.equal(patch.sourceChecksumCRC32, "03705974");
  assert.equal(patch.targetChecksumCRC32, "fae70b2d");
  assert.equal(patch.sourceSize, 33554432);
  assert.equal(patch.targetSize, 33554432);

  const rom = (await analysis.run({ type: "analyze-rom", requestId: "r", cacheKey: "r", file: fakeFile(gba, "game.gba") })).data;
  assert.equal(rom.crc32, "fae70b2d");
  assert.equal(rom.headerless, null);

  const r = await createWorker("rom-patcher-worker.js").run({
    type: "patch",
    romFile: fakeFile(gba, "game.gba"),
    patchFile: fakeFile(bps, "p.bps"),
    options: { requireValidation: true, removeHeader: true, fixChecksum: true, outputSuffix: true },
    romCrc32: fx.hex8(fx.crc32(gba)),
  });
  assert.equal(r.type, "error");
  assert.equal(r.code, "rom-already-patched");
  assert.match(r.message, /03705974/);
  assert.equal(r.patchedRomU8Array, undefined);
});
