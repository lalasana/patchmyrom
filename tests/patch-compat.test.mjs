// Unit tests for the shared compatibility classifier (public/workers/patch-compat.js).
// These pin the three user-facing outcomes and their wording.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const PatchCompat = createRequire(import.meta.url)("../public/workers/patch-compat.js");

// Values taken from the real-world report (numbers only — no ROM data involved).
const SOURCE = { crc32: "03705974", size: 33554432 };
const TARGET = { crc32: "fae70b2d", size: 33554432 };
const PATCH = {
  sourceSize: SOURCE.size,
  targetSize: TARGET.size,
  sourceCrc32: SOURCE.crc32,
  targetCrc32: TARGET.crc32,
};

const classify = (rom, patch = PATCH) => PatchCompat.classify({ rom, patch });

test("source CRC + size match -> compatible, not blocking", () => {
  const v = classify({ size: SOURCE.size, crc32: SOURCE.crc32 });
  assert.equal(v.status, "compatible");
  assert.equal(v.blocking, false);
  assert.equal(v.level, "ok");
  assert.match(v.message, /03705974/);
});

test("CRC comparison is case-insensitive and tolerant of a 0x prefix / missing leading zeros", () => {
  assert.equal(classify({ size: SOURCE.size, crc32: "03705974".toUpperCase() }).status, "compatible");
  assert.equal(classify({ size: SOURCE.size, crc32: "0x3705974" }).status, "compatible");
});

test("target CRC + size match -> already patched, blocking, explained clearly", () => {
  const v = classify({ size: TARGET.size, crc32: TARGET.crc32 });
  assert.equal(v.status, "already-patched");
  assert.equal(v.code, "rom-already-patched");
  assert.equal(v.blocking, true);
  assert.equal(v.level, "info");
  assert.match(v.title, /already patched/i);
  assert.match(v.message, /already the finished result/i);
  assert.match(v.message, /nothing left to apply/i);
  assert.match(v.message, /FAE70B2D/);
  // Points the user at what they actually need.
  assert.ok(v.details.some((d) => /03705974/.test(d.value)));
  // Must not blame region / revision / header: the file is exactly the finished product.
  assert.doesNotMatch(v.message, /region|revision|header/i);
});

test("target CRC but WRONG size is not treated as already patched", () => {
  const v = classify({ size: TARGET.size + 16, crc32: TARGET.crc32 });
  assert.equal(v.status, "incompatible");
});

test("neither matches (same size) -> one informative blocking warning naming the required original", () => {
  const v = classify({ size: SOURCE.size, crc32: "deadbeef" });
  assert.equal(v.status, "incompatible");
  assert.equal(v.code, "rom-incompatible");
  assert.equal(v.blocking, true);
  assert.equal(v.level, "warning");
  assert.match(v.message, /right size/i);
  const text = PatchCompat.toPlainText(v);
  assert.match(text, /03705974/); // required original
  assert.match(text, /DEADBEEF/); // what the user supplied
  assert.match(text, /can't skip this check/i);
});

test("neither matches (different size) -> size-specific explanation", () => {
  const v = classify({ size: 16777216, crc32: "deadbeef" });
  assert.equal(v.code, "rom-incompatible-size");
  assert.match(v.message, /33,554,432 bytes \(32 MB\)/);
  assert.match(v.message, /16,777,216 bytes \(16 MB\)/);
});

test("a tiny size difference mentions a possible extra header but never claims one was stripped", () => {
  const v = classify({ size: SOURCE.size + 512, crc32: "deadbeef" });
  assert.equal(v.status, "incompatible");
  assert.match(v.message, /extra header/i);
  assert.match(v.message, /never guesses/i);
  assert.equal(v.headerRemoved, false);
});

test("a large size difference does not talk about headers", () => {
  const v = classify({ size: SOURCE.size * 2, crc32: "deadbeef" });
  assert.doesNotMatch(v.message, /header/i);
});

test("copier header: verdict reached on the header-less view only when that view matches exactly", () => {
  const headered = {
    size: 262144 + 512,
    crc32: "11111111",
    headerless: { name: "SNES copier", headerSize: 512, size: 262144, crc32: "aaaa0001" },
  };
  const patch = { sourceSize: 262144, targetSize: 262144, sourceCrc32: "aaaa0001", targetCrc32: "bbbb0002" };

  const ok = classify(headered, patch);
  assert.equal(ok.status, "compatible");
  assert.equal(ok.headerRemoved, true);
  assert.match(ok.message, /512-byte SNES copier header/);

  const patched = classify({ ...headered, headerless: { ...headered.headerless, crc32: "bbbb0002" } }, patch);
  assert.equal(patched.status, "already-patched");

  const wrong = classify({ ...headered, headerless: { ...headered.headerless, crc32: "cccc0003" } }, patch);
  assert.equal(wrong.status, "incompatible");
  assert.equal(wrong.headerRemoved, false);
});

test("no embedded checksum (IPS and friends) -> unverifiable, never blocking", () => {
  const v = classify(
    { size: 1000, crc32: "12345678" },
    { sourceSize: null, targetSize: null, sourceCrc32: null, targetCrc32: null }
  );
  assert.equal(v.status, "unverifiable");
  assert.equal(v.blocking, false);
  assert.equal(v.level, "unknown");
});

test("a patch whose source and target are identical counts as compatible, not 'already patched'", () => {
  const same = { sourceSize: 100, targetSize: 100, sourceCrc32: "01020304", targetCrc32: "01020304" };
  assert.equal(classify({ size: 100, crc32: "01020304" }, same).status, "compatible");
});

test("explainError rewrites the library's terse messages", () => {
  assert.equal(PatchCompat.explainError(new Error("Patch checksum mismatch")).code, "patch-corrupt");
  assert.equal(PatchCompat.explainError(new Error("Invalid input ROM checksum")).code, "rom-incompatible");
  assert.equal(PatchCompat.explainError(new Error("Source ROM checksum mismatch")).code, "rom-incompatible");
  const other = PatchCompat.explainError(new Error("something else"));
  assert.equal(other.code, "patch-failed");
  assert.equal(other.message, "something else");
});
