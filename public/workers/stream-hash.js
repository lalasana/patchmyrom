/*
 * Incremental (streaming) hashers: CRC32, MD5, SHA-1 and SHA-256.
 *
 * Why this exists. The browser's Web Crypto API can only hash a complete buffer, and the vendored
 * RomPatcher.js HashCalculator likewise needs the whole file in memory. For the checksum tool a ROM
 * is read in fixed-size chunks and fed through these hashers, so memory use stays at one chunk no
 * matter how large the file is (a 512 MB Nintendo DS dump needs a few MB, not 512 MB + copies).
 *
 * Pure functions, no DOM / worker / file APIs — the same file runs in the Web Workers and in the
 * Node regression tests (which compare every hasher against node:crypto and zlib.crc32 on random
 * data, across awkward chunk boundaries). These are the standard published algorithms (RFC 1321,
 * FIPS 180-4, ISO 3309); they are not used for anything security-sensitive here — they only let a
 * person compare a file with a checksum published next to a ROM or patch.
 *
 * Every hasher has update(u8) and digest() -> lowercase hex. digest() may be called once.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module && module.exports) {
    module.exports = api;
  } else {
    root.StreamHash = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function hex32(n) {
    var s = (n >>> 0).toString(16);
    while (s.length < 8) s = "0" + s;
    return s;
  }

  // ---------------------------------------------------------------- CRC32

  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function createCrc32() {
    var crc = 0xffffffff;
    return {
      update: function (u8) {
        var c = crc;
        for (var i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
        crc = c;
      },
      digest: function () {
        return hex32((crc ^ 0xffffffff) >>> 0);
      },
    };
  }

  // ---------------------------------------------------------------- block-hash scaffolding

  /**
   * Shared buffering for 64-byte-block hashes. `compress(blockView)` receives a Uint8Array of exactly
   * 64 bytes; `finish(totalLength)` pads and compresses the tail (little- or big-endian length).
   */
  function createBlockHasher(compress, bigEndianLength, readState) {
    var buffer = new Uint8Array(64);
    var filled = 0;
    var total = 0; // bytes seen so far (a double: exact up to 2^53)

    function update(u8) {
      var i = 0;
      var n = u8.length;
      total += n;
      if (filled > 0) {
        var take = Math.min(64 - filled, n);
        buffer.set(u8.subarray(0, take), filled);
        filled += take;
        i = take;
        if (filled === 64) {
          compress(buffer);
          filled = 0;
        }
      }
      while (i + 64 <= n) {
        compress(u8.subarray(i, i + 64));
        i += 64;
      }
      if (i < n) {
        buffer.set(u8.subarray(i, n), 0);
        filled = n - i;
      }
    }

    function digest() {
      var bitsLow = (total * 8) >>> 0; // low 32 bits of the bit length
      var bitsHigh = Math.floor((total * 8) / 4294967296) >>> 0;
      buffer[filled++] = 0x80;
      if (filled > 56) {
        while (filled < 64) buffer[filled++] = 0;
        compress(buffer);
        filled = 0;
      }
      while (filled < 56) buffer[filled++] = 0;
      if (bigEndianLength) {
        buffer[56] = bitsHigh >>> 24;
        buffer[57] = bitsHigh >>> 16;
        buffer[58] = bitsHigh >>> 8;
        buffer[59] = bitsHigh;
        buffer[60] = bitsLow >>> 24;
        buffer[61] = bitsLow >>> 16;
        buffer[62] = bitsLow >>> 8;
        buffer[63] = bitsLow;
      } else {
        buffer[56] = bitsLow;
        buffer[57] = bitsLow >>> 8;
        buffer[58] = bitsLow >>> 16;
        buffer[59] = bitsLow >>> 24;
        buffer[60] = bitsHigh;
        buffer[61] = bitsHigh >>> 8;
        buffer[62] = bitsHigh >>> 16;
        buffer[63] = bitsHigh >>> 24;
      }
      compress(buffer);
      return readState();
    }

    return { update: update, digest: digest };
  }

  function rotl(x, n) {
    return (x << n) | (x >>> (32 - n));
  }

  function rotr(x, n) {
    return (x >>> n) | (x << (32 - n));
  }

  // ---------------------------------------------------------------- MD5 (RFC 1321)

  var MD5_S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  var MD5_K = (function () {
    var k = new Int32Array(64);
    for (var i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
    return k;
  })();

  function createMd5() {
    var a0 = 0x67452301 | 0;
    var b0 = 0xefcdab89 | 0;
    var c0 = 0x98badcfe | 0;
    var d0 = 0x10325476 | 0;
    var m = new Int32Array(16);

    function compress(block) {
      for (var j = 0; j < 16; j++) {
        var p = j * 4;
        m[j] = block[p] | (block[p + 1] << 8) | (block[p + 2] << 16) | (block[p + 3] << 24);
      }
      var a = a0;
      var b = b0;
      var c = c0;
      var d = d0;
      for (var i = 0; i < 64; i++) {
        var f;
        var g;
        if (i < 16) {
          f = (b & c) | (~b & d);
          g = i;
        } else if (i < 32) {
          f = (d & b) | (~d & c);
          g = (5 * i + 1) & 15;
        } else if (i < 48) {
          f = b ^ c ^ d;
          g = (3 * i + 5) & 15;
        } else {
          f = c ^ (b | ~d);
          g = (7 * i) & 15;
        }
        f = (f + a + MD5_K[i] + m[g]) | 0;
        a = d;
        d = c;
        c = b;
        b = (b + rotl(f, MD5_S[i])) | 0;
      }
      a0 = (a0 + a) | 0;
      b0 = (b0 + b) | 0;
      c0 = (c0 + c) | 0;
      d0 = (d0 + d) | 0;
    }

    function leHex(word) {
      var s = "";
      for (var i = 0; i < 4; i++) {
        var byte = (word >>> (i * 8)) & 0xff;
        s += (byte < 16 ? "0" : "") + byte.toString(16);
      }
      return s;
    }

    return createBlockHasher(compress, false, function () {
      return leHex(a0) + leHex(b0) + leHex(c0) + leHex(d0);
    });
  }

  // ---------------------------------------------------------------- SHA-1 (FIPS 180-4)

  function createSha1() {
    var h0 = 0x67452301 | 0;
    var h1 = 0xefcdab89 | 0;
    var h2 = 0x98badcfe | 0;
    var h3 = 0x10325476 | 0;
    var h4 = 0xc3d2e1f0 | 0;
    var w = new Int32Array(80);

    function compress(block) {
      for (var t = 0; t < 16; t++) {
        var p = t * 4;
        w[t] = (block[p] << 24) | (block[p + 1] << 16) | (block[p + 2] << 8) | block[p + 3];
      }
      for (t = 16; t < 80; t++) w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
      var a = h0;
      var b = h1;
      var c = h2;
      var d = h3;
      var e = h4;
      for (t = 0; t < 80; t++) {
        var f;
        var k;
        if (t < 20) {
          f = (b & c) | (~b & d);
          k = 0x5a827999;
        } else if (t < 40) {
          f = b ^ c ^ d;
          k = 0x6ed9eba1;
        } else if (t < 60) {
          f = (b & c) | (b & d) | (c & d);
          k = 0x8f1bbcdc | 0;
        } else {
          f = b ^ c ^ d;
          k = 0xca62c1d6 | 0;
        }
        var temp = (rotl(a, 5) + f + e + k + w[t]) | 0;
        e = d;
        d = c;
        c = rotl(b, 30);
        b = a;
        a = temp;
      }
      h0 = (h0 + a) | 0;
      h1 = (h1 + b) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0;
    }

    return createBlockHasher(compress, true, function () {
      return hex32(h0) + hex32(h1) + hex32(h2) + hex32(h3) + hex32(h4);
    });
  }

  // ---------------------------------------------------------------- SHA-256 (FIPS 180-4)

  var SHA256_K = new Int32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
    0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa,
    0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85,
    0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
    0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  function createSha256() {
    var h = new Int32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]);
    var w = new Int32Array(64);

    function compress(block) {
      var t;
      for (t = 0; t < 16; t++) {
        var p = t * 4;
        w[t] = (block[p] << 24) | (block[p + 1] << 16) | (block[p + 2] << 8) | block[p + 3];
      }
      for (t = 16; t < 64; t++) {
        var x = w[t - 15];
        var y = w[t - 2];
        var s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        var s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = h[0];
      var b = h[1];
      var c = h[2];
      var d = h[3];
      var e = h[4];
      var f = h[5];
      var g = h[6];
      var hh = h[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + SHA256_K[t] + w[t]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        hh = g;
        g = f;
        f = e;
        e = (d + t1) | 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0;
      h[1] = (h[1] + b) | 0;
      h[2] = (h[2] + c) | 0;
      h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0;
      h[5] = (h[5] + f) | 0;
      h[6] = (h[6] + g) | 0;
      h[7] = (h[7] + hh) | 0;
    }

    return createBlockHasher(compress, true, function () {
      var s = "";
      for (var i = 0; i < 8; i++) s += hex32(h[i]);
      return s;
    });
  }

  // ---------------------------------------------------------------- all four at once

  /** One pass over the data feeds all four hashers (a file is read from disk only once). */
  function createAll() {
    var crc = createCrc32();
    var md5 = createMd5();
    var sha1 = createSha1();
    var sha256 = createSha256();
    return {
      update: function (u8) {
        crc.update(u8);
        md5.update(u8);
        sha1.update(u8);
        sha256.update(u8);
      },
      digest: function () {
        return { crc32: crc.digest(), md5: md5.digest(), sha1: sha1.digest(), sha256: sha256.digest() };
      },
    };
  }

  return {
    createCrc32: createCrc32,
    createMd5: createMd5,
    createSha1: createSha1,
    createSha256: createSha256,
    createAll: createAll,
  };
});
