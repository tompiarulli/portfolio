# Tom Piarulli

<!-- TODO(live link): uncomment once the site is deployed.
**[tompiarulli.com](https://tompiarulli.com)**
-->

<!-- TODO(badges): uncomment once CI is public and the Lighthouse job publishes badges.
[![CI](https://github.com/tompiarulli/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/tompiarulli/portfolio/actions/workflows/ci.yml)
Lighthouse performance, accessibility, best practices and SEO badges go here.
-->

My personal site, dressed up as a late-90s desktop and inspired by [Poolsuite](https://poolsuite.net). Windows, a dock, a terminal with a few easter eggs, and a handful of themes.

## Built with

- [TanStack Start](https://tanstack.com/start) and React 19, prerendered to static HTML on Vercel
- Tailwind CSS 4, with hand-written canvas and WebGL backdrops
- TypeScript, Vitest, Playwright, oxlint and oxfmt
- [Claude Code](https://claude.com/claude-code)

## Performance and testing

Every push runs lint, typecheck, unit tests, Playwright smoke tests and Lighthouse in CI. A build fails if the home page or the 404 drops below 95 for performance or 100 for accessibility, best practices and SEO on Lighthouse's mobile profile, or misses LCP 2.5 s, CLS 0.1 or TBT 200 ms. Since Lighthouse only sees the default theme, axe checks WCAG AA contrast in every theme too. See [CONTRIBUTING.md](CONTRIBUTING.md) to run it all locally.

## Credits

Fonts and icons are listed with their licences in [`public/fonts`](public/fonts/README.md) and [`public/icons`](public/icons/README.md). The Shut Down photo is by [Bruno Aguirre](https://unsplash.com/photos/green-field-YRfaG3JVwkU) on Unsplash.

## License

Code is [MIT](LICENSE); fonts, icons and the photo keep their own licences.
