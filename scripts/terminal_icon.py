"""Builds the Terminal dock icon: a little CRT with a prompt on it.

Drawn in code on a 32x32 character grid to sit with the KDE 1.1 icons the
dock shares: '#' full, 'b' and 'a' the two lighter levels, '.' clear so the
dock shows through. White Rabbit's dark dock paints the shape light; the
light docks use an inverted copy, the screen dark and the prompt cut out.

    python scripts/terminal_icon.py            # print both --icon-terminal tokens
    python scripts/terminal_icon.py preview    # also write zoomed PNGs
"""

import sys
from urllib.parse import quote

SIZE = 32
# Opacity of 'a' and 'b' on the dark dock and on the light docks, as in the
# shared KDE set.
DARK = {"a": ".4", "b": ".7", "#": None}
LIGHT = {"a": ".3", "b": ".6", "#": None}


def rect(g, x0, y0, x1, y1, edge, fill):
    """A box from x0, y0 to x1, y1 inclusive: `edge` round it, `fill` in."""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            on_edge = x in (x0, x1) or y in (y0, y1)
            g[y][x] = edge if on_edge else fill


def terminal(light):
    g = [["."] * SIZE for _ in range(SIZE)]
    # Bezel, screen, neck and foot.
    rect(g, 3, 3, 28, 22, "#", "a")
    rect(g, 6, 6, 25, 19, "#", "#" if light else ".")
    rect(g, 13, 23, 18, 24, "#", "a")
    rect(g, 8, 25, 23, 27, "#", "a")
    # The prompt, ">_", lit on the dark dock and cut out of the dark screen
    # on the light ones.
    lit = "." if light else "#"
    for x, y in [(8, 9), (9, 10), (10, 11), (9, 12), (8, 13)]:
        g[y][x] = lit
    for x in range(12, 16):
        g[13][x] = lit
    # A dimmer line of output under it.
    for x in range(8, 20, 2):
        g[16][x] = "." if light else "b"
    return ["".join(row) for row in g]


def token(lines, levels):
    paths = ""
    for char, opacity in levels.items():
        d = ""
        for y, row in enumerate(lines):
            x = 0
            while x < SIZE:
                if row[x] != char:
                    x += 1
                    continue
                start = x
                while x < SIZE and row[x] == char:
                    x += 1
                d += f"M{start} {y}h{x - start}v1H{start}z"
        if d:
            attr = f" fill-opacity='{opacity}'" if opacity else ""
            paths += f"<path{attr} d='{d}'/>"
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' "
        f"viewBox='0 0 {SIZE} {SIZE}' shape-rendering='crispEdges'>{paths}</svg>"
    )
    return 'url("data:image/svg+xml,' + quote(svg, safe=" '=:/.-") + '")'


def preview(path, lines, levels, ink, dock):
    """Draws the icon in `ink` over `dock`, zoomed."""
    from PIL import Image

    scale = 8
    image = Image.new("RGB", (SIZE * scale, SIZE * scale), dock)
    for y, row in enumerate(lines):
        for x, char in enumerate(row):
            if char not in levels:
                continue
            a = float(levels[char] or 1)
            colour = tuple(round(d + (i - d) * a) for i, d in zip(ink, dock))
            left, top = x * scale, y * scale
            image.paste(colour, (left, top, left + scale, top + scale))
    image.save(path)


if __name__ == "__main__":
    dark, light = terminal(False), terminal(True)
    print(f"  --icon-terminal: {token(dark, DARK)};")
    print(f"  --icon-terminal: {token(light, LIGHT)};")
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        out = sys.argv[2] if len(sys.argv) > 2 else "."
        preview(f"{out}/terminal-dark.png", dark, DARK, (65, 224, 122), (3, 18, 10))
        preview(f"{out}/terminal-light.png", light, LIGHT, (15, 18, 23), (191, 198, 206))
