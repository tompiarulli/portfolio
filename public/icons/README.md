# Icons

Dock icons live in this folder and are picked per theme by tokens in `src/styles.css`; the menu marks are inlined there. This file records where they come from.

## Dock icons

Every theme shares one set, painted in its dock's text colour: 32x32 icons from CDE, the Common Desktop Environment (1993-95), designed by the User Interaction Design Group at Hewlett-Packard; GNU Lesser General Public License v2 or later, with the licence text in `cde/COPYING`. Modified from the originals by `scripts/cde_icons.py`, from the pixmaps in [cdesktopenv](https://sourceforge.net/p/cdesktopenv/code/): on dark docks brightness becomes opacity in three steps (`-dark` copies); light docks (Believe, Steamboat, Outpost 31) use inverted `-light` copies, so the drawing reads as ink on paper.

- About: `cde/programs/icons/Dtinfo.m.pm`
- Contact: `cde/programs/icons/DtMnew.m.pm`
- Terminal: `cde/programs/icons/Fpterm.m.pm`
- Settings: `cde/programs/icons/Fpstyle.m.pm`

A theme can swap in a set of its own through `--icon-<id>-mask` (painted in the text colour) or `--icon-<id>-image` (shown as drawn) in `src/styles.css`, credited here with its licence.

## Menu marks

Each theme has its own 16x16 mark in the top-left menu, original art:

- Orbital: a plain, smooth disc, an SVG circle in `src/styles.css`.
- White Rabbit: a white rabbit's head in slim black sunglasses.
- Believe: a grey alien's head.
- Steamboat: a stand-in film leader's countdown circle, drawn in `scripts/steamboat_logo.py`.
- OUTATIME: the flux capacitor, drawn in `scripts/traveler_logo.py`.
- Outpost 31: the husky, drawn in `scripts/outpost_logo.py`.
