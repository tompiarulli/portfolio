import { useEffect, useState } from 'react'
import { Window } from '#/components/Window'
import {
  MODES,
  THEMES,
  applyMode,
  applyTheme,
  savedMode,
  savedTheme,
} from '#/lib/theme'
import type { Mode, Theme } from '#/lib/theme'
import { build } from '#/lib/build'
import { site } from '#/lib/site'

export function Settings() {
  const [mode, setMode] = useState<Mode>('system')
  const [theme, setTheme] = useState<Theme>('ink')
  useEffect(() => {
    setMode(savedMode())
    setTheme(savedTheme())
  }, [])

  return (
    <Window title="Settings" x={220} y={80} width={420}>
      <fieldset className="border border-(--ink) p-3">
        <legend className="px-1 font-title">Mode</legend>
        <div className="flex gap-4">
          {MODES.map((m) => (
            <label
              key={m}
              className="flex cursor-pointer items-center gap-2 capitalize"
            >
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => {
                  setMode(m)
                  applyMode(m)
                }}
                className="accent-(--ink)"
              />
              {m}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-3 border border-(--ink) p-3">
        <legend className="px-1 font-title">Desktop</legend>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const on = theme === t.id
            return (
              <label
                key={t.id}
                className="cursor-pointer border border-(--ink) outline-offset-2 has-focus-visible:outline-2 has-focus-visible:outline-(--ink)"
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.id}
                  checked={on}
                  onChange={() => {
                    setTheme(t.id)
                    applyTheme(t.id)
                  }}
                  className="sr-only"
                />
                <ThemePreview theme={t.id} />
                <span
                  className={`block border-t border-(--ink) py-1 text-center transition-colors duration-150 ${
                    on ? 'bg-(--accent) text-(--on-accent)' : ''
                  }`}
                >
                  {t.label}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-dotted border-(--ink) pt-3">
        <dt className="font-title">Version</dt>
        <dd>
          {build.commit}
          {build.date && ` (${build.date})`}
        </dd>
        <dt className="font-title">Built with</dt>
        <dd>{site.builtWith}</dd>
      </dl>
    </Window>
  )
}

/** A tiny desktop: the theme's dither fading in behind a blank window. */
function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <span
      data-theme={theme}
      aria-hidden
      className="relative block h-16 overflow-hidden bg-(--desk)"
    >
      <span className="absolute inset-0 bg-[conic-gradient(var(--warp)_25%,transparent_0_50%,var(--warp)_0_75%,transparent_0)] bg-size-[4px_4px] mask-linear-315 mask-linear-from-20% mask-linear-to-70%" />
      <span className="absolute top-2 left-2 h-9 w-3/5 border border-(--ink) bg-(--surface)">
        <span className="block h-2 border-b border-(--ink)" />
      </span>
    </span>
  )
}
