import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { Window } from '#/components/Window'
import { useWindows } from '#/components/WindowManager'
import { clockMode } from '#/lib/clock'
import { restart } from '#/lib/power'
import { BANNER, PROMPT, complete, run } from '#/lib/terminal'
import { applyTheme, currentTheme } from '#/lib/theme'

// Module load is near enough to page load for uptime.
const bootedAt = Date.now()

type Line = { text: string; prompt?: boolean }

// A real shell's limits, so holding Enter or pasting a novel can't bog the
// window down: the lines kept on screen, the commands kept for Up and
// `history`, and the characters one command can take.
const SCROLLBACK = 500
const HISTSIZE = 500
const LINE_MAX = 256

/** The lines on screen with more added, the oldest dropping off the top. */
const append = (lines: Line[], more: Line[]) =>
  [...lines, ...more].slice(-SCROLLBACK)

const banner = (): Line[] => BANNER.map((text) => ({ text }))

/** A small shell full of easter eggs. Commands live in lib/terminal. */
export function Terminal() {
  const { raise, close } = useWindows()
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
    const next = typed.trim() ? [...history, typed].slice(-HISTSIZE) : history
    const { out, effect } = run(typed, {
      theme: currentTheme(),
      clock: clockMode(),
      history: next,
      bootedAt,
    })
    setHistory(next)
    setCursor(next.length)
    setInput('')
    if (effect?.type === 'clear') return setLines([])
    setLines((l) =>
      append(l, [
        { text: typed, prompt: true },
        ...out.map((text) => ({ text })),
      ]),
    )
    if (effect?.type === 'exit') close('terminal')
    if (effect?.type === 'open') raise(effect.id)
    if (effect?.type === 'theme') applyTheme(effect.id)
    if (effect?.type === 'restart') restart()
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
      setLines((l) => append(l, [{ text: `${input}^C`, prompt: true }]))
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
              {line.prompt && (
                <span className="text-(--terminal-prompt)">{PROMPT} </span>
              )}
              {line.text}
            </p>
          ))}
        </div>
        <label className="flex">
          <span className="shrink-0 text-(--terminal-prompt)">
            {PROMPT}&nbsp;
          </span>
          <input
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={LINE_MAX}
            aria-label="Terminal input"
            // Focused when the window opens or comes to the front.
            data-autofocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-(--terminal-prompt) caret-(--terminal-prompt) outline-none"
          />
        </label>
      </div>
    </Window>
  )
}
