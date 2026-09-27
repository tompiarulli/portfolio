import { useEffect, useState } from 'react'
import { Window } from '#/components/Window'
import { DEFAULT_THEME, THEMES, applyTheme, currentTheme } from '#/lib/theme'
import type { Theme } from '#/lib/theme'

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
      <ThemePreview theme={t.id} rain={t.backdrop === 'rain'} />
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

/** A tiny desktop: the theme's backdrop fading in behind a blank window. */
function ThemePreview({ theme, rain }: { theme: Theme; rain: boolean }) {
  return (
    <span
      data-theme={theme}
      aria-hidden
      className="relative block h-16 overflow-hidden bg-(--desk)"
    >
      {rain ? (
        <span className="absolute inset-0 font-mono text-[10px] leading-[10px] tracking-[1px] break-all text-(--warp)">
          {RAIN_PREVIEW.repeat(2)}
        </span>
      ) : (
        <span className="absolute inset-0 bg-[conic-gradient(var(--warp)_25%,transparent_0_50%,var(--warp)_0_75%,transparent_0)] bg-size-[4px_4px] mask-linear-315 mask-linear-from-20% mask-linear-to-70%" />
      )}
      <span className="absolute top-2 left-2 h-9 w-3/5 border border-(--ink) bg-(--surface)">
        <span className="block h-2 border-b border-(--ink)" />
      </span>
    </span>
  )
}
