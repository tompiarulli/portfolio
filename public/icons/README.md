# Icons

The dock icons in this folder are served as is and picked per theme by tokens in `src/styles.css`; the menu marks are inlined there. This file records where they come from.

## Dock icons

Themes without a set of their own share one: icons from Haiku's icon set, by the Haiku project, MIT License (from `data/artwork/icons/` in [haiku/haiku](https://github.com/haiku/haiku)). The originals are kept as SVG in `haiku/`; the dock uses 32x32 masks painted in the theme's text colour. Dark docks use the `-dark` copies as drawn; light docks (Believe, Steamboat, Outpost 31) use the `-light` copies, inverted so outlines and holes are painted in ink.

- About: `App_StyledEdit`
- Contact: `App_Mail`
- Terminal: `App_Terminal`
- Settings: `Folder_prefs`

### White Rabbit

32x32 icons from CDE, the Common Desktop Environment (1993-95), designed by the User Interaction Design Group at Hewlett-Packard; GNU Lesser General Public License v2 or later (`COPYING` in [cdesktopenv](https://sourceforge.net/p/cdesktopenv/code/)). Brightness becomes opacity in three steps, in `cde/`, built by `scripts/cde_icons.py` and painted in the theme's text colour.

- About: `cde/programs/icons/Dtinfo.m.pm`
- Contact: `cde/programs/icons/DtMnew.m.pm`
- Terminal: `cde/programs/icons/Fpterm.m.pm`
- Settings: `cde/programs/icons/Fpstyle.m.pm`

### Orbital

32x32 icons from the Tango Desktop Project's icon theme 0.8.90 (2009), released into the public domain (`tango/COPYING`), as published, shown in greyscale.

- About: `32x32/apps/accessories-text-editor.png`
- Contact: `32x32/apps/internet-mail.png`
- Terminal: `32x32/apps/utilities-terminal.png`
- Settings: `32x32/categories/preferences-system.png`

### OUTATIME

Placeholder blocks for now: the theme sets no masks, so each icon paints as a solid square in the text colour.

## Menu marks

Each theme has its own 16x16 mark in the top-left menu, original art:

- Orbital: a plain, smooth disc, an SVG circle in `src/styles.css`.
- White Rabbit: a white rabbit's head in slim black sunglasses.
- Believe: a grey alien's head.
- Steamboat: a stand-in film leader's countdown circle, drawn in `scripts/steamboat_logo.py`.
- OUTATIME: the flux capacitor, drawn in `scripts/traveler_logo.py`.
- Outpost 31: the husky, drawn in `scripts/outpost_logo.py`.
