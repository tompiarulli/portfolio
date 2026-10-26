import {
  Suspense,
  lazy,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { ORBITS } from '#/components/Backdrop'
import { Window } from '#/components/Window'
import {
  CLOCK_MODES,
  clockMode,
  setClockMode,
  subscribeClockMode,
} from '#/lib/clock'
import { DEFAULT_THEME, THEMES, applyTheme, currentTheme } from '#/lib/theme'
import type { Backdrop, Theme } from '#/lib/theme'

// The same chunk the backdrop loads, so the preview never pulls the rings
// into the shell.
const Orbits = lazy(() => import('#/components/Orbits'))

/** The terminal can switch theme too, so follow <html>. */
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  return () => observer.disconnect()
}

export function Settings() {
  // The prerendered page can't know the saved theme, so it shows the
  // default until hydrated.
  const theme = useSyncExternalStore(
    subscribeTheme,
    currentTheme,
    () => DEFAULT_THEME,
  )
  const pick = (t: Theme) => applyTheme(t)
  const clock = useSyncExternalStore(
    subscribeClockMode,
    clockMode,
    () => 'theme' as const,
  )

  return (
    <Window title="Settings" right x={-199} y={189} width={360}>
      <fieldset className="border border-(--ink) p-3">
        <legend className="px-1 font-mono">Date &amp; Time</legend>
        <div className="grid grid-cols-2 border border-(--ink)">
          {CLOCK_MODES.map((m) => (
            <label
              key={m.id}
              className={`cursor-pointer py-1 text-center outline-offset-2 transition-colors duration-150 not-first:border-l not-first:border-(--ink) has-focus-visible:outline-2 has-focus-visible:outline-(--ink) ${
                clock === m.id ? 'bg-(--accent) text-(--on-accent)' : ''
              }`}
            >
              <input
                type="radio"
                name="clock"
                value={m.id}
                checked={clock === m.id}
                onChange={() => setClockMode(m.id)}
                className="sr-only"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4 border border-(--ink) p-3">
        <legend className="px-1 font-mono">Theme</legend>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <ThemeTile key={t.id} theme={t} on={theme === t.id} pick={pick} />
          ))}
        </div>
      </fieldset>
    </Window>
  )
}

function ThemeTile({
  theme: t,
  on,
  pick,
}: {
  theme: (typeof THEMES)[number]
  on: boolean
  pick: (theme: Theme) => void
}) {
  return (
    <label className="cursor-pointer border border-(--ink) outline-offset-2 has-focus-visible:outline-2 has-focus-visible:outline-(--ink)">
      <input
        type="radio"
        name="theme"
        value={t.id}
        checked={on}
        onChange={() => pick(t.id)}
        className="sr-only"
      />
      <ThemePreview theme={t.id} backdrop={t.backdrop} />
      <span
        className={`block border-t border-(--ink) py-1 text-center transition-colors duration-150 ${
          on ? 'bg-(--accent) text-(--on-accent)' : ''
        }`}
      >
        {t.label}
      </span>
    </label>
  )
}

/** Fixed pseudo-random numbers in [0, 1), so previews match on server and
 *  client. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

/** A still of the code rain: a wall of digits, wider and taller than the
 *  preview so it runs off every edge evenly. */
function digits(seed: number) {
  const next = seeded(seed)
  return Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => Math.floor(next() * 10)).join(''),
  ).join('\n')
}

/** A still of the streaks, laid out as the backdrop lays them out, in
 *  percent of the tile. */
function streaks(seed: number) {
  const next = seeded(seed)
  // Rounded, so the server and the browser print the same styles.
  const at = (n: number) => Math.round(n * 10) / 10
  return Array.from({ length: 90 }, () => next() ** 1.6)
    .sort((a, b) => a - b)
    .map((depth) => {
      const scale = 0.1 + 0.9 * depth
      const length = (100 + next() * 150) * scale
      return {
        top: at(next() * 100),
        left: at(next() * (100 + length) - length),
        length: at(length),
        opacity: at(0.3 + 0.7 * depth),
        thickness: Math.max(1, Math.round(2 * depth)),
        color: `var(--streak-${1 + Math.floor(next() * 4)})`,
      }
    })
}

const STREAKS_PREVIEW = streaks(88)

/** A still of the orbital rings, drawn by the backdrop's own code once
 *  the tile's --desk, --warp and --glint can be read. */
function OrbitsPreview() {
  const ref = useRef<HTMLSpanElement>(null)
  const [colors, setColors] = useState<[string, string, string] | null>(null)
  useEffect(() => {
    const style = getComputedStyle(ref.current!)
    const token = (name: string) => style.getPropertyValue(name).trim()
    setColors([token('--desk'), token('--warp'), token('--glint')])
  }, [])
  return (
    <span ref={ref} className="absolute inset-0">
      {/* Its own boundary, so only the tile waits for the chunk, not the
          whole window. */}
      <Suspense>
        {colors && (
          <Orbits
            {...ORBITS}
            // Blown up past the tile's edges, so it shows a close crop of the
            // rings like the other tiles, not the whole set shrunk down.
            center={[0.65, 0.6]}
            inner={0.6}
            outer={2.4}
            point={1.5}
            background={colors[0]}
            color={colors[1]}
            highlight={colors[2]}
            still
            stillTime={20}
          />
        )}
      </Suspense>
    </span>
  )
}

const RAIN_PREVIEW = digits(1999)

/** Steamboat's tile: a still of the film as projected, brightest in the
 *  middle and grainy. */
function FilmPreview() {
  const id = useId()
  return (
    <span className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_center,var(--glint)_0%,var(--warp)_100%)]">
      <svg aria-hidden className="absolute inset-0 size-full">
        <filter id={`${id}grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.2" seed="7" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#${id}grain)`}
          opacity="0.3"
        />
      </svg>
    </span>
  )
}

/** A tiny desktop: just the theme's backdrop. */
function ThemePreview({
  theme,
  backdrop,
}: {
  theme: Theme
  backdrop: Backdrop
}) {
  return (
    <span
      data-theme={theme}
      aria-hidden
      className="relative block h-16 overflow-hidden [background:var(--desk-sky),var(--desk)]"
    >
      {backdrop === 'orbits' ? (
        <OrbitsPreview />
      ) : backdrop === 'film' ? (
        <FilmPreview />
      ) : backdrop === 'streaks' ? (
        STREAKS_PREVIEW.map((l, i) => (
          <span
            key={i}
            className="absolute mix-blend-plus-lighter"
            style={{
              background: `linear-gradient(to right, transparent, ${l.color})`,
              top: `${l.top}%`,
              left: `${l.left}%`,
              width: `${l.length}%`,
              height: l.thickness,
              opacity: l.opacity,
            }}
          />
        ))
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] leading-[12px] tracking-[1px] whitespace-pre text-(--warp) [text-shadow:0_0_6px_var(--warp)]">
          {RAIN_PREVIEW}
        </span>
      )}
    </span>
  )
}
