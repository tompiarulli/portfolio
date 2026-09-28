"""Builds Time Traveler's menu mark and dock icons: props from the film.

Each icon is drawn in code on a character grid, one character per pixel, in
the three levels the dock icons use: '#' full, 'b' 0.7 and 'a' 0.4 opacity,
and '.' clear so the dock shows through.

    python scripts/traveler_icons.py            # print the tokens
    python scripts/traveler_icons.py preview    # also write a zoomed PNG
"""

import math
import sys
from urllib.parse import quote

LEVELS = {"a": ".4", "b": ".7", "#": None}


def blank(size=32):
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


def ellipse(grid, cx, cy, rx, ry, level):
    for y, row in enumerate(grid):
        for x in range(len(row)):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                row[x] = level


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


def inside(points, px, py):
    hit = False
    for i in range(len(points)):
        (x1, y1), (x2, y2) = points[i], points[i - 1]
        if (y1 > py) != (y2 > py):
            if px < x1 + (py - y1) * (x2 - x1) / (y2 - y1):
                hit = not hit
    return hit


def polygon(grid, points, level, edge=None):
    """Fills a polygon; with `edge`, its outermost pixels take that level."""
    size = len(grid)
    mask = [
        [inside(points, x + 0.5, y + 0.5) for x in range(size)] for y in range(size)
    ]
    for y in range(size):
        for x in range(size):
            if not mask[y][x]:
                continue
            border = any(
                not (0 <= x + dx < size and 0 <= y + dy < size)
                or not mask[y + dy][x + dx]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            grid[y][x] = edge if edge and border else level


def shade(shape, grid, level="b"):
    """Copies a shape drawn in '#' onto grid: its outermost pixels in '#'
    and the rest in `level`."""
    size = len(shape)
    for y in range(size):
        for x in range(size):
            if shape[y][x] != "#":
                continue
            border = any(
                not (0 <= x + dx < size and 0 <= y + dy < size)
                or shape[y + dy][x + dx] != "#"
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            grid[y][x] = "#" if border else level


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


def photo():
    """The family photo from the time traveller's wallet: three kids, the one on the
    right fading out, dithered."""
    g = blank()
    frame(g, 4, 2, 27, 29, "#")
    rect(g, 5, 24, 26, 28, "b")
    frame(g, 6, 4, 25, 23, "a")
    # Three siblings, shoulders cut off by the bottom of the print.
    for cx, top, fade in ((10.5, 9, False), (16, 11, False), (21.5, 8, True)):
        kid = blank()
        ellipse(kid, cx, top + 2.5, 2.2, 2.5, "#")
        ellipse(kid, cx, top + 13, 3.4, 5, "#")
        for y in range(5, 23):
            for x in range(7, 25):
                if kid[y][x] == "#" and (not fade or (x + y) % 2 == 0):
                    g[y][x] = "#"
    return art(g)


def time_car():
    """The time machine side on, facing right: a long, low wedge with a flat
    roof, the louvred rear deck and a steeply raked windscreen, in brushed
    steel over black wheels."""
    g = blank()
    shape = blank()
    polygon(shape, [(0, 14), (6, 12), (12, 9), (19, 9), (25, 12.5), (31, 14),
                    (31, 19), (0, 19)], "#")
    shade(shape, g)
    # Side window behind the raked screen, and the louvres on the deck.
    polygon(g, [(13, 10), (18.6, 10), (22, 12.4), (13, 12.4)], "a")
    for x in (5, 7, 9, 11):
        rect(g, x, 12 if x > 6 else 13, x, 13, "#")
    # The gull-wing door's seam and the ribbed trim along the sill.
    rect(g, 12, 10, 12, 17, "#")
    rect(g, 23, 12, 23, 17, "#")
    rect(g, 1, 16, 30, 16, "a")
    # Wheel arches cut clear, then the tyres and hubs.
    for cx in (6.5, 25):
        ellipse(g, cx, 20, 4.5, 4.5, ".")
        ellipse(g, cx, 20, 3.5, 3.5, "#")
        ellipse(g, cx, 20, 1.5, 1.5, "a")
    rect(g, 0, 14, 1, 15, "#")
    rect(g, 29, 14, 30, 14, "a")
    return art(g)


def guitar():
    """The time traveller's cherry red semi-hollow at the school dance
    dance: two bouts nipped at the waist, f-holes, a long neck up to the
    right."""
    g = blank()
    line(g, (15, 17), (27, 5), 1.3, "#")
    # Headstock, tuners either side.
    line(g, (26.5, 5.5), (29.5, 2.5), 2, "#")
    for x, y in ((26, 2), (30, 5), (27, 1), (31, 4)):
        g[y][x] = "b"
    body = blank()
    ellipse(body, 10, 22, 7.5, 7.5, "#")
    ellipse(body, 16, 16, 5, 5, "#")
    # The waist, pinched in from both sides.
    ellipse(body, 18.6, 22.4, 2.6, 2.6, ".")
    ellipse(body, 7.6, 15.4, 2.6, 2.6, ".")
    shade(body, g)
    line(g, (15, 17), (20, 12), 1.3, "#")
    # f-holes, pickups and the tailpiece.
    line(g, (5.5, 19), (5, 24), 0.5, ".")
    line(g, (15, 24), (13, 27), 0.5, ".")
    for c in (0, 1):
        line(g, (11 + 2 * c, 17 + 2 * c), (13 + 2 * c, 19 + 2 * c), 1, "a")
    line(g, (7, 23), (10, 26), 0.8, "#")
    return art(g)


def flyer():
    """The clock tower flyer: a headline, the tower with its hands
    stopped at 10:04, and small print."""
    g = blank()
    rect(g, 5, 1, 26, 30, "a")
    frame(g, 5, 1, 26, 30, "#")
    rect(g, 8, 3, 23, 4, "#")
    # The courthouse: tower, the clock face, and the building's shoulders.
    polygon(g, [(15.9, 6), (20, 10), (12, 10)], "#")
    rect(g, 12, 10, 19, 22, "#")
    ellipse(g, 16, 14, 3, 3, ".")
    g[12][16] = "#"
    g[13][16] = "#"
    g[13][17] = "#"
    rect(g, 8, 18, 23, 22, "#")
    for x in (9, 11, 20, 22):
        rect(g, x, 19, x, 21, "a")
    for y, (x0, x1) in ((24, (8, 23)), (26, (8, 20)), (28, (8, 22))):
        for x in range(x0, x1 + 1):
            if x % 4 != 3:
                g[y][x] = "#"
    return art(g)


def envelope():
    """The letter, sealed in 1885 and delivered seventy years later."""
    g = blank()
    rect(g, 2, 7, 29, 25, "b")
    frame(g, 2, 7, 29, 25, "#")
    line(g, (3, 8), (15.5, 17.5), 0.6, "#")
    line(g, (28.5, 8), (16, 17.5), 0.6, "#")
    # The wax seal at the point of the flap.
    ellipse(g, 16, 17, 2.5, 2.5, "#")
    ellipse(g, 16, 17, 1.2, 1.2, "a")
    # Postmark lines, faded with age.
    for y in (21, 23):
        rect(g, 5, y, 11, y, "a")
    return art(g)


# 3x5 seven-segment digits.
DIGITS = {
    "0": ["###", "#.#", "#.#", "#.#", "###"],
    "1": ["..#", "..#", "..#", "..#", "..#"],
    "5": ["###", "#..", "###", "..#", "###"],
    "8": ["###", "#.#", "###", "#.#", "###"],
    "9": ["###", "#.#", "###", "..#", "###"],
}


def circuits():
    """The time circuits: destination, present and last departed, each a
    dark display with its year lit, over a strip for its label."""
    g = blank()
    rect(g, 1, 2, 30, 29, "a")
    frame(g, 1, 2, 30, 29, "#")
    for i, year in enumerate(("1955", "1985", "1985")):
        top = 4 + i * 9
        rect(g, 3, top, 28, top + 6, "#")
        for k, ch in enumerate(year):
            for dy, row in enumerate(DIGITS[ch]):
                for dx, c in enumerate(row):
                    if c == "#":
                        g[top + 1 + dy][10 + k * 4 + dx] = "b"
        # The AM/PM lamps at the left of each display.
        g[top + 2][5] = "a"
        g[top + 4][5] = "b" if i == 1 else "a"
        rect(g, 6, top + 7, 25, top + 7, "b")
    return art(g)


ICONS = {
    "about": photo(),
    "work": time_car(),
    "media": guitar(),
    "blog": flyer(),
    "contact": envelope(),
    "settings": circuits(),
}


def rows(drawing, size):
    lines = drawing.strip("\n").split("\n")
    assert len(lines) == size, len(lines)
    for line_ in lines:
        assert len(line_) == size, (len(line_), line_)
    return lines


def token(drawing, size=32):
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
    """Draws the logo and icons in ink on the dock's steel, zoomed."""
    from PIL import Image

    scale, pad = 6, 12
    steel = (195, 199, 203)
    ink = {"#": (16, 18, 20)}
    ink["b"] = tuple(round(s + (i - s) * 0.7) for s, i in zip(steel, ink["#"]))
    ink["a"] = tuple(round(s + (i - s) * 0.4) for s, i in zip(steel, ink["#"]))
    items = [("logo", flux(), 16)] + [(n, a, 32) for n, a in ICONS.items()]
    size = 32 * scale
    image = Image.new("RGB", (len(items) * (size + pad) + pad, size + 2 * pad), steel)
    for i, (_, drawing, n) in enumerate(items):
        for y, row in enumerate(rows(drawing, n)):
            for x, char in enumerate(row):
                if char in ink:
                    left = pad + i * (size + pad) + x * scale
                    top = pad + y * scale
                    image.paste(ink[char], (left, top, left + scale, top + scale))
    image.save(path)


if __name__ == "__main__":
    print(f"  --logo: {token(flux(), 16)};")
    for name, drawing in ICONS.items():
        print(f"  --icon-{name}: {token(drawing)};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview(sys.argv[2] if len(sys.argv) > 2 else "traveler-icons.png")
