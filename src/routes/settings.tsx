import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Window } from '#/components/Window'
import { THEMES, applyTheme  } from '#/lib/theme'
import type {Theme} from '#/lib/theme';
import { site } from '#/lib/site'

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: `Settings - ${site.title}` }] }),
  component: Settings,
})

function Settings() {
  const [theme, setTheme] = useState<Theme>('pink')
  useEffect(() => {
    const t = document.documentElement.dataset.theme as Theme | undefined
    if (t && THEMES.includes(t)) setTheme(t)
  }, [])

  return (
    <Window title="Settings" x={220} y={80} width={360}>
      <fieldset className="border border-black p-3">
        <legend className="px-1 font-title">Appearance</legend>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 capitalize"
            >
              <input
                type="radio"
                name="theme"
                value={t}
                checked={theme === t}
                onChange={() => {
                  setTheme(t)
                  applyTheme(t)
                }}
                className="accent-black"
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>
    </Window>
  )
}
