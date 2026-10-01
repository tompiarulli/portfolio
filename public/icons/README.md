# Icons

The dock icons and menu marks are inlined as mask tokens in `src/styles.css`, so nothing in this folder is served. This file records where they come from.

## Dock icons

Every theme shares one set: 32x32 icons from KDE 1.1 (1999), by the KDE artists, GNU General Public License v2 (`COPYING` in [KDE/kde1-kdebase](https://github.com/KDE/kde1-kdebase)). Quantized to three opacity levels and inlined as SVG masks, painted in the theme's text colour. Dark docks (White Rabbit) use them as drawn; light docks use an inverted copy, so outlines and holes are painted in ink.

- About: `pics/info.xpm`
- Contact: `kappfinder/pics/email.xpm`
- Terminal: not from KDE; a CRT with a prompt in the same style, drawn in `scripts/terminal_icon.py`
- Settings: `kcontrol/kcontrol/pics/kcontrol.xpm`

### White Rabbit

32x32 icons from CDE, the Common Desktop Environment (1993-95), designed by the User Interaction Design Group at Hewlett-Packard; GNU Lesser General Public License v2 or later (`COPYING` in [cdesktopenv](https://sourceforge.net/p/cdesktopenv/code/)). Brightness becomes opacity in three steps, in `cde/`, built by `scripts/cde_icons.py` and painted in the theme's text colour.

- About: `cde/programs/icons/Dtinfo.m.pm`
- Contact: `cde/programs/icons/DtMnew.m.pm`
- Terminal: `cde/programs/icons/Fpterm.m.pm`
- Settings: `cde/programs/icons/Fpstyle.m.pm`

## Menu marks

Each theme has its own 16x16 mark in the top-left menu, original pixel art:

- Silk: a window with its tab, drawn in `scripts/silk_logo.py`.
- White Rabbit: a white rabbit's head in slim black sunglasses.
- Believe: a grey alien's head.
- Steamboat: a stand-in film leader's countdown circle, drawn in `scripts/steamboat_logo.py`.
- OUTATIME: the flux capacitor, drawn in `scripts/traveler_logo.py`.
- Outpost 31: the husky, drawn in `scripts/outpost_logo.py`.
