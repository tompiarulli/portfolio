import { Backdrop } from './Backdrop'
import { ThemePicker } from './ThemePicker'
import { build } from '#/lib/build'
import { profiles, site } from '#/lib/site'

const HEADING =
  'mb-2 [font-weight:var(--label-weight)] [text-transform:var(--label-case)]'

/** The whole site: one terminal window over the theme's backdrop. */
export function Home() {
  return (
    <>
      <Backdrop />
      <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
        <article className="w-full max-w-[540px] border border-(--ink) bg-(--surface)">
          <header className="grid h-(--title-height) grid-cols-[1fr_auto_1fr] items-center border-b border-(--ink) bg-(--title) px-1.5 text-(--on-title)">
            <span aria-hidden className="logo" />
            <h1 className="text-(length:--title-size) [font-weight:var(--title-weight)] [text-transform:var(--title-case)] before:content-(--title-open) after:content-(--title-close)">
              {site.name}
            </h1>
          </header>

          <div className="space-y-6 p-5">
            <section className="space-y-3">
              <p className={HEADING}>{site.tagline}</p>
              {site.letter.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p>{site.signoff}</p>
            </section>

            <section>
              <h2 className={HEADING}>Elsewhere</h2>
              <ul className="border-t border-(--ink)">
                {profiles.map((p) => (
                  <li
                    key={p.url}
                    className="border-b border-dotted border-(--ink)"
                  >
                    <a
                      href={p.url}
                      rel="me"
                      className="flex justify-between gap-4 px-1 py-1.5 outline-none hover:bg-(--accent) hover:text-(--on-accent) focus-visible:bg-(--accent) focus-visible:text-(--on-accent)"
                    >
                      <span>{p.label}</span>
                      <span className="truncate">{p.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-(--ink) px-5 py-3">
            <ThemePicker />
            <a
              href={`${site.repo}/commit/${build.commit}`}
              className="opacity-60 hover:underline"
            >
              v{build.commit}
            </a>
          </footer>
        </article>
      </main>
    </>
  )
}
