# Icons

The dock icons and menu marks are inlined as mask tokens in `src/styles.css`, so nothing in this folder is served. This file records where they come from.

## Dock icons

Every theme shares one set: 32x32 icons from KDE 1.1 (1999), by the KDE artists, GNU General Public License v2 (`COPYING` in [KDE/kde1-kdebase](https://github.com/KDE/kde1-kdebase)). Quantized to three opacity levels and inlined as SVG masks, painted in the theme's text colour. Dark docks (White Rabbit) use them as drawn; light docks use an inverted copy, so outlines and holes are painted in ink.

- About: `pics/info.xpm`
- Contact: `kappfinder/pics/email.xpm`
- Terminal: not from KDE; a CRT with a prompt in the same style, drawn in `scripts/terminal_icon.py`
- Settings: `kcontrol/kcontrol/pics/kcontrol.xpm`

## Menu marks

Each theme has its own 16x16 mark in the top-left menu, original pixel art:

- White Rabbit: a white rabbit's head in slim black sunglasses.
- I Believe: a grey alien's head.
- TomSpace: three friends in a row, drawn in `scripts/tomspace_logo.py`.
- Time Traveler: the flux capacitor, drawn in `scripts/traveler_logo.py`.
- Outpost 31: the husky, drawn in `scripts/outpost_logo.py`.
