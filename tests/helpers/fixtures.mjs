// Synthetic ROM / patch fixtures for the regression tests.
//
// Everything here is generated from a seeded PRNG — no copyrighted ROM data is read,
// stored or shipped. The patch encoders below are deliberately independent of the
// vendored RomPatcher.js code, so a bug in the vendored encoder/decoder can't hide
// a bug in the code under test.
import zlib from "node:zlib";

export const crc32 = (u8) => zlib.crc32(u8) >>> 0;
export const hex8 = (n) => (n >>> 0).toString(16).padStart(8, "0");

/** Deterministic pseudo-random bytes (mulberry32). */
export function randomBytes(length, seed = 1) {
  const out = new Uint8Array(length);
  let a = seed >>> 0;
  for (let i = 0; i < length; i++) {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out[i] = ((t ^ (t >>> 14)) >>> 0) & 0xff;
  }
  return out;
}

/** Returns a copy of `source` with `edits` ({offset, bytes}) applied — a stand-in "hacked" ROM. */
export function applyEdits(source, edits) {
  const out = new Uint8Array(source);
  for (const { offset, bytes } of edits) out.set(bytes, offset);
  return out;
}

export const DEFAULT_EDITS = [
  { offset: 0x40, bytes: [1, 2, 3, 4, 5, 6, 7, 8] },
  { offset: 0x1200, bytes: Array.from({ length: 300 }, (_, i) => (i * 7) & 0xff) },
  { offset: 0x7ff0, bytes: [0xde, 0xad, 0xbe, 0xef] },
];

/** Synthetic GBA-shaped ROM: valid-looking header area so extension/size heuristics behave. */
export function makeSyntheticGba(size = 0x10000, seed = 1) {
  const rom = randomBytes(size, seed);
  rom.set(new TextEncoder().encode("SYNTHTEST   "), 0xa0); // title
  rom.set(new TextEncoder().encode("ATST"), 0xac); // game code
  rom[0xb2] = 0x96;
  return rom;
}

function concat(chunks) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

const u32le = (n) => Uint8Array.of(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff);

/** BPS/UPS variable-length integer. */
function vlv(value) {
  const bytes = [];
  let x = value;
  for (;;) {
    const low = x % 128;
    x = Math.floor(x / 128);
    if (x === 0) {
      bytes.push(0x80 | low);
      break;
    }
    bytes.push(low);
    x -= 1;
  }
  return Uint8Array.from(bytes);
}

/**
 * Builds a valid BPS patch (SourceRead for identical runs, TargetRead for differences).
 * Options let tests forge deliberately wrong checksums.
 */
export function buildBps(source, target, { sourceCrc, targetCrc, metadata = "" } = {}) {
  const actions = [];
  let i = 0;
  const n = target.length;
  while (i < n) {
    const same = i < source.length && source[i] === target[i];
    let j = i;
    while (j < n && (j < source.length && source[j] === target[j]) === same) j++;
    const len = j - i;
    if (same) {
      actions.push(vlv(((len - 1) * 4) + 0)); // SourceRead
    } else {
      actions.push(vlv(((len - 1) * 4) + 1), target.subarray(i, j)); // TargetRead
    }
    i = j;
  }
  const meta = new TextEncoder().encode(metadata);
  const body = concat([
    new TextEncoder().encode("BPS1"),
    vlv(source.length),
    vlv(target.length),
    vlv(meta.length),
    meta,
    ...actions,
    u32le(sourceCrc ?? crc32(source)),
    u32le(targetCrc ?? crc32(target)),
  ]);
  return concat([body, u32le(crc32(body))]);
}

/** Valid UPS patch between equal-size (or growing) buffers. */
export function buildUps(source, target, { sourceCrc, targetCrc } = {}) {
  const records = [];
  let ptr = 0;
  let i = 0;
  const n = Math.max(source.length, target.length);
  const at = (buf, k) => (k < buf.length ? buf[k] : 0);
  while (i < n) {
    if ((at(source, i) ^ at(target, i)) === 0) {
      i++;
      continue;
    }
    const start = i;
    const xor = [];
    while (i < n && (at(source, i) ^ at(target, i)) !== 0) {
      xor.push(at(source, i) ^ at(target, i));
      i++;
    }
    records.push(vlv(start - ptr), Uint8Array.from(xor), Uint8Array.of(0));
    ptr = i + 1;
  }
  const body = concat([
    new TextEncoder().encode("UPS1"),
    vlv(source.length),
    vlv(target.length),
    ...records,
    u32le(sourceCrc ?? crc32(source)),
    u32le(targetCrc ?? crc32(target)),
  ]);
  return concat([body, u32le(crc32(body))]);
}

/** Valid IPS patch from a list of {offset, bytes} edits (no checksum — IPS has none). */
export function buildIps(edits) {
  const chunks = [new TextEncoder().encode("PATCH")];
  for (const { offset, bytes } of edits) {
    chunks.push(
      Uint8Array.of((offset >>> 16) & 0xff, (offset >>> 8) & 0xff, offset & 0xff),
      Uint8Array.of((bytes.length >>> 8) & 0xff, bytes.length & 0xff),
      Uint8Array.from(bytes)
    );
  }
  chunks.push(new TextEncoder().encode("EOF"));
  return concat(chunks);
}

function vcdVarint(n) {
  const out = [n & 0x7f];
  n = Math.floor(n / 128);
  while (n > 0) {
    out.unshift(0x80 | (n & 0x7f));
    n = Math.floor(n / 128);
  }
  return Uint8Array.from(out);
}

/**
 * Minimal valid VCDIFF/xdelta patch: one window that COPYs the whole source, then
 * ADDs `appended` bytes (so target = source + appended). Uses the default code table.
 */
export function buildVcdiff(source, appended) {
  const data = Uint8Array.from(appended);
  // COPY size0/mode0 (code 19) + explicit size, then ADD with size = appended.length (code 1 + size)
  const inst = concat([Uint8Array.of(19), vcdVarint(source.length), Uint8Array.of(1 + appended.length)]);
  const addr = vcdVarint(0);
  const targetLen = source.length + appended.length;
  const delta = concat([
    vcdVarint(targetLen),
    Uint8Array.of(0), // delta indicator
    vcdVarint(data.length),
    vcdVarint(inst.length),
    vcdVarint(addr.length),
    data,
    inst,
    addr,
  ]);
  return concat([
    Uint8Array.of(0xd6, 0xc3, 0xc4, 0x00, 0x00), // magic, version, header indicator
    Uint8Array.of(0x01), // window indicator: VCD_SOURCE
    vcdVarint(source.length),
    vcdVarint(0),
    vcdVarint(delta.length),
    delta,
  ]);
}
