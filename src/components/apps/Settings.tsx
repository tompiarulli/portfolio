import { useEffect, useId, useRef, useState } from 'react'
import { ORBITS } from '#/components/Backdrop'
import Orbits from '#/components/Orbits'
import { Window } from '#/components/Window'
import { DEFAULT_THEME, THEMES, applyTheme, currentTheme } from '#/lib/theme'
import type { Backdrop, Theme } from '#/lib/theme'

export function Settings() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  useEffect(() => {
    setTheme(currentTheme())
    // The terminal can switch theme too, so follow <html>.
    const observer = new MutationObserver(() => setTheme(currentTheme()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])
  const pick = (t: Theme) => applyTheme(t)

  return (
    <Window title="Settings" right x={-199} y={249} width={420}>
      <fieldset className="border border-(--ink) p-3">
        <legend className="px-1 font-title">Theme</legend>
        <div className="grid grid-cols-3 gap-3">
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

const PREVIEW_ROWS = 7
const PREVIEW_COLUMNS = 32

/** A still of a drifting backdrop: `chars` scattered over a share of the
 *  cells. */
function scatter(chars: string, share: number, seed: number) {
  const next = seeded(seed)
  return Array.from({ length: PREVIEW_ROWS }, () =>
    Array.from({ length: PREVIEW_COLUMNS }, () =>
      next() < share ? chars[Math.floor(next() * chars.length)] : ' ',
    ).join(''),
  ).join('\n')
}

/** A still of the streaks, in percent of the tile: far ones short, thin
 *  and dim, near ones long and thicker, spread evenly from top to
 *  bottom, each in one of the four --streak colours. */
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
  const [colors, setColors] = useState<string[] | null>(null)
  useEffect(() => {
    const style = getComputedStyle(ref.current!)
    setColors(
      ['--desk', '--warp', '--glint'].map((v) =>
        style.getPropertyValue(v).trim(),
      ),
    )
  }, [])
  return (
    <span ref={ref} className="absolute inset-0">
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
    </span>
  )
}

const PREVIEWS: Record<
  Exclude<Backdrop, 'plain' | 'film' | 'orbits' | 'streaks'>,
  string
> = {
  rain: digits(1999),
  stars: scatter('..··+*', 0.08, 7),
  snow: scatter('*·.+*', 0.2, 31),
  dust: scatter('·.·', 0.05, 11),
}

const SKY_WIDTH = 64
const SKY_HEIGHT = 32

/** Treetops as overlapping crowns, tallest at the left edge and thinning
 *  out to the right, as in the corner of an old photo. */
function treetops(seed: number) {
  const next = seeded(seed)
  // Run past both edges so the blur has dark to pull in, not the sky.
  return Array.from({ length: 32 }, (_, i) => {
    const x = (i / 31) * (SKY_WIDTH + 12) - 6
    const rise = Math.min(1, 1 - x / SKY_WIDTH)
    return {
      x,
      y: SKY_HEIGHT - 2 - rise * 8 - next() * 3,
      r: 2.2 + rise * 2.2 + next() * 1.8,
    }
  })
}

const TREETOPS = treetops(1993)

/** Believe's still: a tight crop of a grainy, out of focus snapshot,
 *  dark treetops under a washed-out sky. */
function TreelinePreview() {
  const id = useId()
  return (
    <svg
      viewBox={`0 0 ${SKY_WIDTH} ${SKY_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
    >
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--highlight)" />
          <stop offset="1" stopColor="var(--surface)" />
        </linearGradient>
        <filter id={`${id}softer`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={`${id}grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.4" seed="9" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1" />
        </filter>
      </defs>
      <rect width={SKY_WIDTH} height={SKY_HEIGHT} fill={`url(#${id}sky)`} />
      <g filter={`url(#${id}softer)`} fill="var(--ink)">
        {/* Each crown with a trunk of dark down to the ground, so no sky
            shows through under it. */}
        {TREETOPS.map(({ x, y, r }) => (
          <path
            key={x}
            d={`M${x - r} ${SKY_HEIGHT + 6}V${y}a${r} ${r} 0 0 1 ${2 * r} 0V${SKY_HEIGHT + 6}z`}
          />
        ))}
        <rect x={-6} y={SKY_HEIGHT - 5} width={SKY_WIDTH + 12} height="11" />
      </g>
      <rect
        width={SKY_WIDTH}
        height={SKY_HEIGHT}
        filter={`url(#${id}grain)`}
        opacity="0.18"
      />
    </svg>
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
      className="relative block h-16 overflow-hidden bg-(--desk)"
    >
      {theme === 'believe' ? (
        <TreelinePreview />
      ) : backdrop === 'plain' ? (
        // Nothing to show of a plain desktop, so the theme's menu mark, at
        // twice its grid.
        <span
          className="logo absolute inset-0 m-auto text-(--on-title)"
          style={{
            width: 'calc(2 * var(--logo-size))',
            height: 'calc(2 * var(--logo-size))',
          }}
        />
      ) : backdrop === 'orbits' ? (
        <OrbitsPreview />
      ) : backdrop === 'film' ? (
        // A still of the film: the frame darkening to the edges.
        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--warp)_30%,var(--desk)_110%)]" />
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
      ) : backdrop === 'rain' ? (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] leading-[11px] tracking-[1px] [text-shadow:0_0_6px_var(--warp)] whitespace-pre text-(--warp)">
          {PREVIEWS.rain}
        </span>
      ) : (
        <span className="absolute inset-0 font-mono text-[10px] leading-[10px] tracking-[1px] whitespace-pre text-(--warp)">
          {PREVIEWS[backdrop]}
        </span>
      )}
    </span>
  )
}
