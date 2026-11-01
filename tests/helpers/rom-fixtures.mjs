// Synthetic, platform-shaped ROM fixtures for the ROM toolkit tests.
//
// Everything is generated from a seeded PRNG plus the *public algorithms* each platform uses to
// validate its own header (a checksum, a complement, a magic string). No copyrighted data is read,
// stored or shipped — in particular no Nintendo logo bitmap: the detectors rely on checksums and
// signatures, so a ROM built here is recognised without containing anyone's game data.
import { randomBytes } from "./fixtures.mjs";

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
const CRC_TOP = new Map();
CRC_TABLE.forEach((value, index) => CRC_TOP.set(value >>> 24, index));

/**
 * Overwrites the last four bytes of `bytes` so that the CRC32 of the whole buffer is exactly `target`. Lets a test build
 * a ROM that a "made for exactly one ROM" format (PMSR) accepts, without any real game data.
 */
export function forceCrc32(bytes, target) {
  const end = bytes.length - 4;
  let reg = 0xffffffff;
  for (let i = 0; i < end; i++) reg = CRC_TABLE[(reg ^ bytes[i]) & 0xff] ^ (reg >>> 8);
  // Walk back from the register value the finished CRC implies to find the table index each of the last four steps needs...
  const index = new Array(4);
  let back = (target ^ 0xffffffff) >>> 0;
  for (let k = 3; k >= 0; k--) {
    index[k] = CRC_TOP.get(back >>> 24);
    back = ((back ^ CRC_TABLE[index[k]]) << 8) >>> 0;
  }
  // ...then walk forward from the prefix, choosing each byte so that step uses that index.
  for (let k = 0; k < 4; k++) {
    const b = (index[k] ^ reg) & 0xff;
    bytes[end + k] = b;
    reg = CRC_TABLE[(reg ^ b) & 0xff] ^ (reg >>> 8);
  }
  return bytes;
}

/** The one ROM a PMSR patch is made for: exactly 41,943,040 bytes with CRC32 A7F5CD7E (random content, no game data). */
export const PMSR_ROM_SIZE = 41943040;
export const PMSR_ROM_CRC32 = 0xa7f5cd7e;
export function makePmsrBaseRom(seed = 12) {
  const rom = randomBytes(PMSR_ROM_SIZE, seed);
  return forceCrc32(rom, PMSR_ROM_CRC32);
}

const ascii = (text) => Uint8Array.from([...text].map((c) => c.charCodeAt(0)));

/** GBA: fixed 0x96 at 0xB2, reserved bytes 0xB5..0xBB zero, header complement check at 0xBD (sum of 0xA0..0xBC). */
export function makeGba(size = 0x10000, seed = 1) {
  const rom = randomBytes(size, seed);
  rom.set(ascii("SYNTHETIC GBA"), 0xa0);
  rom[0xb2] = 0x96;
  rom.fill(0, 0xb5, 0xbc);
  let sum = 0;
  for (let i = 0xa0; i <= 0xbc; i++) sum += rom[i];
  rom[0xbd] = -(sum + 0x19) & 0xff;
  return rom;
}

function crc16Modbus(bytes) {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
  }
  return crc & 0xffff;
}

/** Nintendo DS: unit code at 0x12, boot-logo checksum CF56h at 0x15C, header CRC16 (MODBUS) of bytes 0x000-0x15D stored at 0x15E. */
export function makeNds(size = 0x40000, seed = 2) {
  const rom = randomBytes(size, seed);
  rom[0x12] = 0x00; // unit code: DS
  rom[0x15c] = 0x56;
  rom[0x15d] = 0xcf;
  const crc = crc16Modbus(rom.subarray(0, 0x15e));
  rom[0x15e] = crc & 0xff;
  rom[0x15f] = crc >>> 8;
  return rom;
}

/** Game Boy / Color: header checksum at 0x14D over 0x134-0x14C; 0x143 = 0xC0 (CGB only), 0x80 (both) or 0; plain ROM cartridge fields. */
export function makeGameBoy(size = 0x8000, seed = 3, cgbFlag = 0x00) {
  const rom = randomBytes(size, seed);
  rom[0x143] = cgbFlag;
  rom[0x147] = 0x00; // cartridge type: ROM only
  rom[0x148] = 0x00; // ROM size code: 32 KB
  rom[0x149] = 0x00; // RAM size code: none
  let x = 0;
  for (let i = 0x134; i <= 0x14c; i++) x = (x - rom[i] - 1) & 0xff;
  rom[0x14d] = x;
  return rom;
}

/** SNES: checksum + complement == 0xFFFF in the internal header (with map-mode and ROM-size bytes), optionally behind a 512-byte copier header. */
export function makeSnes(size = 0x80000, seed = 4, { mapping = "lorom", copierHeader = false } = {}) {
  const body = randomBytes(size, seed);
  const headerAddress = mapping === "hirom" ? 0xffc0 : 0x7fc0;
  body.set(ascii("SYNTHETIC SNES TEST   "), headerAddress); // 21-byte title area
  body[headerAddress + 0x15] = mapping === "hirom" ? 0x21 : 0x20; // map mode
  body[headerAddress + 0x17] = 0x0a; // ROM size code: 1 MB
  const checksum = 0x1234;
  const complement = checksum ^ 0xffff;
  body[headerAddress + 0x1c] = complement & 0xff;
  body[headerAddress + 0x1d] = complement >>> 8;
  body[headerAddress + 0x1e] = checksum & 0xff;
  body[headerAddress + 0x1f] = checksum >>> 8;
  if (!copierHeader) return body;
  const out = new Uint8Array(size + 512); // an all-zero copier header, as dumpers commonly write
  out.set(body, 512);
  return out;
}

/** NES with an iNES header. */
export function makeNes(size = 0x8000 + 0x2000 + 16, seed = 5) {
  const rom = randomBytes(size, seed);
  rom.set(ascii("NES\x1a"), 0);
  return rom;
}

/** Nintendo 64 in one of the three byte orders. */
export function makeN64(order = "z64", size = 0x100000, seed = 6) {
  const rom = randomBytes(size, seed);
  const magic = { z64: [0x80, 0x37, 0x12, 0x40], v64: [0x37, 0x80, 0x40, 0x12], n64: [0x40, 0x12, 0x37, 0x80] }[order];
  rom.set(magic, 0);
  return rom;
}

/** Sega Genesis / Mega Drive. */
export function makeGenesis(size = 0x80000, seed = 7) {
  const rom = randomBytes(size, seed);
  rom.set(ascii("SEGA MEGA DRIVE "), 0x100);
  return rom;
}

/** Sega Master System (regionNibble 3/4) or Game Gear (5/6/7). */
export function makeSms(regionNibble = 4, size = 0x8000, seed = 8) {
  const rom = randomBytes(size, seed);
  rom.set(ascii("TMR SEGA"), 0x7ff0);
  rom[0x7fff] = (regionNibble << 4) | 0x0a;
  return rom;
}
