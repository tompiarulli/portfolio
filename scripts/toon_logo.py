"""Builds Toon's menu mark: a stand-in until the real one is drawn.

A film leader's countdown circle: a ring with crosshairs, on a 16x16 grid.

    python scripts/toon_logo.py            # print the --logo token
    python scripts/toon_logo.py preview    # also write a zoomed PNG
"""

import sys

from logo import art, blank, preview, stamp, token


def leader():
    g = blank(16)
    stamp(
        g,
        0,
        0,
        """
................
.....######.....
...##..b...##...
..#....b....#...
.#.....b.....#..
.#.....b.....#..
#......b......#.
#bbbbbbbbbbbbb#.
#......b......#.
.#.....b.....#..
.#.....b.....#..
..#....b....#...
...##..b...##...
.....######.....
................
................
""",
    )
    return art(g)


if __name__ == "__main__":
    print(f"  --logo: {token(leader())};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview(leader(), sys.argv[2] if len(sys.argv) > 2 else "toon-logo.png")
