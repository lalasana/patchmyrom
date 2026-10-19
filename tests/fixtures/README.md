# Test fixtures

Everything here is **synthetic**: pseudo-random bytes, generated text and repeated tiles. No game data,
no ROMs, nothing copyrighted.

| Folder | What it is | Produced by |
|---|---|---|
| `xdelta/` | `src.bin` / `tgt.bin` (100 KB / 134 KB) and nine real `.xd` patches: no secondary compression, LZMA (single window, `-9`, 9 windows, no Adler-32, no app header) and the unsupported DJW / FGK variants | **xdelta3 3.0.11** (the reference encoder), see `xdelta/generate.sh`. Every patch is round-tripped through xdelta3's own decoder before being kept. |
| `xz/` | 18 `.xz` streams (including `zeros_20m_bomb`, 3 KB that expands to 20 MB: the decompression-bomb shape; LZMA2 presets, `lc/lp/pb` combinations, dictionary sizes, CRC32 / CRC64 / SHA-256 checks, uncompressed chunks, a multi-block stream) plus `manifest.json` with expected size and CRC-32 | **liblzma** via Python's `lzma` module and the `xz` tool, see `xz/generate.sh` |

The committed binaries are the source of truth. Regenerating needs `xdelta3` (with LZMA), `python3` and
`xz`; a different xdelta3 build may emit byte-different but equivalent patches.

Licensing: the patches and streams are data produced by running those tools on synthetic input; the tools
themselves are not included. xdelta3 is GPL-2.0-or-later (its DJW/FGK/LZMA glue code is why PatchMyROM does
not port DJW/FGK), liblzma is public domain.

One-off checks that are too large to commit (run locally, results in the xdelta change report): 40 more
`.xz` streams up to 5 MB, 90 further real xdelta3 patches across sizes/options, and a 128 MB source ROM with
real plain and LZMA patches for timing and memory.
