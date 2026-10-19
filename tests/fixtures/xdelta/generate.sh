#!/usr/bin/env bash
# Regenerates the xdelta fixtures in this folder with the REFERENCE encoder.
#
#   Needs: xdelta3 (3.0.11 — Ubuntu's `xdelta3` package, built with LZMA), python3.
#   Run:   bash generate.sh [path/to/xdelta3]
#
# Every patch below was produced by xdelta3 and its own decoder round-trips it, so these are
# genuine xdelta3 files — not hand-built approximations. All data is synthetic (see gen_data.py);
# nothing here is copyrighted. The committed binaries are authoritative: regenerating on another
# xdelta3 build may produce byte-different (but equivalent) patches.
set -euo pipefail
cd "$(dirname "$0")"
X="${1:-xdelta3}"

python3 gen_data.py . 100000 900

enc() { # enc <name> <xdelta3 options...>
  name=$1; shift
  "$X" -e -f -s src.bin "$@" tgt.bin "$name.xd"
  "$X" -d -f -s src.bin "$name.xd" "$name.chk"
  cmp -s "$name.chk" tgt.bin || { echo "reference round-trip FAILED for $name" >&2; exit 1; }
  rm -f "$name.chk"
  printf '%-14s %7d bytes\n' "$name" "$(stat -c %s "$name.xd")"
}

enc none        -S none                    # no secondary compression, Adler-32 + app header (the common case)
enc lzma        -S lzma                    # one window, data/inst/addr all LZMA
enc lzma9       -9 -S lzma                 # slowest/best matching: different instruction mix
enc lzma_win    -S lzma -W 16384           # 6 windows; ONE LZMA stream per section type continues across them
enc lzma_nochk  -S lzma -n                 # no Adler-32 in the patch (cannot be verified end to end)
enc lzma_noapp  -S lzma -A=                # no application header
enc djw         -S djw                     # unsupported secondary compressor -> clear error expected
enc djw_win     -S djw -W 16384
enc fgk         -S fgk                     # unsupported secondary compressor -> clear error expected
