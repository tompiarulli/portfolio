Put self-hosted WOFF2 pixel fonts here and enable the `@font-face` blocks in `src/styles.css`.

Suggested free options: Silkscreen (`ui.woff2`).

Subset them so each is a few KB:

```bash
pyftsubset font.ttf --flavor=woff2 --unicodes="U+0020-007E,U+2600-26FF" --output-file=public/fonts/ui.woff2
```

## In use

- `iosevka-500.woff2`, `iosevka-600.woff2`, `iosevka-700.woff2`: Iosevka Extended Medium, SemiBold and Bold by Renzhi Li, SIL Open Font License 1.1 (`Iosevka-OFL.txt`). The site's terminal font, from the official `PkgWebFont-Iosevka` release, subset with the `pyftsubset` command above using `--unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2195,U+2600-26FF"`.
- `dm-mono-400.woff2`, `dm-mono-500.woff2`: DM Mono Regular and Medium by the DM Mono Project Authors, SIL Open Font License 1.1 (`DMMono-OFL.txt`). I Believe's font, the Latin subset served by Google Fonts.
- `dejavu-mono-400.woff2`, `dejavu-mono-700.woff2`: DejaVu Sans Mono Book and Bold by the DejaVu fonts team, from Bitstream Vera, Bitstream Vera license and public domain changes (`DejaVu-LICENSE.txt`). TomSpace's font, a monospace cousin of Verdana. Fontsource's Latin files, subset with the `pyftsubset` command above using Iosevka's `--unicodes`.
- `ibm-plex-mono-400.woff2`, `ibm-plex-mono-600.woff2`: IBM Plex Mono Regular and SemiBold by IBM Corp., SIL Open Font License 1.1 (`IBMPlexMono-OFL.txt`). Outpost 31's font. Fontsource's Latin files, subset with the `pyftsubset` command above using Iosevka's `--unicodes`.
