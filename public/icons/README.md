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

About is a full-colour icon from Flaticon, "Retro icons created by Magnific - Flaticon" (https://www.flaticon.com/free-icons/retro), under Flaticon's free licence, which requires that credit wherever the icon is shown. Downloaded as a 512px PNG and scaled to 72px, twice its 36px dock size (`flaticon/floppy.png`).

Contact is a full-colour icon from Flaticon, "Postcard icons created by Magnific - Flaticon" (https://www.flaticon.com/free-icons/postcard), under the same free licence. Downloaded as a 512px PNG and scaled to 72px, twice its 36px dock size (`flaticon/postcard.png`).

Terminal is a full-colour icon from Flaticon, "Computer icons created by Magnific - Flaticon" (https://www.flaticon.com/free-icons/computer), under the same free licence. Downloaded as a 512px PNG and scaled to 72px, twice its 36px dock size (`flaticon/computer.png`).

Settings is a full-colour icon from Flaticon, "Gear icons created by Vectors Tank - Flaticon" (https://www.flaticon.com/free-icons/gear), under the same free licence. Downloaded as a 512px PNG and scaled to 72px, twice its 36px dock size (`flaticon/settings.png`).

## Menu marks

Each theme has its own 16x16 mark in the top-left menu, original art:

- Orbital: a plain, smooth disc, an SVG circle in `src/styles.css`.
- White Rabbit: a white rabbit's head in slim black sunglasses.
- Believe: a grey alien's head.
- Outpost 31: the husky, drawn in `scripts/outpost_logo.py`.
- OUTATIME: the flux capacitor, drawn in `scripts/traveler_logo.py`.
- Steamboat: a stand-in film leader's countdown circle, drawn in `scripts/steamboat_logo.py`.
