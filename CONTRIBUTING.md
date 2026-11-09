# Contributing

This is a personal site, so contributions are not expected, but the setup is documented here for anyone curious and for future me.

## Setup

Requires Node 26 (pinned in `.nvmrc`, and in `package.json`'s `engines` for Vercel) and pnpm 12.14.0 (pinned in `package.json`'s `packageManager`; Node no longer ships Corepack, so `npm i -g corepack && corepack enable` picks it up, or install that pnpm version directly).

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
- `src/components/start/` each theme's Restart sequence, one module per theme: its shut down (`Down`) and its start screen (`Start`), registered in `start/index.tsx` with how long each screen's exit takes, and the pieces they share in `start/parts.tsx`. `ShutDown` runs the sequence: the chrome closes, then the theme's shut down and start screen play, and keeping the stage in `data-off` on `<html>` (`src/lib/power.ts`) lets the backdrops play their part. Each theme's boot back to the desktop is CSS, under "Shut Down" in `styles.css`.
- `src/lib/windows.ts` window ids and the windows open on first paint. The desktop has one URL; windows are state in `WindowManager`, and any other URL opens File Not Found.
- `src/lib/site.ts` all copy and project data, including the descriptions and headings of the home page and the 404, and the Travel player's channels. Its clips, videos and photos, play in turn; a photo (`still: true`) holds the screen for five seconds of play. Each folder in `assets/travel/` is a channel's footage, curated there (ignored by git, since the originals carry GPS); `pnpm travel` crops everything to the screen's 16:9, tone-maps HDR, strips sound and metadata, and writes the results to `public/travel/<channel>/` and their list to `src/lib/travel.gen.ts` (generated, never edited by hand), which the channel in `site.ts` reads its `clips` from by folder name. Run it again after any change to the folders, or leave `pnpm travel --watch` running beside `pnpm dev`: it encodes only what's new or changed and deletes what no longer has a source, and `--force` encodes everything again after a change to its settings. Each clip is named after its source file, and the player's strip shows that name, so rename the originals to say what they show (`Hedge Maze.mov` becomes `hedge_maze.mp4`: lowercase, with underscores). Crop a portrait shot by hand first if the middle isn't the part you want. The site serves `public/travel/` itself, in dev and in production; git keeps it in LFS (`git lfs install` once after cloning), and the Vercel project has Git LFS turned on so its builds get the files rather than their pointers. CI checks out the pointers only, since no check plays a clip. A channel with no clips shows a test card.
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
