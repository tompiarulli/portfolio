"""Builds TomSpace's menu mark and dock icons: early-2000s social network pixel art.

Each icon is drawn in code on a character grid, one character per pixel, in
the three levels the dock icons use: '#' full, 'b' 0.7 and 'a' 0.4 opacity,
and '.' clear so the dock shows through.

    python scripts/tomspace_icons.py            # print the tokens
    python scripts/tomspace_icons.py preview    # also write a zoomed PNG
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


def star(grid, cx, cy, outer, inner, level):
    """A five-pointed star, point up."""
    points = []
    for i in range(10):
        r = outer if i % 2 == 0 else inner
        angle = math.pi * i / 5 - math.pi / 2
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    for y, row in enumerate(grid):
        for x in range(len(row)):
            px, py = x + 0.5, y + 0.5
            inside = False
            for i in range(10):
                (x1, y1), (x2, y2) = points[i], points[i - 1]
                if (y1 > py) != (y2 > py):
                    if px < x1 + (py - y1) * (x2 - x1) / (y2 - y1):
                        inside = not inside
            if inside:
                row[x] = level


def art(grid):
    return "\n".join("".join(row) for row in grid)


def stamp(grid, x0, y0, drawing):
    """Copies a drawing onto the grid with its top left at x0, y0."""
    for dy, row in enumerate(drawing.strip("\n").split("\n")):
        for dx, c in enumerate(row):
            grid[y0 + dy][x0 + dx] = c


def people():
    """The menu mark: three friends, the one in front taller, like the
    people in an early social network's logo, on a 16x16 grid."""
    g = blank(16)
    stamp(
        g,
        0,
        0,
        """
................
......####......
.....######.....
.bb..######..bb.
bbbb.######.bbbb
bbbb..####..bbbb
.bb..........bb.
.....######.....
.bb.########.bb.
bbb.########.bbb
bbb.########.bbb
bbb.########.bbb
bbb.########.bbb
bbb.########.bbb
bbb.########.bbb
................
""",
    )
    return art(g)


def portrait():
    """The founder's photo as a print: a grin and a white T-shirt in front
    of a whiteboard. Another Tom, like the one on White Rabbit's
    badge."""
    g = blank()
    # The print's border, shaded on the right and bottom.
    frame(g, 3, 2, 28, 29, "#")
    rect(g, 29, 3, 29, 30, "b")
    rect(g, 4, 30, 29, 30, "b")
    # The photo: dim whiteboard with a marker scrawl, his face in the
    # middle level, hair and features in full.
    stamp(
        g,
        5,
        4,
        """
aaaaaaaaaaaaaaaaaaaaaa
abbbbbaaaaaaaaaaabbbba
aaaaaaaa#######aaaaaaa
aaaaaa###########aaaaa
aaaaa#############aaaa
aaaaa##bbbbbbbbb##aaaa
aaaaa#bbbbbbbbbbb#aaaa
aaaaa#bb##bbb##bb#aaaa
aaaaa#bbbbbbbbbbb#aaaa
aaaaa#bbbbbb#bbbb#aaaa
aaaaa#bb#bbbbbb#b#aaaa
aaaaaa#bb######b#aaaaa
aaaaaa#bbbbbbbbb#aaaaa
aaaaaaa##bbbbbb#aaaaaa
aaaaaaaaa#bbbb#aaaaaaa
aaaaa#####bbbb#####aaa
aaa##.....#bb#.....##a
aa#.......#..#.......#
a#....................
""",
    )
    # A caption line in the bottom margin.
    rect(g, 7, 26, 16, 26, "b")
    return art(g)


def favorites():
    """Add to Favorites: a folder with a star cut out of it."""
    g = blank()
    # Tab, then the body, dimmed along its lower right.
    rect(g, 3, 6, 12, 8, "#")
    rect(g, 3, 9, 28, 26, "#")
    rect(g, 4, 27, 29, 27, "b")
    rect(g, 29, 10, 29, 27, "b")
    # The front flap's top edge.
    rect(g, 4, 11, 27, 11, ".")
    star(g, 16, 19.5, 7.5, 3.1, ".")
    star(g, 16, 19.5, 5, 2, "a")
    return art(g)


def music():
    """The profile song: a pair of beamed eighth notes."""
    g = blank()
    # Noteheads, tilted ovals.
    ellipse(g, 9, 24.5, 4.2, 3.2, "#")
    ellipse(g, 23, 21.5, 4.2, 3.2, "#")
    ellipse(g, 8.5, 24, 1.4, 1, "b")
    ellipse(g, 22.5, 21, 1.4, 1, "b")
    # Stems up the right of each head.
    rect(g, 12, 9, 13, 24, "#")
    rect(g, 26, 6, 27, 21, "#")
    # A slanted double beam across the tops.
    line(g, (12.5, 9.5), (26.5, 6.5), 1.3, "#")
    line(g, (12.5, 13.5), (26.5, 10.5), 1.1, "b")
    return art(g)


