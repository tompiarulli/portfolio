"""Builds OUTATIME's menu mark: a flux capacitor.

Drawn on a 16x16 character grid with the helpers in logo.py.

    python scripts/traveler_logo.py            # print the --logo token
    python scripts/traveler_logo.py preview    # also write a zoomed PNG
"""

import math
import sys

from logo import art, blank, preview, token


def rect(grid, x0, y0, x1, y1, level):
    """Fills x0..x1, y0..y1 inclusive."""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            grid[y][x] = level


def frame(grid, x0, y0, x1, y1, level):
    rect(grid, x0, y0, x1, y0, level)
    rect(grid, x0, y1, x1, y1, level)
    rect(grid, x0, y0, x0, y1, level)
    rect(grid, x1, y0, x1, y1, level)


def line(grid, a, b, r, level):
    """A thick segment from a to b of radius r."""
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    length2 = dx * dx + dy * dy
    for y, row in enumerate(grid):
        for x in range(len(row)):
            px, py = x + 0.5, y + 0.5
            t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / length2))
            if math.hypot(px - ax - t * dx, py - ay - t * dy) <= r:
                row[x] = level


def flux():
    """The menu mark: the flux capacitor, three tubes meeting in a Y inside
    its case, lit along their length."""
    g = blank(16)
    frame(g, 0, 0, 15, 15, "#")
    for end in ((3, 3), (13, 3), (8, 13.5)):
        line(g, end, (8, 8.2), 1.2, "b")
    # Lights running down each tube, and the bright junction.
    for x, y in ((4, 4), (6, 6), (11, 4), (9, 6), (7, 10), (7, 12)):
        g[y][x] = "#"
    rect(g, 7, 7, 8, 8, "#")
    return art(g)


if __name__ == "__main__":
    print(f"  --logo: {token(flux())};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        path = sys.argv[2] if len(sys.argv) > 2 else "traveler-logo.png"
        # Ink on steel.
        preview(flux(), path, back=(195, 199, 203), ink=(16, 18, 20))
