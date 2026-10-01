# Contributing

This is a personal site, so contributions are not expected, but the setup is documented here for anyone curious and for future me.

## Setup

Requires Node 24 and pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Scripts

```bash
pnpm build      # production build, prerenders every route into .output/
pnpm preview    # serve the production build
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint
pnpm format     # prettier --write + eslint --fix
pnpm check      # prettier --check
```

Run `pnpm typecheck && pnpm lint && pnpm build` before committing. The build runs the prerender crawl, which catches broken routes and loaders.

## Layout

- `src/routes/` file-based routes. `index.tsx` renders `<Home>`, the whole site.
- `src/components/` `Home` (the page), `ThemePicker`, and `Backdrop`, which lazy-loads the theme's animated background (`CodeRain` or `Drift`).
- `src/components/bits/` components vendored from [React Bits](https://reactbits.dev). Add one with `pnpm dlx shadcn@latest add @react-bits/<Name>-TS-TW`, then `pnpm format`.
- `src/lib/site.ts` all copy and project data.
- `src/lib/theme.ts` the theme list (White Rabbit, I Believe, TomSpace, Time Traveler and Outpost 31) and the inline script that applies the saved theme before first paint.
- `src/styles.css` design tokens per theme, and base styles.
- `public/fonts/` self-hosted fonts.

## Commits

Conventional Commits with a required scope: `type(scope): subject`.

- Types: `feat`, `fix`, `refactor`, `style`, `perf`, `docs`, `chore`, `build`, `ci`, `test`.
- Scopes: `app`, `desktop`, `theme`, `content`, `deps`, `config`, `docs`.
- Subject imperative, lowercase, no trailing period, under 72 characters.
- No AI attribution trailers (`Co-Authored-By: Claude`, "Generated with"). `Co-Authored-By` is a human-collaborator convention; AI tooling is a tool like a linter, not an author. The README already says the site is built with Claude Code.

## Deploy

Vercel auto-detects TanStack Start. Push to `main` to deploy. Nothing runs at request time, so no environment variables are needed.

See [CLAUDE.md](CLAUDE.md) for the conventions that apply to code and design.
