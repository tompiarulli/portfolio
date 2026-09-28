"""Builds White Rabbit's dock icons: film props as 32x32 pixel art.

Each icon is drawn below as text, one character per pixel, in the three
phosphor levels the dock icons use: '#' full, 'b' 0.7 and 'a' 0.4 opacity,
and '.' clear so the dock shows through. The pills are drawn in code.

    python scripts/rabbit_icons.py            # print the --icon-* tokens
    python scripts/rabbit_icons.py preview    # also write a zoomed PNG
"""

import math
import sys
from urllib.parse import quote

LEVELS = {"a": ".4", "b": ".7", "#": None}

ICONS = {
    # An office ID badge.
    "about": """
................................
................................
................................
................................
............########............
............##....##............
..###########################b..
..###########################b..
..###########......##########b..
..###########################b..
..###########################b..
..###.........###############b..
..###.........##...........##b..
..###...bbb...###############b..
..###..bbbbb..###############b..
..###..bbbbb..##........#####b..
..###...bbb...###############b..
..###.........###############b..
..###..bbbbb..##.........####b..
..###.bbbbbbb.###############b..
..###.bbbbbbb.###############b..
..###.bbbbbbb.##.#..#.##.#.##b..
..##############.#..#.##.#.##b..
..###########################b..
..bbbbbbbbbbbbbbbbbbbbbbbbbbbb..
................................
................................
................................
................................
................................
................................
................................
""",
    # A CRT terminal: "Wake up..."
    "work": """
................................
................................
................................
..###########################a..
..###########################b..
..###.....................###b..
..###.....................###b..
..###.##..................###b..
..###..##.................###b..
..###...##................###b..
..###..##.................###b..
..###.##..####............###b..
..###.....................###b..
..###.a.aa.a.aaa.a.aa.....###b..
..###.....................###b..
..###.....................###b..
..###########################b..
..######################a.a##b..
..###########################b..
...bbbbbbbbbbbbbbbbbbbbbbbbbb...
............########b...........
............########b...........
.......##################b......
.......bbbbbbbbbbbbbbbbbbb......
................................
...##########################b..
...#.#.#.#.#.#.#.#.#.#.#.#.#.b..
...##########################b..
...#.#.#.#.#.#.#.#.#.#.#.#.#.b..
...bbbbbbbbbbbbbbbbbbbbbbbbbbb..
................................
................................
""",
    # Simulacra and Simulation, hollowed out to hide the discs.
    "blog": """
................................
................................
................................
................................
................................
....##########....##########....
..#############..#############..
..#############..############b..
..#############..############b..
..##.......####..##.........#b..
..#############..##.........#b..
..##.........##..##.........#b..
..#############..##..#####..#b..
..##........###..##..##.##..#b..
..#############..##..#.#.#..#b..
..##.........##..##..##.##..#b..
..#############..##..#####..#b..
..##.......####..##.........#b..
..#############..##.........#b..
..##.........##..##.........#b..
..#############..############b..
..#############..############b..
..#############..############b..
..#############..############b..
.bbbbbbbbbbbbbb..bbbbbbbbbbbbbb.
.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.
................................
................................
................................
................................
................................
................................
""",
    # The landline: the way out.
    "contact": """
................................
................................
................................
................................
......###################b......
....#######################b....
...#########################b...
...######b...........######b....
...######b...........######b....
....####b.............####b.....
................................
...........##########b..........
..........############b.........
.........##############b........
........#######...######b.......
.......#####..#####..####b......
......######.#######.#####b.....
.....######.#########.#####b....
.....######.####.####.#####b....
....#######.#########.######b...
....########.#######.#######b...
...#########..#####..########b..
...###########.....##########b..
...##########################b..
...##########################b..
...bbbbbbbbbbbbbbbbbbbbbbbbbbb..
................................
................................
................................
................................
................................
................................
""",
}


def capsule(grid, a, b, r, level):
    """Fills a pill from a to b of radius r, dimming its lower right edge."""
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    length2 = dx * dx + dy * dy
    for y in range(32):
        for x in range(32):
            px, py = x + 0.5, y + 0.5
            t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / length2))
            cx, cy = ax + t * dx, ay + t * dy
            d = math.hypot(px - cx, py - cy)
            if d > r:
                continue
            # Dim the rim facing down and right, away from the light.
            edge = d > r - 1.2 and (px - cx) + (py - cy) > 0
            grid[y][x] = "b" if edge and level == "#" else ("a" if edge else level)


def pills():
    """The red pill and the blue pill, as bright and dim capsules."""
    grid = [["."] * 32 for _ in range(32)]
    capsule(grid, (6, 15), (15, 6), 4.2, "#")
    capsule(grid, (17, 26), (26, 17), 4.2, "b")
    # A glint on each.
    for x, y in ((8, 10), (9, 9), (19, 21), (20, 20)):
        grid[y][x] = "."
    return "\n".join("".join(row) for row in grid)


def minidisc():
    """The MiniDisc sold at the door: a disc in a square shell with one
    rounded corner."""
    grid = [["."] * 32 for _ in range(32)]
    for y in range(3, 29):
        for x in range(3, 29):
            grid[y][x] = "b"
    for x, y in ((28, 3), (27, 3), (28, 4)):
        grid[y][x] = "."
    # The disc, ringed by a dark gap, with its hub and spindle hole.
    cx, cy = 15.5, 15.5
    for y in range(32):
        for x in range(32):
            d = math.hypot(x + 0.5 - cx, y + 0.5 - cy)
            if d <= 2.2:
                grid[y][x] = "."
            elif d <= 3.6:
                grid[y][x] = "b"
            elif d <= 10.5:
                grid[y][x] = "#"
            elif d <= 11.5:
                grid[y][x] = "."
    return "\n".join("".join(row) for row in grid)

ICONS["media"] = minidisc()
ICONS["settings"] = pills()


def rows(art):
    lines = [line for line in art.strip("\n").split("\n")]
    assert len(lines) == 32, len(lines)
    for line in lines:
        assert len(line) == 32, (len(line), line)
    return lines


def token(art):
    lines = rows(art)
    paths = ""
    for char, opacity in LEVELS.items():
        d = ""
        for y, line in enumerate(lines):
            x = 0
            while x < 32:
                if line[x] != char:
                    x += 1
                    continue
                start = x
                while x < 32 and line[x] == char:
                    x += 1
                d += f"M{start} {y}h{x - start}v1H{start}z"
        if d:
            attr = f" fill-opacity='{opacity}'" if opacity else ""
            paths += f"<path{attr} d='{d}'/>"
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' "
        f"shape-rendering='crispEdges'>{paths}</svg>"
    )
    return 'url("data:image/svg+xml,' + quote(svg, safe=" '=:/.-") + '")'


def preview(path):
    from PIL import Image

    scale, pad = 6, 12
    ink = {"#": (160, 255, 180), "b": (110, 190, 125), "a": (60, 110, 70)}
    names = list(ICONS)
    size = 32 * scale
    image = Image.new("RGB", (len(names) * (size + pad) + pad, size + 2 * pad), (2, 8, 6))
    for i, name in enumerate(names):
        for y, line in enumerate(rows(ICONS[name])):
            for x, char in enumerate(line):
                if char in ink:
                    left = pad + i * (size + pad) + x * scale
                    top = pad + y * scale
                    image.paste(ink[char], (left, top, left + scale, top + scale))
    image.save(path)


if __name__ == "__main__":
    for name, art in ICONS.items():
        print(f"  --icon-{name}: {token(art)};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        preview(sys.argv[2] if len(sys.argv) > 2 else "rabbit-icons.png")
