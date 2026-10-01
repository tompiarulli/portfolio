"""Builds Silk's menu mark: a window with its tab.

The mark is drawn in code on a 16x16 character grid, one character per pixel,
in up to three levels: '#' full, 'b' 0.7 and 'a' 0.4 opacity, and '.' clear
so the menu bar shows through.

    python scripts/silk_logo.py            # print the --logo token
    python scripts/silk_logo.py preview    # also write a zoomed PNG
"""

import sys

from logo import art, blank, preview, stamp, token


def window():
    """A window seen head-on: a short tab at the top left, a one-pixel
    frame, a lighter body, on a 16x16 grid."""
    g = blank(16)
    stamp(
        g,
        0,
        0,
        """
................
.#######........
.#bbbbb#........
.#bbbbb#........
.##############.
.#aaaaaaaaaaaa#.
.#aaaaaaaaaaaa#.
.#aaaaaaaaaaaa#.
.#aaaaaaaaaaaa#.
.#aaaaaaaaaaaa#.
.#aaaaaaaaaaaa#.
.#aaaaaaaaaaaa#.
.#aaaaaaaaaaaa#.
.#aaaaaaaaaaaa#.
.##############.
................
""",
    )
    return art(g)


if __name__ == "__main__":
    print(f"  --logo: {token(window())};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview(window(), sys.argv[2] if len(sys.argv) > 2 else "silk-logo.png")
