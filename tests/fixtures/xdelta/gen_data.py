"""Deterministic synthetic ROM-like data for the xdelta fixtures.

No game data is involved: the "source" is seeded pseudo-random bytes mixed with generated text and
repeated tiles (so a delta compressor has something to chew on), and the "target" is the source with
scattered edits, three inserted blocks and one deletion.

usage: python3 gen_data.py <outdir> <size> <edits>
"""
import random
import sys


def make(seed, size):
    r = random.Random(seed)
    out = bytearray()
    words = ["POKEMON", "ATTACK", "SCRIPT", "MESSAGE", "ITEM", "MAP", "TRAINER", "BATTLE", "WILD", "GYM", "TEXT", "MOVE", "LEVEL", "FIRE", "WATER", "GRASS"]
    while len(out) < size:
        k = r.random()
        if k < 0.45:
            out += bytes(r.getrandbits(8) for _ in range(r.randint(200, 2000)))  # incompressible
        elif k < 0.75:
            out += (" ".join(r.choice(words) for _ in range(r.randint(20, 120))) + "\n").encode()  # text-like
        else:
            tile = bytes(r.getrandbits(8) for _ in range(32))
            out += tile * r.randint(4, 40)  # repeated tiles
    return bytes(out[:size])


def mutate(src, seed, edits):
    r = random.Random(seed)
    b = bytearray(src)
    for _ in range(edits):  # scattered edits (random and text-like)
        p = r.randrange(len(b) - 64)
        n = r.randint(1, 40)
        if r.random() < 0.5:
            b[p:p + n] = bytes(r.getrandbits(8) for _ in range(n))
        else:
            b[p:p + n] = (("EDIT%d " % r.randrange(1000)) * 8).encode()[:n]
    for _ in range(3):  # inserts (shift offsets, force address-coded copies)
        p = r.randrange(len(b))
        txt = ("NEW STRING TABLE ENTRY %d " % r.randrange(10**6)) * r.randint(200, 600)
        b[p:p] = txt.encode()
    p = r.randrange(len(b) - 5000)
    del b[p:p + 3000]  # delete
    return bytes(b)


if __name__ == "__main__":
    outdir, size, edits = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    src = make(1, size)
    tgt = mutate(src, 2, edits)
    open(outdir + "/src.bin", "wb").write(src)
    open(outdir + "/tgt.bin", "wb").write(tgt)
    print("src", len(src), "tgt", len(tgt), "edits", edits)
