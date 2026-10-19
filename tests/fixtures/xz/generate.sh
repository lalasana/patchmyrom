#!/usr/bin/env bash
# Regenerates the .xz golden vectors for the LZMA decoder tests with the REFERENCE implementation
# (liblzma via Python's `lzma` module, and the `xz` command-line tool for the multi-block vector).
#   Needs: python3, xz.   Run: bash generate.sh
# Only the .xz files and manifest.json are committed (the expected output is checked by size + CRC-32).
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'PY'
import json, lzma, random, zlib
r = random.Random(7)
def rnd(n): return bytes(r.getrandbits(8) for _ in range(n))
words = ["alpha", "beta", "gamma", "delta", "pokemon", "script", "message", "battle", "item", "map"]
def text(n):
    s = bytearray()
    while len(s) < n: s += (" ".join(r.choice(words) for _ in range(r.randint(5, 60))) + "\n").encode()
    return bytes(s[:n])
def mixed(n):
    b = bytearray()
    while len(b) < n:
        k = r.random()
        b += rnd(r.randint(1, 3000)) if k < .3 else (text(r.randint(50, 5000)) if k < .7 else bytes([r.getrandbits(8)]) * r.randint(1, 4000))
    return bytes(b[:n])
manifest = []
def add(name, data, **kw):
    comp = lzma.compress(data, format=lzma.FORMAT_XZ, **kw)
    open(name + ".xz", "wb").write(comp)
    manifest.append({"name": name, "size": len(data), "crc32": zlib.crc32(data), "xzBytes": len(comp)})
L = lambda **o: [dict(id=lzma.FILTER_LZMA2, **o)]
add("empty", b"", check=lzma.CHECK_NONE, filters=L(preset=6))
add("one_byte", b"x", check=lzma.CHECK_NONE, filters=L(preset=6))
add("text_40k", text(40_000), check=lzma.CHECK_NONE, filters=L(preset=6))
add("random_150k_uncompressed_chunks", rnd(150_000), check=lzma.CHECK_NONE, filters=L(preset=6))
add("zeros_300k_long_matches", bytes(300_000), check=lzma.CHECK_NONE, filters=L(preset=6))
add("mixed_120k_preset0", mixed(120_000), check=lzma.CHECK_NONE, filters=L(preset=0))
add("mixed_120k_preset9e", mixed(120_000), check=lzma.CHECK_NONE, filters=L(preset=9 | lzma.PRESET_EXTREME))
for lc, lp, pb in [(0, 0, 0), (4, 0, 0), (0, 4, 0), (2, 2, 4), (3, 0, 2)]:
    add(f"text_40k_lc{lc}_lp{lp}_pb{pb}", text(40_000), check=lzma.CHECK_NONE, filters=L(preset=6, lc=lc, lp=lp, pb=pb))
add("mixed_120k_check_crc32", mixed(120_000), check=lzma.CHECK_CRC32, filters=L(preset=6))
add("mixed_120k_check_crc64", mixed(120_000), check=lzma.CHECK_CRC64, filters=L(preset=6))
add("mixed_120k_check_sha256", mixed(120_000), check=lzma.CHECK_SHA256, filters=L(preset=6))
add("zeros_20m_bomb", bytes(20_000_000), check=lzma.CHECK_NONE, filters=L(preset=6))  # ~3 KB that expands to 20 MB: decompression-bomb shape
add("text_40k_dict4k", text(40_000), check=lzma.CHECK_NONE, filters=L(preset=6, dict_size=4096))
# multi-block stream: produced by the xz tool (python's compressor can't split blocks)
mb = mixed(150_000); open("_mb.raw", "wb").write(mb)
manifest.append({"name": "multiblock_xz_tool", "size": len(mb), "crc32": zlib.crc32(mb)})
json.dump(manifest, open("manifest.json", "w"), indent=1)
PY
xz --check=crc32 --block-size=40000 -c _mb.raw > multiblock_xz_tool.xz
rm -f _mb.raw
python3 - <<'PY'
import json, os
m = json.load(open("manifest.json"))
for e in m:
    if e["name"] == "multiblock_xz_tool": e["xzBytes"] = os.path.getsize("multiblock_xz_tool.xz")
json.dump(m, open("manifest.json", "w"), indent=1)
print(len(m), "vectors,", sum(os.path.getsize(f) for f in os.listdir(".") if f.endswith(".xz")), "bytes")
PY
