# Icons

Each theme has its own menu mark and dock icons, original art, in a folder named for the theme's id (`orbital`, `rabbit`, `steamboat`, `traveler`). `src/styles.css` points each theme at its folder under "Menu marks and dock icons". Until a theme's art is drawn, its files are plain placeholder boxes.

| File           | Where                                                          | How it's drawn                                                                                                                            |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `mark.svg`     | The menu mark, top left of the menu bar, 16x16 (`--logo-size`) | As a mask: only its shape counts, painted in the menu bar's text colour, so it inverts when the menu opens. Draw it in any single colour. |
| `about.svg`    | The About icon in the dock, 40x40 (36x36 on phones)            | As drawn, in its own colours. Draw on a square canvas; the icon fills it.                                                                 |
| `contact.svg`  | The Contact icon                                               | As drawn.                                                                                                                                 |
| `work.svg`     | The Work icon                                                  | As drawn.                                                                                                                                 |
| `terminal.svg` | The Terminal icon                                              | As drawn.                                                                                                                                 |
| `settings.svg` | The Settings icon                                              | As drawn.                                                                                                                                 |

To swap one in, export the design as an SVG over the placeholder with the same name; the dev server picks it up. A PNG works too: export it at twice the size it shows at (80x80 for a dock icon, 32x32 for a mark) and change the file name in that theme's rule in `src/styles.css`. Pixel art reads sharpest at whole multiples of its grid; set `--icon-rendering: pixelated` in the theme's rule so it scales without blurring.

Art from elsewhere is fine too: credit it here with its licence and in `credits` in `src/lib/site.ts`, and for a paid set commit only the exported icons, never the source pack.
