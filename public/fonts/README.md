Put self-hosted WOFF2 pixel fonts here and enable the `@font-face` blocks in `src/styles.css`.

Suggested free options: Silkscreen (`ui.woff2`).

Subset them so each is a few KB:

```bash
pyftsubset font.ttf --flavor=woff2 --unicodes="U+0020-007E,U+2600-26FF" --output-file=public/fonts/ui.woff2
```

## In use

- `departure-mono.woff2`: Departure Mono by Helena Zhang, SIL Open Font License 1.1 (`DepartureMono-OFL.txt`). The TomOS UI font.
- `iosevka-500.woff2`, `iosevka-600.woff2`, `iosevka-700.woff2`: Iosevka Extended Medium, SemiBold and Bold by Renzhi Li, SIL Open Font License 1.1 (`Iosevka-OFL.txt`). The White Rabbit theme's terminal font, from the official `PkgWebFont-Iosevka` release, subset with the `pyftsubset` command above using `--unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2195,U+2600-26FF"`.
