Self-hosted WOFF2 fonts, one or two per theme, declared with `@font-face` in `src/styles.css`. Each is subset to keep it small:

```bash
pyftsubset font.ttf --flavor=woff2 --unicodes="U+0020-007E,U+2600-26FF" --output-file=public/fonts/ui.woff2
```

## In use

- `iosevka-500.woff2`, `iosevka-600.woff2`, `iosevka-700.woff2`: Iosevka Extended Medium, SemiBold and Bold by Renzhi Li, SIL Open Font License 1.1 (`Iosevka-OFL.txt`). The site's terminal font, from the official `PkgWebFont-Iosevka` release, subset with the `pyftsubset` command above using `--unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2195,U+2600-26FF"`.
- `geist-mono-400.woff2`, `geist-mono-500.woff2`, `geist-mono-600.woff2`: Geist Mono Regular, Medium and SemiBold by the Geist Project Authors, SIL Open Font License 1.1 (`GeistMono-OFL.txt`). Orbital's font, and the start screen's build line. Fontsource's Latin files.
- `geist-600.woff2`: Geist SemiBold by the Geist Project Authors, SIL Open Font License 1.1 (`Geist-OFL.txt`). The title on Orbital's start screen. Fontsource's Latin file.
- `grandstander-400.woff2`: Grandstander Regular by the Grandstander Project Authors, SIL Open Font License 1.1 (`Grandstander-OFL.txt`). Steamboat's text font. Fontsource's Latin file, subset with the `pyftsubset` command above using Iosevka's `--unicodes`.
- `recursive-mono-casual-400.woff2`, `recursive-mono-casual-500.woff2`, `recursive-mono-casual-600.woff2`, `recursive-mono-casual-700.woff2`: Recursive by the Recursive Project Authors, SIL Open Font License 1.1 (`Recursive-OFL.txt`). Steamboat's mono. Static instances of Fontsource's variable Latin file at `CASL` 1, `slnt` 0, `CRSV` 0.5, `MONO` 1, `wght` 400, 500, 600 and 700 (fontTools `instancer`), subset with the `pyftsubset` command above using Iosevka's `--unicodes`.
- `righteous-400.woff2`: Righteous Regular by Astigmatic, SIL Open Font License 1.1 (`Righteous-OFL.txt`). The start screen's title. Fontsource's Latin file.
- `permanent-marker-400.woff2`: Permanent Marker Regular by Font Diner, Apache License 2.0 (`PermanentMarker-LICENSE.txt`). The brush script on the start screen. Fontsource's Latin file.
- `space-mono-700.woff2`: Space Mono Bold by the Space Mono Project Authors, SIL Open Font License 1.1 (`SpaceMono-OFL.txt`). The start screen's prompt. Fontsource's Latin file.
- `titan-one-400.woff2`: Titan One by Rodrigo Fuenzalida, SIL Open Font License 1.1 (`TitanOne-OFL.txt`). Steamboat's start screen title. Fontsource's Latin file.
- `playfair-display-700-italic.woff2`, `jost-500.woff2`, `jost-600.woff2`: Playfair Display Bold Italic by the Playfair Display Project Authors and Jost Medium and SemiBold by the Jost Project Authors, SIL Open Font License 1.1 (`PlayfairDisplay-OFL.txt`, `Jost-OFL.txt`). Steamboat's start screen version and prompt, and Steamboat's labels. Fontsource's Latin files.
