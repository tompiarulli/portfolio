Self-hosted WOFF2 fonts, one or two per theme, declared with `@font-face` in `src/styles.css`. Each is subset to keep it small:

```bash
pyftsubset font.ttf --flavor=woff2 --unicodes="U+0020-007E,U+2600-26FF" --output-file=public/fonts/ui.woff2
```

## In use

- `iosevka-500.woff2`, `iosevka-600.woff2`, `iosevka-700.woff2`: Iosevka Extended Medium, SemiBold and Bold by Renzhi Li, SIL Open Font License 1.1 (`Iosevka-OFL.txt`). The site's terminal font, from the official `PkgWebFont-Iosevka` release, subset with the `pyftsubset` command above using `--unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2195,U+2600-26FF"`.
- `dm-mono-400.woff2`, `dm-mono-500.woff2`: DM Mono Regular and Medium by the DM Mono Project Authors, SIL Open Font License 1.1 (`DMMono-OFL.txt`). Believe's font, the Latin subset served by Google Fonts.
- `geist-mono-400.woff2`, `geist-mono-600.woff2`: Geist Mono Regular and SemiBold by the Geist Project Authors, SIL Open Font License 1.1 (`GeistMono-OFL.txt`). Orbital's font. Fontsource's Latin files.
- `outpost-mono-400.woff2`, `outpost-mono-600.woff2`: Outpost Mono Regular and SemiBold, a modified version of IBM Plex Mono by IBM Corp., SIL Open Font License 1.1 (`IBMPlexMono-OFL.txt`). Outpost 31's font. Fontsource's Latin files, subset with the `pyftsubset` command above using Iosevka's `--unicodes`. The licence reserves the name "Plex" for unmodified copies, so the subset's family, full and PostScript names are changed to Outpost Mono with fontTools; the outlines and metrics are untouched.
- `grandstander-400.woff2`: Grandstander Regular by the Grandstander Project Authors, SIL Open Font License 1.1 (`Grandstander-OFL.txt`). Steamboat's text font. Fontsource's Latin file, subset with the `pyftsubset` command above using Iosevka's `--unicodes`.
- `recursive-mono-casual-400.woff2`, `recursive-mono-casual-500.woff2`: Recursive by the Recursive Project Authors, SIL Open Font License 1.1 (`Recursive-OFL.txt`). Steamboat's mono. Static instances of Fontsource's variable Latin file at `CASL` 1, `slnt` 0, `CRSV` 0.5, `MONO` 1, `wght` 400 and 500 (fontTools `instancer`), subset with the `pyftsubset` command above using Iosevka's `--unicodes`.
