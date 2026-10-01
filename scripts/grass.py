"""Builds the Shut Down photo from the source.

Rotates the photo the way the camera meant it, saves it at each width in
WIDTHS so the browser can pick one for its screen (srcset), and drops any
camera metadata (the source has GPS). The source lives in the git-ignored
assets/ folder.

    python scripts/grass.py
"""

from PIL import Image, ImageOps

SOURCE = "assets/bruno-aguirre-YRfaG3JVwkU-unsplash.jpg"
OUTPUT = "public/images/grass-{}.jpg"
# Widths the photo ships at, up to one that covers a wide or high-DPI screen
# without upscaling. Only one loads, and only at shut down.
WIDTHS = (1280, 1920, 2560, 3840)
QUALITY = 78


def main() -> None:
    source = ImageOps.exif_transpose(Image.open(SOURCE)).convert("RGB")
    for width in WIDTHS:
        photo = source.copy()
        photo.thumbnail((width, width), Image.Resampling.LANCZOS)
        # Saving a fresh image drops the EXIF block and its GPS tags.
        out = OUTPUT.format(width)
        photo.save(out, quality=QUALITY, optimize=True, progressive=True)
        print(f"{out}: {photo.size[0]}x{photo.size[1]}")


if __name__ == "__main__":
    main()
