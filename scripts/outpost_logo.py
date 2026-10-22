"""Builds Outpost 31's menu mark: a husky.

Drawn on a 16x16 character grid with the helpers in logo.py.

    python scripts/outpost_logo.py            # print the --logo token
    python scripts/outpost_logo.py preview    # also write a zoomed PNG
"""

import sys

from logo import art, blank, preview, stamp, token


def husky():
    """The menu mark: a husky running into camp, on a 16x16
    grid, dark cap and ears over a pale mask, with clear ice-blue eyes."""
    g = blank(16)
    stamp(
        g,
        0,
        0,
        """
................
.##..........##.
.#b#........#b#.
.#bb#......#bb#.
.#bbb######bbb#.
.##############.
.######aa######.
.##aaa#aa#aaa##.
.#aa..aaaa..aa#.
.#aaaaaaaaaaaa#.
..#aaaa##aaaa#..
..#aaaa##aaaa#..
...#aaaaaaaa#...
....#aa##aa#....
.....#aaaa#.....
......####......
""",
    )
    return art(g)


if __name__ == "__main__":
    print(f"  --logo: {token(husky())};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        path = sys.argv[2] if len(sys.argv) > 2 else "outpost-logo.png"
        # Ink on the theme's steel grey.
        preview(husky(), path, back=(197, 204, 210), ink=(10, 14, 18))
