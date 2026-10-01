# Portfolio

Personal site: one page with a short bio and links out to my profiles, drawn as a terminal window over an animated glyph backdrop. A theme picker swaps the colours, font, mark and backdrop. React 19, TanStack Start, Tailwind 4, deployed to Vercel. Every route is prerendered to static HTML at build time; the site must feel instant.

Setup, scripts, file layout, commit format, and deploy live in CONTRIBUTING.md and apply here:

@CONTRIBUTING.md

## Conventions

- Performance is the point. No state libraries, no icon packs. Animation libraries only arrive via vendored React Bits components, imported lazily in the route that uses them so the shell stays small. CSS transitions of 150 to 200 ms, `transform`-driven motion, pointer events. Keep client JS small; check gzipped size of `.output/public/assets` after adding a dependency.
- Prerender-safe components: anything reading `Date`, `localStorage`, or `window` must render a stable placeholder on the server and fill in inside `useEffect` (see `Clock.tsx`).
- Colors come from CSS variables only (`var(--surface)`, Tailwind `bg-(--surface)`), never hard-coded hex in components. Add new tokens to the default `:root, [data-theme]` block (White Rabbit, the default theme) and override them in any theme that needs a different value. There is no light/dark mode; the theme drives everything.
- Aesthetic rules: 1 px ink borders, zero border radius, `image-rendering: pixelated`, monospace fonts, `font-smoothing: none`. No drop shadows.
- Links between routes use `<Link>` with `preload="intent"` so hover preloads the route chunk.
- Route `head()` sets a page title as `Page - {site.title}`.
- Imports use the `#/` alias for `src/`.
- `src/routeTree.gen.ts` is generated; never edit by hand.
- Devtools are dev-only, lazy-loaded in `__root.tsx`; keep them out of the production bundle.
- Edit copy and project data in `src/lib/site.ts`, not in routes.
- Split unrelated changes into separate commits (e.g. config vs content).
- Solo personal project: commit directly to `main`. No feature branches or PRs needed.
