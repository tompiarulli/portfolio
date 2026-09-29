"""Builds Time Traveler's menu mark: the flux capacitor.

The mark is drawn in code on a 16x16 character grid, one character per pixel,
in up to three levels: '#' full, 'b' 0.7 and 'a' 0.4 opacity, and '.' clear
so the menu bar shows through.

    python scripts/traveler_logo.py            # print the --logo token
    python scripts/traveler_logo.py preview    # also write a zoomed PNG
"""

import math
import sys
from urllib.parse import quote

LEVELS = {"a": ".4", "b": ".7", "#": None}


def blank(size=16):
    return [["."] * size for _ in range(size)]


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


def art(grid):
    return "\n".join("".join(row) for row in grid)


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


def rows(drawing, size):
    lines = drawing.strip("\n").split("\n")
    assert len(lines) == size, len(lines)
    for line_ in lines:
        assert len(line_) == size, (len(line_), line_)
    return lines


def token(drawing, size=16):
    lines = rows(drawing, size)
    paths = ""
    for char, opacity in LEVELS.items():
        d = ""
        for y, row in enumerate(lines):
            x = 0
            while x < size:
                if row[x] != char:
                    x += 1
                    continue
                start = x
                while x < size and row[x] == char:
                    x += 1
                d += f"M{start} {y}h{x - start}v1H{start}z"
        if d:
            attr = f" fill-opacity='{opacity}'" if opacity else ""
            paths += f"<path{attr} d='{d}'/>"
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' "
        f"viewBox='0 0 {size} {size}' shape-rendering='crispEdges'>{paths}</svg>"
    )
    return 'url("data:image/svg+xml,' + quote(svg, safe=" '=:/.-") + '")'


def preview(path):
    """Draws the logo in ink on steel, zoomed."""
    from PIL import Image

    scale, pad = 12, 12
    steel = (195, 199, 203)
    ink = {"#": (16, 18, 20)}
    ink["b"] = tuple(round(s + (i - s) * 0.7) for s, i in zip(steel, ink["#"]))
    ink["a"] = tuple(round(s + (i - s) * 0.4) for s, i in zip(steel, ink["#"]))
    size = 16 * scale
    image = Image.new("RGB", (size + 2 * pad, size + 2 * pad), steel)
    for y, row in enumerate(rows(flux(), 16)):
        for x, char in enumerate(row):
            if char in ink:
                left = pad + x * scale
                top = pad + y * scale
                image.paste(ink[char], (left, top, left + scale, top + scale))
    image.save(path)


if __name__ == "__main__":
    print(f"  --logo: {token(flux())};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview(sys.argv[2] if len(sys.argv) > 2 else "traveler-logo.png")
