Put self-hosted WOFF2 pixel fonts here and enable the `@font-face` blocks in `src/styles.css`.

Suggested free options: Silkscreen (`ui.woff2`).

Subset them so each is a few KB:

```bash
pyftsubset font.ttf --flavor=woff2 --unicodes="U+0020-007E,U+2600-26FF" --output-file=public/fonts/ui.woff2
```
