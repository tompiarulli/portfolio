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
pnpm build:vercel  # the same build with Vercel's output, into .vercel/output/
pnpm preview       # serve the production build
pnpm serve:prod    # serve the Vercel build as Vercel does, on :4173
pnpm test          # vitest run (jsdom, Testing Library)
pnpm test:e2e      # Playwright smoke tests against pnpm serve:prod
pnpm lighthouse    # Lighthouse CI budgets against pnpm serve:prod
pnpm typecheck     # tsc --noEmit
pnpm lint          # oxlint
pnpm lint:fix      # oxlint --fix
pnpm format        # oxfmt
pnpm format:check  # oxfmt --check
```

Run `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` before committing; CI runs the same five checks on every push to `main` and every pull request. The build runs the prerender crawl, which catches broken routes and loaders. Tests sit next to the code they cover as `*.test.ts` or `*.test.tsx`; component tests render the whole desktop through `src/test/desktop.tsx`.

The end-to-end tests and Lighthouse need the Vercel build: `pnpm build:vercel`, then `pnpm test:e2e` or `pnpm lighthouse`. Both start `scripts/serve-prod.mjs`, which follows the routes in `.vercel/output/config.json`, so pages get production's headers, statuses and compression, unknown URLs included. The Playwright tests live in `e2e/` and fail on any console error or CSP violation; `e2e/contrast.spec.ts` also runs axe's WCAG AA colour-contrast rule over every window, the menu bar, the dock and the open menu in every theme, since Lighthouse only sees the default one, and `src/styles.test.ts` checks every theme's colour tokens pair by pair, hover and pressed colours included, against the same AA ratios (3:1 for icons and marks); run `pnpm exec playwright install --only-shell chromium` once first. Lighthouse runs the mobile preset three times on the home page and the 404 page, against the budgets in `lighthouserc.json` (performance at least 0.95, accessibility, best practices and SEO all 1, LCP under 2.5 s, CLS under 0.1, TBT under 200 ms). The 404 is checked audit by audit for SEO instead, skipping the indexing check, since it is `noindex` on purpose (the end-to-end tests check that it is). It uses your installed Chrome and writes its reports to `.lighthouseci/`. CI runs both as their own jobs; the Lighthouse reports are uploaded as an artifact.

Renovate opens dependency updates weekly. TanStack packages are pinned exactly and move together.

## Layout

- `src/routes/` file-based routes: the home page, which sets `head()` only. The root route renders `<Desktop>` (menu bar, dock, open windows) and the head for unknown URLs.
- `src/components/` desktop chrome: `Desktop`, `MenuBar`, `Clock`, `Dock`, `Window`, `WindowManager` and `ShutDown`, plus `Backdrop`, which lazy-loads the current theme's desktop background (`CodeRain`, `Orbits`, `Film` or `Streaks`).
- `src/components/apps/` window contents, one component per app, registered in `apps/index.tsx`.
- `src/components/start/` each theme's start screen, the one Restart ends on, one component per theme, registered in `start/index.tsx`, with the pieces they share in `start/parts.tsx`. `ShutDown` runs the sequence around it.
- `src/lib/windows.ts` window ids and the windows open on first paint. The desktop has one URL; windows are state in `WindowManager`, and any other URL opens File Not Found.
- `src/lib/site.ts` all copy and project data, including the descriptions and headings of the home page and the 404, and the Travel player's channels. Its clips live on Vercel Blob, not in the repo: upload each MP4 to the Blob store and add its URL to the channel's `clips`, which play in turn, with a `name` for the player to show in place of Blob's suffixed file name (the CSP allows `*.public.blob.vercel-storage.com` for media and posters). A channel with no clips shows a test card.
- `src/lib/seo.ts` the head tags a page sets: title, description, canonical URL and link preview.
- `src/lib/security-headers.ts` and `src/lib/content-security-policy.ts` the headers every response gets, applied through Nitro route rules in `vite.config.ts`.
- `src/lib/theme.ts` the theme list (Orbital, the default, White Rabbit, Steamboat and OUTATIME) and the inline script that applies the theme before first paint: the one named by `?theme=` (an id or the label as a slug, like `?theme=white-rabbit`), for that visit only, else the saved one. `?start` opens the site on the start screen that Restart ends on; with `?theme=` it shows that theme's.
- `src/lib/terminal.ts` the Terminal app's commands; Terminal opens from the system menu, not the dock.
- `src/styles.css` design tokens per theme, and the retro desktop chrome utilities.
- `public/fonts/` self-hosted fonts.
- `public/icons/` each theme's menu mark, one folder per theme; see `public/icons/README.md`.
- `scripts/` `serve-prod.mjs`, which serves the Vercel build as Vercel does; see `scripts/README.md`.

## Workflow

Until v1.0.0, commits go straight to `main`. From v1.0.0, every change lands on `main` through a pull request, squash merged, so each PR becomes one commit and its title becomes the commit message. The description says what changed and how it was verified. History stays linear: rebase on `main`, never merge it into a branch.

## Commits

Conventional Commits with a required scope: `type(scope): subject`. From v1.0.0, with squash merges, this applies to PR titles.

- Types: `feat`, `fix`, `refactor`, `style`, `perf`, `docs`, `chore`, `build`, `ci`, `test`.
- Scopes: `app`, `desktop`, `theme`, `content`, `deps`, `config`. A `docs` commit takes the scope of what it documents, e.g. `docs(theme)`, never `docs(docs)`.
- Subject imperative, lowercase, no trailing period, under 72 characters.
- Themes are homages: describe what a change looks like, never name the film, show or site behind it.
- No AI attribution trailers (`Co-Authored-By: Claude`, "Generated with"). `Co-Authored-By` is a human-collaborator convention; AI tooling is a tool like a linter, not an author. The README already says the site is built with Claude Code.

## Deploy

Production deploys only from tagged releases, which are being set up: Release Please opens a release PR from the Conventional Commits on `main`, and merging it tags the version and deploys it to Vercel. Pushes to `main` alone don't deploy. Nothing runs at request time, so the site itself needs no environment variables.

See [CLAUDE.md](CLAUDE.md) for the conventions that apply to code and design.
