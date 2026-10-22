# Contributing

This is a personal site, so contributions are not expected, but the setup is documented here for anyone curious and for future me.

## Setup

Requires Node 24 (pinned in `.nvmrc`) and pnpm 12.14.0 (pinned in `package.json`'s `packageManager`; `corepack enable` picks it up).

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Scripts

```bash
pnpm build         # production build, prerenders every route into .output/
pnpm preview       # serve the production build
pnpm test          # vitest run (jsdom, Testing Library)
pnpm typecheck     # tsc --noEmit
pnpm lint          # oxlint
pnpm lint:fix      # oxlint --fix
pnpm format        # oxfmt
pnpm format:check  # oxfmt --check
```

Run `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` before committing; CI runs the same five checks on every pull request. The build runs the prerender crawl, which catches broken routes and loaders. Tests sit next to the code they cover as `*.test.ts`.

Renovate opens dependency updates weekly. TanStack packages are pinned exactly and move together.

## Layout

- `src/routes/` file-based routes. They set the URL and `head()` only; the root route renders `<Desktop>` (menu bar, dock, open windows).
- `src/components/` desktop chrome: `Desktop`, `MenuBar`, `Clock`, `Dock`, `DockIcon`, `Window`, `WindowManager` and `ShutDown`, plus `Backdrop`, which lazy-loads the current theme's desktop background (`CodeRain`, `Drift`, `Orbits`, `Film` or `Streaks`).
- `src/components/apps/` window contents, one component per app, registered in `apps/index.tsx`.
- `src/lib/windows.ts` window ids and their URLs. The URL follows the focused window, so each route prerenders with its window open.
- `src/lib/site.ts` all copy and project data, including each page's description.
- `src/lib/seo.ts` the head tags a route sets: title, description, canonical URL and link preview.
- `src/lib/security-headers.ts` and `src/lib/content-security-policy.ts` the headers every response gets, applied through Nitro route rules in `vite.config.ts`.
- `src/lib/theme.ts` the theme list (Orbital, the default, White Rabbit, Believe, Steamboat, OUTATIME and Outpost 31) and the inline script that applies the saved theme before first paint.
- `src/lib/terminal.ts` the Terminal app's commands.
- `src/styles.css` design tokens per theme, and the retro desktop chrome utilities.
- `public/fonts/` self-hosted fonts.
- `scripts/` Python scripts that build the menu marks, dock icons and Shut Down photo; see `scripts/README.md`.

## Pull requests

Every change lands on `main` through a pull request, squash merged, so each PR becomes one commit and its title becomes the commit message. The description says what changed and how it was verified. History stays linear: rebase on `main`, never merge it into a branch.

## Commits

Conventional Commits with a required scope: `type(scope): subject`. With squash merges this applies to PR titles.

- Types: `feat`, `fix`, `refactor`, `style`, `perf`, `docs`, `chore`, `build`, `ci`, `test`.
- Scopes: `app`, `desktop`, `theme`, `content`, `deps`, `config`. A `docs` commit takes the scope of what it documents, e.g. `docs(theme)`, never `docs(docs)`.
- Subject imperative, lowercase, no trailing period, under 72 characters.
- Themes are homages: describe what a change looks like, never name the film, show or site behind it.
- No AI attribution trailers (`Co-Authored-By: Claude`, "Generated with"). `Co-Authored-By` is a human-collaborator convention; AI tooling is a tool like a linter, not an author. The README already says the site is built with Claude Code.

## Deploy

Production deploys only from tagged releases, which are being set up: Release Please opens a release PR from the Conventional Commits on `main`, and merging it tags the version and deploys it to Vercel. Pushes to `main` alone don't deploy. Nothing runs at request time, so the site itself needs no environment variables.

See [CLAUDE.md](CLAUDE.md) for the conventions that apply to code and design.
