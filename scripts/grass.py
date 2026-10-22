"""Builds the Shut Down photo from the source.

Rotates the photo the way the camera meant it, saves it at each width in
WIDTHS and in each format in FORMATS so the browser can pick one for its
screen and what it decodes (<picture> and srcset), and drops any camera
metadata (the source has GPS). The source lives in the git-ignored
assets/ folder. Needs Pillow 11.3 or later, whose wheels can write AVIF.

    python scripts/grass.py
"""

from PIL import Image, ImageOps

SOURCE = "assets/bruno-aguirre-YRfaG3JVwkU-unsplash.jpg"
OUTPUT = "public/images/grass-{}.{}"
# Widths the photo ships at, up to one that covers a wide or high-DPI screen
# without upscaling. Only one loads, and only at shut down.
WIDTHS = (1280, 1920, 2560, 3840)
# Smallest first, as <picture> lists them; JPEG is the fallback. Each
# quality is on its encoder's own scale, set by eye to look the same.
FORMATS = {
    "avif": {"quality": 50, "speed": 4},
    "webp": {"quality": 72, "method": 6},
    "jpg": {"quality": 78, "optimize": True, "progressive": True},
}


def main() -> None:
    source = ImageOps.exif_transpose(Image.open(SOURCE)).convert("RGB")
    for width in WIDTHS:
        photo = source.copy()
        photo.thumbnail((width, width), Image.Resampling.LANCZOS)
        # Saving a fresh image drops the EXIF block and its GPS tags.
        for ext, options in FORMATS.items():
            out = OUTPUT.format(width, ext)
            photo.save(out, **options)
            print(f"{out}: {photo.size[0]}x{photo.size[1]}")


if __name__ == "__main__":
    main()
