import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Window } from '#/components/Window'
import { MODES, applyMode, savedMode } from '#/lib/theme'
import type { Mode } from '#/lib/theme'
import { site } from '#/lib/site'

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: `Settings - ${site.title}` }] }),
  component: Settings,
})

function Settings() {
  const [mode, setMode] = useState<Mode>('system')
  useEffect(() => setMode(savedMode()), [])

  return (
    <Window title="Settings" x={220} y={80} width={360}>
      <fieldset className="border border-(--ink) p-3">
        <legend className="px-1 font-title">Theme</legend>
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
    </Window>
  )
}
