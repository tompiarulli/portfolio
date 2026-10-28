import { useId, useSyncExternalStore } from 'react'

import { Window } from '#/components/Window'
import {
  CLOCK_MODES,
  clockMode,
  setClockMode,
  subscribeClockMode,
} from '#/lib/clock'
import { ORBITS, brightness, rider, ring } from '#/lib/orbits'
import {
  DEFAULT_THEME,
  THEMES,
  applyTheme,
  currentTheme,
  subscribeTheme,
} from '#/lib/theme'
import type { Backdrop, Theme } from '#/lib/theme'

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
        <legend className="heading px-1">Date &amp; Time</legend>
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
        <legend className="heading px-1">Theme</legend>
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

/** A still of the orbital rings, baked into SVG paths from the backdrop's
 *  own geometry, in units of the tile's height around the set's centre:
 *  one path per step of brightness, and the riding points. Blown up past
 *  the tile's edges, so it shows a close crop of the rings like the other
 *  tiles, not the whole set shrunk down. */
function orbits() {
  const t = 20 * ORBITS.speed
  const steps = 8
  const segments = 160
  const shades = Array.from({ length: steps }, () => '')
  const riders: { d: string; opacity: number }[] = []
  const at = ([x, y]: readonly number[]) => `${x!.toFixed(3)} ${y!.toFixed(3)}`
  for (let k = 0; k < ORBITS.count; k++) {
    const around = ring(k, ORBITS.count, 0.6, 2.4, t)
    let prev = around(0)
    let shade = -1
    for (let i = 1; i <= segments; i++) {
      const next = around((i / segments) * Math.PI * 2)
      const level = Math.round(
        brightness((prev[2] + next[2]) / 2, ORBITS.far) * (steps - 1),
      )
      // Each run of one shade continues its path; a new run starts anew.
      shades[level] += `${level === shade ? 'L' : `M${at(prev)}L`}${at(next)}`
      shade = level
      prev = next
    }
    const [x, y, depth] = around(rider(k, t))
    riders.push({
      d: `M${at([x, y])}h0`,
      opacity: brightness(depth, ORBITS.far),
    })
  }
  return {
    shades: shades.map((d, i) => ({ d, opacity: i / (steps - 1) })),
    riders,
  }
}

const ORBITS_PREVIEW = orbits()

/** The orbital rings' tile. The SVG is a square the tile's height, its
 *  origin at the set's centre, placed where the backdrop would put it. */
function OrbitsPreview() {
  return (
    <span className="absolute top-0 left-[65%] aspect-square h-full -translate-x-[60%]">
      <svg
        viewBox="-0.6 -0.6 1 1"
        className="size-full overflow-visible"
        fill="none"
      >
        {ORBITS_PREVIEW.shades.map(({ d, opacity }, i) => (
          <path
            key={i}
            d={d}
            stroke="var(--warp)"
            strokeOpacity={opacity}
            strokeWidth={ORBITS.lineWidth}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {ORBITS_PREVIEW.riders.map(({ d, opacity }, i) => (
          <path
            key={i}
            d={d}
            stroke="var(--glint)"
            strokeOpacity={opacity}
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
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
