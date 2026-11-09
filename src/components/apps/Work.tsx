import { Fragment, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { Window } from '#/components/Window'
import { profiles, site } from '#/lib/site'
import { companies, dates, years } from '#/lib/work'

const linkedIn = profiles.find((p) => p.label === 'LinkedIn')

const COMPANIES = companies(site.work)

// The list's groups, in order, each company filed by its latest role.
const SECTIONS = (
  ['Career', 'Side Projects', 'Volunteering', 'Education'] as const
).map((name) => ({
  name,
  companies: COMPANIES.flatMap((c, i) =>
    (site.work[c.roles[0]!]!.section ?? 'Career') === name ? [i] : [],
  ),
}))
// Top to bottom, for the arrow keys.
const ORDER = SECTIONS.flatMap((s) => s.companies)

const COLUMNS = 'grid grid-cols-[1fr_96px] items-center'

// The Travel player's channel key and menu lines, for the phone's picker.
const KEY =
  'flex h-[26px] w-full cursor-pointer items-center justify-between gap-2 rounded-(--close-radius) border border-(--ink) px-3 font-(family-name:--font-label) text-(length:--label-size) [font-weight:var(--label-weight)] tracking-(--label-tracking) [text-transform:var(--label-case)] -outline-offset-4 outline-current outline-dotted not-focus-visible:outline-none hover:bg-(--accent) hover:text-(--on-accent) active:translate-y-px pointer-coarse:h-[36px]'
const OPTION =
  'flex w-full cursor-pointer items-center gap-2 px-3 py-[5px] text-left whitespace-nowrap outline-none pointer-coarse:py-3 hover:bg-(--accent) hover:text-(--on-accent) focus-visible:bg-(--accent) focus-visible:text-(--on-accent)'

/** Work history as a file manager's list view: a line per company, most
 *  recent first, with its years, grouped under Career, Side Projects,
 *  Volunteering and Education, and a way out to LinkedIn at the foot. The company picked reads alongside, every role there in
 *  turn, each pane scrolling on its own. The lines are tabs, so the arrow
 *  keys walk them and Home and End jump to the ends. A phone has no room
 *  for the list: a key at the top opens the companies as a menu, like
 *  the Travel player's channels, and the link sits under the reading. */
export function Work() {
  // The most recent.
  const [index, setIndex] = useState(0)
  const id = useId()
  const list = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const company = COMPANIES[index]!
  const about = site.work[company.roles[0]!]!.about

  const pick = (i: number) => {
    setIndex(i)
    // A new company reads from its top: the panel's own, beside the list,
    // or the window's, on a phone.
    if (panel.current) panel.current.scrollTop = 0
    const body = panel.current?.closest('[data-window-body]')
    if (body) body.scrollTop = 0
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const at = ORDER.indexOf(index)
    const to =
      e.key === 'ArrowDown'
        ? ORDER[Math.min(ORDER.length - 1, at + 1)]
        : e.key === 'ArrowUp'
          ? ORDER[Math.max(0, at - 1)]
          : e.key === 'Home'
            ? ORDER[0]
            : e.key === 'End'
              ? ORDER.at(-1)
              : undefined
    if (to === undefined) return
    e.preventDefault()
    pick(to)
    document.getElementById(`${id}tab${to}`)?.focus()
  }

  return (
    <Window title="Work" x={-20} y={20} width={780} height={520} flush>
      <div className="grid sm:h-full sm:grid-cols-[280px_1fr] sm:grid-rows-[minmax(0,1fr)]">
        <CompanyPicker index={index} pick={pick} />
        {/* Under the reading on a phone, with only the link. */}
        <div className="flex flex-col max-sm:order-last">
          <div
            aria-hidden
            className={`${COLUMNS} border-b border-(--ink) *:px-2 *:py-1 *:not-first:border-l *:not-first:border-(--ink) max-sm:hidden`}
          >
            <span className="heading">Name</span>
            <span className="heading">Years</span>
          </div>
          <div
            ref={list}
            role="tablist"
            aria-label="Companies"
            aria-orientation="vertical"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            className="os-scroll pb-1 max-sm:hidden sm:min-h-0 sm:flex-1"
          >
            {SECTIONS.map((section) => (
              <Fragment key={section.name}>
                {/* Read with each line in it, as its description. */}
                <p
                  id={`${id}${section.name}`}
                  aria-hidden
                  className="heading mt-4 border-y border-(--ink) bg-(--ink)/10 px-2 py-1 first:mt-0 first:border-t-0"
                >
                  {section.name}
                </p>
                {section.companies.map((i) => {
                  const c = COMPANIES[i]!
                  const on = i === index
                  return (
                    <button
                      key={`${c.company}-${i}`}
                      type="button"
                      role="tab"
                      id={`${id}tab${i}`}
                      aria-selected={on}
                      aria-controls={`${id}panel`}
                      aria-describedby={`${id}${section.name}`}
                      tabIndex={on ? 0 : -1}
                      onClick={() => pick(i)}
                      className={`${COLUMNS} h-[24px] w-full cursor-pointer text-left -outline-offset-2 outline-current transition-colors duration-150 outline-dotted not-focus-visible:outline-none pointer-coarse:h-[36px] ${
                        on
                          ? 'bg-(--accent) text-(--on-accent)'
                          : 'hover:bg-(--accent)/20'
                      }`}
                    >
                      <span className="truncate px-2">{c.company}</span>
                      <span className="px-2 tabular-nums">{years(c.span)}</span>
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
          {linkedIn && (
            <p className="px-3 py-2 pointer-coarse:py-3">
              <span className="opacity-70">{site.workLink}</span>{' '}
              <a
                href={linkedIn.url}
                rel="me"
                className="inline-flex items-center gap-1 underline outline-offset-2 outline-current outline-dotted not-focus-visible:outline-none"
              >
                {linkedIn.label}
                {/* An arrow out of the box: it leaves the desktop. */}
                <svg aria-hidden viewBox="0 0 8 8" className="size-2 shrink-0">
                  <path
                    d="M1.5 6.5l5-5M2.5 1.5h4v4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1}
                    strokeLinecap="square"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </a>
            </p>
          )}
        </div>
        <article
          ref={panel}
          id={`${id}panel`}
          role="tabpanel"
          aria-labelledby={`${id}tab${index}`}
          data-window-body
          className="os-scroll border-(--ink) p-5 select-text sm:border-l"
        >
          <h3 className="heading">{company.company}</h3>
          {company.roles.length > 1 && (
            <p className="mt-1">{dates(company.span)}</p>
          )}
          {about && <p className="opacity-70">{about}</p>}
          {company.roles.map((r) => {
            const w = site.work[r]!
            return (
              <section
                key={r}
                className="mt-3 border-t border-dotted border-(--ink) pt-3"
              >
                <h4>{w.role}</h4>
                <p className="opacity-70">{dates(w)}</p>
                <p className="mt-2">{w.summary}</p>
                {w.highlights.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {w.highlights.map((h) => (
                      <li key={h} className="grid grid-cols-[1.25em_1fr]">
                        <span aria-hidden>-</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </article>
      </div>
    </Window>
  )
}

/** The phone's company list: a ruled key naming the company picked,
 *  opening a menu of them all under it, drawn and worked like the Travel
 *  player's channels. Arrow keys walk it, Home and End jump to the ends,
 *  Escape closes. */
function CompanyPicker({
  index,
  pick,
}: {
  index: number
  pick: (i: number) => void
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const options = () => [
    ...(list.current?.querySelectorAll<HTMLElement>('[role=menuitemradio]') ??
      []),
  ]
  useEffect(() => {
    if (open) options()[ORDER.indexOf(index)]?.focus()
  }, [open, index])

  const close = () => {
    setOpen(false)
    button.current?.focus()
  }

  // Escape closes the menu, not the window: caught on the way down, as
  // the window listens for it before React's handlers run.
  const onEscape = (e: KeyboardEvent) => {
    if (!open || e.key !== 'Escape') return
    e.preventDefault()
    close()
  }

  const onListKeyDown = (e: KeyboardEvent) => {
    const all = options()
    const i = all.indexOf(document.activeElement as HTMLElement)
    const to =
      e.key === 'ArrowDown'
        ? Math.min(all.length - 1, i + 1)
        : e.key === 'ArrowUp'
          ? Math.max(0, i - 1)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? all.length - 1
              : null
    if (to === null) return
    e.preventDefault()
    all[to]?.focus()
  }

  const company = COMPANIES[index]
  return (
    <div
      ref={root}
      onKeyDownCapture={onEscape}
      // Tabbing out of the menu closes it, as clicking away does.
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
      className="sticky top-0 z-10 border-b border-(--ink) bg-(--surface) p-2 sm:hidden"
    >
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Company: ${company?.company}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
          e.preventDefault()
          setOpen(true)
        }}
        className={`${KEY} ${open ? 'bg-(--accent) text-(--on-accent)' : ''}`}
      >
        <span className="min-w-0 truncate">{company?.company}</span>
        <svg
          aria-hidden
          viewBox="0 0 8 8"
          className={`size-2 shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M0 2h8L4 7z" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div
          ref={list}
          role="menu"
          aria-label="Companies"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="os-scroll absolute inset-x-2 top-full mt-[-2px] max-h-[60vh] rounded-(--close-radius) border border-(--frame) bg-(--surface) pb-1 shadow-(--window-shadow)"
        >
          {SECTIONS.map((section) => (
            <Fragment key={section.name}>
              {/* Read with each line in it, as its description. */}
              <p
                id={`${id}${section.name}`}
                aria-hidden
                className="heading mt-2 border-y border-(--ink) bg-(--ink)/10 px-3 py-1 first:mt-0 first:border-t-0"
              >
                {section.name}
              </p>
              {section.companies.map((i) => {
                const c = COMPANIES[i]!
                return (
                  <button
                    key={`${c.company}-${i}`}
                    type="button"
                    role="menuitemradio"
                    aria-checked={i === index}
                    aria-describedby={`${id}${section.name}`}
                    tabIndex={-1}
                    onClick={() => {
                      pick(i)
                      close()
                    }}
                    className={OPTION}
                  >
                    <span className="min-w-0 flex-1 truncate">{c.company}</span>
                    <span className="w-[9ch] shrink-0 tabular-nums">
                      {years(c.span)}
                    </span>
                    {/* A lamp for the company picked, like the dock's. */}
                    <span
                      aria-hidden
                      className={`size-[5px] shrink-0 border border-current ${i === index ? 'bg-current' : 'opacity-0'}`}
                    />
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