def notepad():
    """Tom's Latest Blog Entry: a ruled pad and a pencil."""
    g = blank()
    frame(g, 4, 5, 22, 28, "#")
    rect(g, 23, 6, 23, 29, "b")
    rect(g, 5, 29, 23, 29, "b")
    # Spiral rings along the top.
    for x in (7, 11, 15, 19):
        rect(g, x, 3, x + 1, 7, "#")
        rect(g, x, 5, x + 1, 5, ".")
    # Ruled lines, the first a dim red margin line down the left.
    for y in range(10, 27, 3):
        rect(g, 6, y, 20, y, "a")
    rect(g, 8, 9, 8, 26, "b")
    # The pencil, leaning across the page's corner.
    line(g, (28.5, 5.5), (15.5, 20.5), 2.3, "#")
    line(g, (28.5, 5.5), (15.5, 20.5), 1.1, "b")
    line(g, (16.2, 19.7), (13.5, 23), 1.3, "#")
    line(g, (26.7, 7.6), (25, 9.5), 2.4, ".")
    line(g, (26.7, 7.6), (25, 9.5), 1.6, "a")
    return art(g)


def envelope():
    """Send Message: an envelope sealed with a heart."""
    g = blank()
    rect(g, 2, 7, 28, 24, "a")
    frame(g, 2, 7, 28, 24, "#")
    rect(g, 3, 25, 29, 25, "b")
    rect(g, 29, 8, 29, 25, "b")
    # The flap's V, and the folds from the lower corners.
    line(g, (2.5, 7.5), (15.5, 17.5), 0.75, "#")
    line(g, (28.5, 7.5), (15.5, 17.5), 0.75, "#")
    line(g, (2.5, 24.5), (12, 16.5), 0.6, "b")
    line(g, (28.5, 24.5), (19, 16.5), 0.6, "b")
    # A heart seal at the flap's point, ringed clear.
    heart = [
        ".##.##.",
        "#######",
        "#######",
        ".#####.",
        "..###..",
        "...#...",
    ]
    rect(g, 11, 14, 20, 21, ".")
    for dy, row in enumerate(heart):
        for dx, c in enumerate(row):
            if c == "#":
                g[15 + dy][12 + dx] = "#"
    return art(g)


def palette():
    """Edit Profile: a painter's palette and brush, for pimping the page."""
    g = blank()
    ellipse(g, 15, 17, 13.5, 10.5, "#")
    # The thumb hole, and a bite out of the edge.
    ellipse(g, 20, 22.5, 2.6, 2.2, ".")
    ellipse(g, 29, 20, 4, 3.5, ".")
    # Paint dabs in three strengths, each ringed clear.
    for (cx, cy), level in (
        ((8, 13), "a"),
        ((14, 10), "b"),
        ((21, 11), "a"),
        ((7.5, 20), "b"),
    ):
        ellipse(g, cx, cy, 2.6, 2.4, ".")
        ellipse(g, cx, cy, 1.7, 1.5, level)
    # The brush, handle up and to the right, bristles in the paint.
    line(g, (29.5, 2.5), (17, 17), 2.2, ".")
    line(g, (29.5, 2.5), (21, 12.4), 1.1, "#")
    line(g, (21.5, 11.8), (17.5, 16.5), 1.6, "b")
    return art(g)


ICONS = {
    "about": portrait(),
    "work": favorites(),
    "media": music(),
    "blog": notepad(),
    "contact": envelope(),
    "settings": palette(),
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
    """Draws the logo and icons in ink on the dock's white, zoomed."""
    from PIL import Image

    scale, pad = 6, 12
    ink = {"#": (0, 0, 0), "b": (77, 77, 77), "a": (153, 153, 153)}
    items = [("logo", people(), 16)] + [(n, a, 32) for n, a in ICONS.items()]
    size = 32 * scale
    image = Image.new(
        "RGB", (len(items) * (size + pad) + pad, size + 2 * pad), (255, 255, 255)
    )
    for i, (_, drawing, n) in enumerate(items):
        for y, row in enumerate(rows(drawing, n)):
            for x, char in enumerate(row):
                if char in ink:
                    left = pad + i * (size + pad) + x * scale
                    top = pad + y * scale
                    image.paste(ink[char], (left, top, left + scale, top + scale))
    image.save(path)


if __name__ == "__main__":
    print(f"  --logo: {token(people(), 16)};")
    for name, drawing in ICONS.items():
        print(f"  --icon-{name}: {token(drawing)};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview(sys.argv[2] if len(sys.argv) > 2 else "tomspace-icons.png")
