# Portfolio

Personal portfolio site styled as a fake late-90s desktop OS, inspired by poolsuite.net. React 19, TanStack Start, Tailwind 4, deployed to Vercel. Every route is prerendered to static HTML at build time; the site must feel instant.

## Commands

```bash
pnpm dev          # dev server on http://localhost:3000
pnpm build        # production build + prerender into .output/
pnpm preview      # serve the production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm format       # prettier --write + eslint --fix
```

Run `pnpm typecheck && pnpm lint && pnpm build` before committing. The build runs the prerender crawl, so it catches broken routes and loaders.

## Commits

Conventional Commits with a **required scope**: `type(scope): subject`.

- Types: `feat`, `fix`, `refactor`, `style`, `perf`, `docs`, `chore`, `build`, `ci`, `test`.
- Scopes: `app` (shell, routing, root), `desktop` (windows, dock, menu bar, drag), `theme` (tokens, fonts, styles.css), `content` (site.ts, copy, projects), `deps`, `config`, `docs`.
- Subject: imperative, lowercase, no trailing period, under 72 characters.
- Breaking change: `type(scope)!: subject`.
- Examples: `feat(desktop): add window focus stacking`, `fix(theme): keep dither visible in mono theme`, `chore(deps): bump vite`.

## Layout

- `src/routes/` file-based routes. Each route renders one `<Window>`; the root route wraps everything in `<Desktop>` (menu bar + dock). Nested windows (e.g. `projects.$slug.tsx`) render via `<Outlet>` inside the parent.
- `src/components/` desktop chrome: `Desktop`, `MenuBar`, `Dock`, `Window`, `Button`, `Clock`.
- `src/lib/site.ts` all copy and project data. Edit content here, not in routes.
- `src/lib/theme.ts` theme list and the inline boot script that applies the saved theme before first paint.
- `src/styles.css` design tokens per `data-theme`, retro desktop bevel utilities (`bevel`, `bevel-accent`, `bevel-pressed`, `inset-well`, `stripes`), scrollbar styling.
- `src/components/bits/` components vendored from [React Bits](https://reactbits.dev) via the shadcn CLI. Add one with `pnpm dlx shadcn@latest add @react-bits/<Name>-TS-TW` (registry configured in `components.json`). They are source we own; edit freely, run `pnpm format` after adding. They may pull `motion` or `gsap`; keep them out of the desktop shell and confined to experiments.
- `src/routeTree.gen.ts` generated; never edit by hand.
- `public/fonts/` self-hosted pixel fonts (WOFF2, subsetted). `@font-face` blocks live in `styles.css`.

## Conventions

- Performance is the point. No state libraries, no icon packs. Animation libraries only arrive via vendored React Bits components, imported lazily in the route that uses them so the shell stays small. CSS transitions of 150 to 200 ms, `transform`-driven motion, pointer events. Keep client JS small; check gzipped size of `.output/public/assets` after adding a dependency.
- Prerender-safe components: anything reading `Date`, `localStorage`, or `window` must render a stable placeholder on the server and fill in inside `useEffect` (see `Clock.tsx`).
- Colors come from CSS variables only (`var(--surface)`, Tailwind `bg-(--surface)`), never hard-coded hex in components. Add new tokens to every theme block.
- Aesthetic rules: 1 px black borders, zero border radius, bevels via inset box-shadow, `image-rendering: pixelated`, pixel fonts, `font-smoothing: none`. No drop shadows except the soft window shadow already defined.
- Links between routes use `<Link>` with `preload="intent"` so hover preloads the route chunk.
- Route `head()` sets a page title as `Page - {site.title}`.
- Imports use the `#/` alias for `src/`.
- Devtools are dev-only, lazy-loaded in `__root.tsx`; keep them out of the production bundle.

## Deploy

Vercel auto-detects TanStack Start; `vercel.json` only sets the framework. Push to the connected branch to deploy. Nothing runs on a server at request time, so no environment variables are needed.
