"""Builds Outpost 31's menu mark and dock icons: props from the film.

Each icon is drawn in code on a character grid, one character per pixel, in
the three levels the dock icons use: '#' full, 'b' 0.7 and 'a' 0.4 opacity,
and '.' clear so the dock shows through.

    python scripts/outpost_icons.py            # print the tokens
    python scripts/outpost_icons.py preview    # also write a zoomed PNG
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


def art(grid):
    return "\n".join("".join(row) for row in grid)


def stamp(grid, x0, y0, drawing):
    """Copies a drawing onto the grid with its top left at x0, y0."""
    for dy, row in enumerate(drawing.strip("\n").split("\n")):
        for dx, c in enumerate(row):
            grid[y0 + dy][x0 + dx] = c


def husky():
    """The menu mark: the husky chased into camp, on a 16x16
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


def pilot():
    """The pilot: the wide-brimmed hat, aviator shades and beard, in a
    parka zipped to the chin."""
    g = blank()
    stamp(
        g,
        0,
        0,
        """
................................
................................
.............######.............
...........##########...........
..........############..........
..........############..........
.........##############.........
.........##############.........
.........bbbbbbbbbbbbbb.........
..##.....##############.....##..
..############################..
...##########################...
..........aaaaaaaaaaaa..........
..........############..........
..........#####aa#####..........
..........a###aaaa###a..........
..........aaaaa##aaaaa..........
..........aaaaaaaaaaaa..........
..........##aaaaaaaa##..........
..........###aaaaaa###..........
..........############..........
..........#####aa#####..........
..........############..........
...........##########...........
............########............
.............######.............
.....bbbbbbb.aaaaaa.bbbbbbb.....
...bbbbbbbbbb.aaaa.bbbbbbbbbb...
..bbbbbbbbbbbb.aa.bbbbbbbbbbbb..
.bbbbbbbbbbbbbb##bbbbbbbbbbbbbb.
.bbbbbbbbbbbbbb##bbbbbbbbbbbbbb.
.bbbbbbbbbbbbbb##bbbbbbbbbbbbbb.
""",
    )
    return art(g)


def computer():
    """The biologist's computer, running the simulation: a healthy cell beside one
    the thing has taken, over a line of readout."""
    g = blank()
    # The case, dimmed along its lower right, and the screen.
    rect(g, 3, 3, 27, 22, "#")
    rect(g, 28, 4, 28, 23, "b")
    rect(g, 4, 23, 28, 23, "b")
    rect(g, 5, 5, 25, 18, ".")
    rect(g, 6, 6, 24, 17, "#")
    # A round cell with its nucleus, and a ragged one being absorbed.
    ellipse(g, 11, 11, 3.6, 3.6, "a")
    ellipse(g, 11, 11, 1.3, 1.3, "#")
    ellipse(g, 19.5, 11, 3.8, 3.4, "b")
    for x, y in ((18, 9), (20, 10), (19, 12), (21, 12), (18, 11), (20, 8)):
        g[y][x] = "#"
    for x, y in ((16, 9), (23, 13), (17, 14), (22, 8)):
        g[y][x] = "b"
    # The readout.
    for x in range(8, 23, 2):
        g[15][x] = "a"
    # The power light, and the stand.
    g[20][23] = "."
    rect(g, 13, 24, 18, 25, "#")
    rect(g, 9, 26, 22, 27, "#")
    rect(g, 10, 28, 23, 28, "b")
    return art(g)


def videotape():
    """A VHS cassette, like the other camp's tapes and the taped game
    shows the crew watches: two reels behind the window, a label above."""
    g = blank()
    rect(g, 2, 7, 28, 25, "#")
    rect(g, 29, 8, 29, 26, "b")
    rect(g, 3, 26, 29, 26, "b")
    # The label, with a line of handwriting.
    rect(g, 5, 9, 25, 13, "a")
    rect(g, 7, 11, 18, 11, "#")
    # The window and the tape wound on each reel.
    rect(g, 7, 16, 23, 22, ".")
    ellipse(g, 11, 19, 2.8, 2.8, "b")
    ellipse(g, 20, 19, 2, 2, "b")
    ellipse(g, 11, 19, 1, 1, ".")
    ellipse(g, 20, 19, 1, 1, ".")
    rect(g, 13, 21, 18, 21, "a")
    return art(g)


