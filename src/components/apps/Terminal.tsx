import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Window } from '#/components/Window'
import { useWindows } from '#/components/WindowManager'
import { BANNER, PROMPT, complete, run } from '#/lib/terminal'
import { applyTheme, currentTheme } from '#/lib/theme'

// Module load is near enough to page load for uptime.
const bootedAt = Date.now()

type Line = { text: string; prompt?: boolean }

const banner = (): Line[] => BANNER.map((text) => ({ text }))

/** A small shell full of easter eggs. Commands live in lib/terminal. */
export function Terminal() {
  const { focus, close } = useWindows()
  const [lines, setLines] = useState<Line[]>(banner)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  // Where Up and Down are in the history; history.length is the fresh line.
  const [cursor, setCursor] = useState(0)
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    field.current?.scrollIntoView({ block: 'nearest' })
  }, [lines])

  const submit = () => {
    const typed = input
    const next = typed.trim() ? [...history, typed] : history
    const { out, effect } = run(typed, {
      theme: currentTheme(),
      history: next,
      bootedAt,
    })
    setHistory(next)
    setCursor(next.length)
    setInput('')
    if (effect?.type === 'clear') return setLines([])
    setLines((l) => [
      ...l,
      { text: typed, prompt: true },
      ...out.map((text) => ({ text })),
    ])
    if (effect?.type === 'exit') close('terminal')
    if (effect?.type === 'open') focus(effect.id)
    if (effect?.type === 'theme') applyTheme(effect.id)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') return submit()
    if (e.key === 'Tab') {
      e.preventDefault()
      return setInput(complete(input))
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const i = Math.max(
        0,
        Math.min(history.length, cursor + (e.key === 'ArrowUp' ? -1 : 1)),
      )
      setCursor(i)
      setInput(history[i] ?? '')
      return
    }
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      return setLines([])
    }
    if (e.ctrlKey && e.key === 'c') {
      setLines((l) => [...l, { text: `${input}^C`, prompt: true }])
      setInput('')
    }
  }

  return (
    <Window title="Terminal" x={-40} y={60} width={560} height={340} flush>
      {/* Clicking anywhere types at the prompt, like a real terminal. Only a
          shortcut for the pointer: the prompt is a plain, tabbable field.
          Touch screens get 16px text, or iOS zooms in on the prompt. */}
      <div
        role="presentation"
        onClick={() => {
          if (!getSelection()?.toString()) field.current?.focus()
        }}
        className="min-h-full bg-(--terminal) p-3 font-mono leading-[1.45] text-(--terminal-text) pointer-coarse:text-[16px]"
      >
        {/* A log, so screen readers read out each command's output. */}
        <div role="log" aria-label="Terminal output">
          {lines.map((line, i) => (
            <p key={i} className="break-words whitespace-pre-wrap">
              {line.prompt && <span className="text-(--glint)">{PROMPT} </span>}
              {line.text}
            </p>
          ))}
        </div>
        <label className="flex">
          <span className="shrink-0 text-(--glint)">{PROMPT}&nbsp;</span>
          <input
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Terminal input"
            // Focused when the window opens or comes to the front.
            data-autofocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-(--glint) caret-(--glint) outline-none"
          />
        </label>
      </div>
    </Window>
  )
}
