# Icons

Each theme has its own menu mark, original art, in a folder named for the theme's id (`orbital`, `rabbit`, `steamboat`, `traveler`). `src/styles.css` points each theme at its file under "Menu marks". Until a theme's mark is drawn, its file is a plain placeholder box.

| File       | Where                                                          | How it's drawn                                                                                                                            |
| ---------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `mark.svg` | The menu mark, top left of the menu bar, 16x16 (`--logo-size`) | As a mask: only its shape counts, painted in the menu bar's text colour, so it inverts when the menu opens. Draw it in any single colour. |

To swap one in, export the design as an SVG over the placeholder with the same name; the dev server picks it up. A PNG works too: export it at twice the size it shows at (32x32) and change the file name in that theme's rule in `src/styles.css`.

The dock has no icons: each app is a ruled key with its name.

Art from elsewhere is fine too: credit it here with its licence and in `credits` in `src/lib/site.ts`, and for a paid set commit only what's exported at display size, never the source pack.
