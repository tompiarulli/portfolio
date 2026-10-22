"""Shared helpers for the menu marks drawn in code.

A mark is drawn on a 16x16 character grid, one character per pixel, in up
to three levels: '#' full, 'b' 0.7 and 'a' 0.4 opacity, and '.' clear so
the menu bar shows through.
"""

from urllib.parse import quote

LEVELS = {"a": ".4", "b": ".7", "#": None}


def blank(size=16):
    return [["."] * size for _ in range(size)]


def art(grid):
    return "\n".join("".join(row) for row in grid)


def stamp(grid, x0, y0, drawing):
    """Copies a drawing onto the grid with its top left at x0, y0."""
    for dy, row in enumerate(drawing.strip("\n").split("\n")):
        for dx, c in enumerate(row):
            grid[y0 + dy][x0 + dx] = c


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


def preview(drawing, path, back=(255, 255, 255), ink=(0, 0, 0)):
    """Draws the mark zoomed, in ink on a background like its menu bar's,
    each level mixed between the two."""
    from PIL import Image

    scale, pad = 12, 12
    shade = {
        c: tuple(round(b + (i - b) * float(o or 1)) for b, i in zip(back, ink))
        for c, o in LEVELS.items()
    }
    size = 16 * scale
    image = Image.new("RGB", (size + 2 * pad, size + 2 * pad), back)
    for y, row in enumerate(rows(drawing, 16)):
        for x, char in enumerate(row):
            if char in shade:
                left, top = pad + x * scale, pad + y * scale
                image.paste(shade[char], (left, top, left + scale, top + scale))
    image.save(path)