def recorder():
    """The pilot's pocket tape recorder, for the log he leaves "in case the
    weather breaks": a speaker grille over a microcassette window and a
    row of keys."""
    g = blank()
    rect(g, 8, 2, 23, 29, "#")
    rect(g, 24, 3, 24, 30, "b")
    rect(g, 9, 30, 24, 30, "b")
    # The grille.
    for y in range(5, 11, 2):
        rect(g, 11, y, 20, y, "a")
    # The cassette window, reels showing.
    rect(g, 10, 13, 21, 20, ".")
    rect(g, 11, 14, 20, 19, "a")
    for cx in (13.5, 18.5):
        ellipse(g, cx, 16.5, 2, 2, "#")
        ellipse(g, cx, 16.5, 0.8, 0.8, "a")
    # Keys, record in the middle level.
    for x in (10, 14, 18):
        rect(g, x, 23, x + 2, 25, "b" if x == 14 else "a")
    # The red light over record.
    g[27][15] = "."
    g[27][16] = "."
    return art(g)


def radio():
    """The radio room's desk microphone, for the mayday nobody hears: a
    round head on a stem, a talk switch on the base."""
    g = blank()
    ellipse(g, 16, 10, 7, 7.5, "#")
    # Grille slots across the head, and its rim.
    for y in (6, 8, 10, 12, 14):
        half = int(math.sqrt(max(0, 5.2**2 - (y + 0.5 - 10) ** 2)))
        rect(g, 16 - half, y, 15 + half, y, "b")
    # The stem and the yoke it swivels in.
    rect(g, 15, 18, 16, 24, "#")
    rect(g, 8, 10, 8, 13, "#")
    rect(g, 23, 10, 23, 13, "#")
    rect(g, 8, 17, 23, 17, "b")
    rect(g, 8, 14, 8, 17, "b")
    rect(g, 23, 14, 23, 17, "b")
    # The base, and its switch.
    rect(g, 7, 25, 24, 29, "#")
    rect(g, 8, 30, 25, 30, "b")
    rect(g, 25, 26, 25, 30, "b")
    rect(g, 18, 26, 21, 27, "a")
    return art(g)


def flamethrower():
    """The flamethrower, side on and nozzle to the right, its hose trailing
    back to the tank and fire rolling off the tip."""
    g = blank()
    # The valve body, the barrel, both grips and the nozzle.
    rect(g, 2, 13, 8, 18, "#")
    rect(g, 3, 14, 7, 14, "b")
    rect(g, 2, 15, 15, 16, "#")
    rect(g, 4, 19, 6, 23, "#")
    g[19][8] = "#"
    rect(g, 11, 17, 12, 21, "#")
    rect(g, 13, 17, 14, 17, "b")
    rect(g, 15, 14, 17, 17, "#")
    # The hose, back to the tank.
    line(g, (2.5, 18.5), (0.5, 27), 0.8, "b")
    # The flame, white hot at the nozzle.
    ellipse(g, 24, 15.5, 7, 6, "a")
    ellipse(g, 27, 8.5, 2.5, 1.8, "a")
    ellipse(g, 28, 22.5, 2.2, 1.6, "a")
    ellipse(g, 21.5, 15.5, 4.2, 3.4, "b")
    ellipse(g, 19.5, 15.5, 2, 1.7, "#")
    for x, y in ((30, 5), (23, 6), (31, 11), (24, 25), (31, 19)):
        g[y][x] = "a"
    return art(g)


ICONS = {
    "about": pilot(),
    "work": computer(),
    "media": videotape(),
    "blog": recorder(),
    "contact": radio(),
    "settings": flamethrower(),
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
    """Draws the logo and icons in ink on the dock's steel grey, zoomed."""
    from PIL import Image

    scale, pad = 6, 12
    back = (197, 204, 210)
    ink = (10, 14, 18)
    shade = {
        c: tuple(round(b + (i - b) * float(o or 1)) for b, i in zip(back, ink))
        for c, o in LEVELS.items()
    }
    items = [("logo", husky(), 16)] + [(n, a, 32) for n, a in ICONS.items()]
    size = 32 * scale
    image = Image.new("RGB", (len(items) * (size + pad) + pad, size + 2 * pad), back)
    for i, (_, drawing, n) in enumerate(items):
        for y, row in enumerate(rows(drawing, n)):
            for x, char in enumerate(row):
                if char in shade:
                    left = pad + i * (size + pad) + x * scale
                    top = pad + y * scale
                    image.paste(shade[char], (left, top, left + scale, top + scale))
    image.save(path)


if __name__ == "__main__":
    print(f"  --logo: {token(husky(), 16)};")
    for name, drawing in ICONS.items():
        print(f"  --icon-{name}: {token(drawing)};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview(sys.argv[2] if len(sys.argv) > 2 else "outpost-icons.png")
