# Portfolio

Personal portfolio site styled as a fake late-90s desktop OS, inspired by poolsuite.net. React 19, TanStack Start, Tailwind 4, deployed to Vercel. Every route is prerendered to static HTML at build time; the site must feel instant.

Setup, scripts, file layout, commit format, and deploy live in CONTRIBUTING.md and apply here:

@CONTRIBUTING.md

## Conventions

- Performance is the point. No state libraries, no icon packs, no animation libraries: the backdrops are hand-written canvas and WebGL, lazy-loaded so the shell stays small. CSS transitions of 150 to 200 ms, `transform`-driven motion, pointer events. Keep client JS small; check gzipped size of `.output/public/assets` after adding a dependency.
- Prerender-safe components: anything reading `Date`, `localStorage`, or `window` must render a stable placeholder on the server and fill in inside `useEffect` (see `Clock.tsx`).
- Colors come from CSS variables only (`var(--surface)`, Tailwind `bg-(--surface)`), never hard-coded hex in components. Add new tokens to the base `:root, [data-theme]` block (White Rabbit's values; Orbital is the default theme) and override them in any theme that needs a different value. There is no light/dark mode; the theme drives everything.
- Aesthetic rules: 1 px ink borders, zero border radius, bevels via inset box-shadow, `image-rendering: pixelated`, monospace fonts, antialiased (a theme may use a sans, as Steamboat does). Outline fonts never render with `font-smoothing: none`; it makes them jagged on macOS. No drop shadows.
- Links between routes use `<Link>` with `preload="intent"` so hover preloads the route chunk.
- Route `head()` sets a page title as `Page - {site.title}`.
- Imports use the `#/` alias for `src/`.
- `src/routeTree.gen.ts` is generated; never edit by hand.
- Devtools are dev-only, lazy-loaded in `__root.tsx`; keep them out of the production bundle.
- Edit copy and project data in `src/lib/site.ts`, not in routes.
- Themes are homages, never named. Each theme changes only its colour tokens, font, 16x16 menu mark, dock icon set, a backdrop, and the date on the clock; everything else is shared chrome. Backdrops can be any abstract pattern or effect (glyphs, dithers, gradients, generative motion), but never figurative: no characters, animals, vehicles, creatures or objects like saucers. Tom draws those himself. Dock icons come from an existing icon set chosen to suit the theme, credited with its licence in `public/icons/README.md`. Open, attribution-only and paid licences are all fine; for a paid set, commit only the icons exported at display size, never the source pack. Never name the film, show or site a theme nods to (or its characters) in code, comments, docs or commit messages: describe the look ("green phosphor terminal", "a flux capacitor mark") and let people get the reference.
- Terminal easter eggs (`src/lib/terminal.ts`) are found by exploring. The README and the repo description may say they exist, but nothing inside the site points to them: keep `help` a plain command list and the banner neutral, and never hint at a specific trigger. Funny replies are welcome. Tom writes the jokes; don't add new ones unasked.
- Never commit without asking. Make the change, verify it, then propose the commit message and split and wait for a yes. Pushing, and opening or merging a pull request, each need their own yes.
- Split unrelated changes into separate commits (e.g. config vs content).
- Every change lands through a pull request; never push to `main` directly. Branch from `main`, open a PR whose description says what changed and how it was verified, and squash merge it. The PR title becomes the commit on `main`, so it follows the commit format. Keep history linear: rebase on `main`, never merge it into a branch.
