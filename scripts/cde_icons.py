"""Builds White Rabbit's dock icons from CDE's 32x32 pixmaps.

CDE's icons are greyscale XPMs. Each pixel's brightness becomes its opacity in
three steps (0.4, 0.7, full), and the darkest pixels drop out, so the dock
paints the icons as lit phosphor in the theme's text colour. The outer edge
is always lit, so the black half of CDE's bevelled outlines stays. Writes
public/icons/cde/<id>.png.

    git clone --depth 1 https://git.code.sf.net/p/cdesktopenv/code cde
    python scripts/cde_icons.py cde
"""

import re
import sys
from pathlib import Path

from PIL import Image

# Dock icon id to CDE pixmap, under cde/programs/icons.
ICONS = {
    "about": "Dtinfo.m.pm",
    "contact": "DtMnew.m.pm",
    "terminal": "Fpterm.m.pm",
    "settings": "Fpstyle.m.pm",
}
NAMED = {"none": None, "black": (0, 0, 0), "white": (255, 255, 255)}
OUT = Path(__file__).resolve().parent.parent / "public" / "icons" / "cde"


def colour(spec):
    """An XPM colour entry's RGB, from its colour ('c') value or, for the
    symbolic shadow and background colours, its mono ('m') one."""
    parts = spec.split()
    keys = dict(zip(parts[::2], parts[1::2]))
    value = keys.get("c", keys.get("m", "none")).lower()
    if value.startswith("#"):
        digits = value[1:]
        step = len(digits) // 3
        return tuple(int(digits[i * step : i * step + 2], 16) for i in range(3))
    return NAMED.get(value, (128, 128, 128))


def load(path):
    strings = re.findall(r'"([^"]*)"', path.read_text(encoding="latin-1"))
    width, height, count, cpp = map(int, strings[0].split()[:4])
    colours = {line[:cpp]: colour(line[cpp:]) for line in strings[1 : 1 + count]}
    rows = strings[1 + count : 1 + count + height]
    return width, height, [
        [colours[row[x * cpp : x * cpp + cpp]] for x in range(width)] for row in rows
    ]


def outer(pixels, x, y):
    """Whether the pixel at x, y touches the clear background or the edge."""
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if not (0 <= ny < len(pixels) and 0 <= nx < len(pixels[ny])):
            return True
        if pixels[ny][nx] is None:
            return True
    return False


def mask(path):
    width, height, pixels = load(path)
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    for y, row in enumerate(pixels):
        for x, rgb in enumerate(row):
            if rgb is None:
                continue
            light = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 255000
            level = 0 if light < 0.2 else 0.4 if light < 0.5 else 0.7 if light < 0.8 else 1
            # CDE bevels its outlines, light on the top and left and black
            # on the bottom and right; lighting the whole outer edge keeps
            # each shape closed.
            if outer(pixels, x, y):
                level = 1
            if level:
                image.putpixel((x, y), (255, 255, 255, round(level * 255)))
    return image


if __name__ == "__main__":
    icons = Path(sys.argv[1]) / "cde" / "programs" / "icons"
    OUT.mkdir(parents=True, exist_ok=True)
    for name, source in ICONS.items():
        mask(icons / source).save(OUT / f"{name}.png", optimize=True)
        print(f"{name}: {source}")
