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

- `src/routes/` file-based routes. They set the URL, `head()`, and loaders only; the root route renders `<Desktop>` (menu bar, dock, open windows).
- `src/components/` desktop chrome: `Desktop`, `MenuBar`, `Dock`, `Window`, `WindowManager`, `Button`, `Clock`.
- `src/components/apps/` window contents, one component per app, registered in `apps/index.tsx`.
- `src/lib/windows.ts` window ids and their URLs. The URL follows the focused window, so each route prerenders with its window open.
- `src/components/bits/` components vendored from [React Bits](https://reactbits.dev). Add one with `pnpm dlx shadcn@latest add @react-bits/<Name>-TS-TW`, then `pnpm format`.
- `src/lib/site.ts` all copy and project data.
- `src/lib/theme.ts` the theme list (Orbital, White Rabbit, Believe, Steamboat, OUTATIME and Outpost 31) and the inline script that applies the saved theme before first paint.
- `src/styles.css` design tokens per theme, and the retro desktop chrome utilities.
- `public/fonts/` self-hosted fonts.

## Commits

Conventional Commits with a required scope: `type(scope): subject`.

- Types: `feat`, `fix`, `refactor`, `style`, `perf`, `docs`, `chore`, `build`, `ci`, `test`.
- Scopes: `app`, `desktop`, `theme`, `content`, `deps`, `config`. A `docs` commit takes the scope of what it documents, e.g. `docs(theme)`, never `docs(docs)`.
- Subject imperative, lowercase, no trailing period, under 72 characters.
- Themes are homages: describe what a change looks like, never name the film, show or site behind it.
- No AI attribution trailers (`Co-Authored-By: Claude`, "Generated with"). `Co-Authored-By` is a human-collaborator convention; AI tooling is a tool like a linter, not an author. The README already says the site is built with Claude Code.

## Deploy

Vercel auto-detects TanStack Start. Push to `main` to deploy. Nothing runs at request time, so no environment variables are needed.

See [CLAUDE.md](CLAUDE.md) for the conventions that apply to code and design.
