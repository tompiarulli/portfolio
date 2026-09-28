# Icons

The dock icons are inlined as `--icon-*` mask tokens in `src/styles.css`, so nothing in this folder is served. This file records where they come from.

## In use

- White Rabbit dock icons: original 32x32 pixel art of film props (an office ID badge, a CRT terminal, a MiniDisc, the hollow book, the landline and the pills), drawn in `scripts/rabbit_icons.py`.
- I Believe dock icons: 32x32 icons from KDE 1.1 (1999), by the KDE artists, GNU General Public License v2 (`COPYING` in [KDE/kde1-kdebase](https://github.com/KDE/kde1-kdebase)). Quantized to three opacity levels, inverted, and inlined as SVG masks. White Rabbit used them uninverted before its own set; that version is kept in `dev/kde-rabbit-icons.css`.
  - About: `pics/info.xpm`
  - Work: `pics/kfm.xpm`
  - Media: `kscreensaver/kscreensaver.xpm`, with the "zZZ" bubble replaced by a play button
  - Blog: `pics/txt.xpm`
  - Contact: `kappfinder/pics/email.xpm`
  - Settings: `kcontrol/kcontrol/pics/kcontrol.xpm`
- TomSpace menu mark and dock icons: original pixel art after an early social network's logo and the icons in its contact box (the founder's photo, a favourites folder, the profile song, a blog pad, a message sealed with a heart and a palette for editing the profile), drawn in `scripts/tomspace_icons.py`.
- Time Traveler menu mark and dock icons: original pixel art after props from the film (the flux capacitor, the family photo with the siblings fading out, the time machine, his guitar from the dance, the clock tower flyer, the letter from 1885 and the time circuits), drawn in `scripts/traveler_icons.py`.
- Outpost 31 menu mark and dock icons: original pixel art after props from the film (the husky, the pilot in his hat and shades, the biologist's computer running the simulation, a videotape from the other camp, the pilot's tape recorder, the radio room's microphone and a flamethrower), drawn in `scripts/outpost_icons.py`.
