import { useEffect, useState } from 'react'
import { DEFAULT_THEME, THEMES, applyTheme, currentTheme } from '#/lib/theme'
import type { Theme } from '#/lib/theme'

/** A swatch per theme: its mark on its own title bar colours. */
export function ThemePicker() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  useEffect(() => setTheme(currentTheme()), [])
  const pick = (t: Theme) => {
    setTheme(t)
    applyTheme(t)
  }
  const label = THEMES.find((t) => t.id === theme)?.label

  return (
    <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <legend className="sr-only">Theme</legend>
      <div className="flex gap-2">
        {THEMES.map((t) => (
          <label
            key={t.id}
            title={t.label}
            className={`cursor-pointer border border-(--ink) outline-offset-2 has-focus-visible:outline-2 has-focus-visible:outline-(--ink) ${
              theme === t.id ? 'outline-1 outline-(--ink)' : ''
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={t.id}
              checked={theme === t.id}
              onChange={() => pick(t.id)}
              className="sr-only"
            />
            <span className="sr-only">{t.label}</span>
            <span
              data-theme={t.id}
              aria-hidden
              className="flex size-7 items-center justify-center bg-(--title) text-(--on-title) transition-transform duration-150 hover:-translate-y-px"
            >
              <span className="logo" />
            </span>
          </label>
        ))}
      </div>
      <span aria-hidden className="[text-transform:var(--label-case)]">
        {label}
      </span>
    </fieldset>
  )
}
