import { useEffect, useState } from 'react'
import { Window } from '#/components/Window'
import { DEFAULT_THEME, THEMES, applyTheme, currentTheme } from '#/lib/theme'
import type { Backdrop, Theme } from '#/lib/theme'

export function Settings() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  useEffect(() => setTheme(currentTheme()), [])
  const pick = (t: Theme) => {
    setTheme(t)
    applyTheme(t)
  }

  return (
    <Window title="Settings" x={50} y={10} width={420}>
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

/** A static screen of glyphs standing in for the code rain. */
const RAIN_PREVIEW =
  'K7@Q2#VZ8X&M4R+PJ9$L0N=T3<W6YH>A5*FD1;S/G8B:C#E2U@QX7M4&RZ9KV$P0L+JN3T=W6<YH5>AF*D1S;G/B8:CE#U2'

/** Fixed pseudo-random numbers in [0, 1), so previews match on server and
 *  client. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
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

/** A still of the streaks: a run of trail glyphs in some rows. */
function streaks(seed: number) {
  const next = seeded(seed)
  return Array.from({ length: PREVIEW_ROWS }, () => {
    if (next() < 0.4) return ''
    const length = 5 + Math.floor(next() * 12)
    const start = Math.floor(next() * (PREVIEW_COLUMNS - length))
    return ' '.repeat(start) + '=-=~'.repeat(length).slice(0, length)
  }).join('\n')
}

const PREVIEWS: Record<Exclude<Backdrop, 'plain'>, string> = {
  rain: RAIN_PREVIEW.repeat(2),
  stars: scatter('..··+*', 0.08, 7),
  streaks: streaks(88),
  snow: scatter('*·.+*', 0.2, 31),
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
      {backdrop === 'plain' ? (
        // Nothing to show of a plain desktop, so the theme's menu mark, at
        // twice its grid.
        <span
          className="logo absolute inset-0 m-auto text-(--on-title)"
          style={{
            width: 'calc(2 * var(--logo-size))',
            height: 'calc(2 * var(--logo-size))',
          }}
        />
      ) : (
        <span
          className={`absolute inset-0 font-mono text-[10px] leading-[10px] tracking-[1px] text-(--warp) ${
            backdrop === 'rain' ? 'break-all' : 'whitespace-pre'
          }`}
        >
          {PREVIEWS[backdrop]}
        </span>
      )}
    </span>
  )
}
