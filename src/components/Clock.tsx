import { useEffect, useRef, useState } from 'react'

import { useWindows } from '#/components/WindowManager'
import { clockMode, subscribeClockMode } from '#/lib/clock'
import { THEMES } from '#/lib/theme'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split(' ')
const DIGITS = '0123456789'
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function fmtTime(d: Date) {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "WED 31 MAR 1999": the theme's day, unless Settings asks for today;
 *  the time stays real. */
function fmtDate() {
  const id = document.documentElement.dataset.theme
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0]
  const d =
    theme.date && clockMode() === 'theme'
      ? new Date(`${theme.date}T12:00:00`)
      : new Date()
  const day = String(d.getDate()).padStart(2, '0')
  return `${DAYS[d.getDay()]} ${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Shows `text`; when it changes, each changed character flicks through its
 *  own kind (digits or letters) before landing, left to right. */
function useFlip(text: string) {
  const [shown, setShown] = useState(text)
  const from = useRef(text)
  useEffect(() => {
    const start = from.current
    from.current = text
    if (
      !start ||
      start === text ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(text)
      return
    }
    // A timer rather than animation frames, so a switch made while the tab
    // is hidden still lands on the right text.
    const t0 = performance.now()
    const step = () => {
      const t = performance.now() - t0
      const done = t >= 200 + text.length * 40
      setShown(
        [...text]
          .map((c, i) => {
            if (done || c === start[i] || c === ' ' || t >= 200 + i * 40)
              return c
            const pool = DIGITS.includes(c) ? DIGITS : LETTERS
            return pool[Math.floor(Math.random() * pool.length)]
          })
          .join(''),
      )
      if (done) clearInterval(id)
    }
    const id = setInterval(step, 55)
    step()
    return () => clearInterval(id)
  }, [text])
  return shown
}

/** Renders empty on the server so prerendered HTML never bakes in a stale
 *  time. Pressing it opens Settings, where its date is chosen, as a 90s
 *  desktop's clock opened its date and time panel. */
export function Clock() {
  const { raise } = useWindows()
  const [now, setNow] = useState<Date | null>(null)
  const [date, setDate] = useState('')
  useEffect(() => {
    // Tick on each minute boundary so the display flips on time.
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      const d = new Date()
      setNow(d)
      setDate(fmtDate())
      id = setTimeout(
        tick,
        60_000 - d.getSeconds() * 1000 - d.getMilliseconds(),
      )
    }
    tick()
    // Each theme has its own day, so follow theme switches too, and the
    // choice in Settings between that day and today.
    const update = () => setDate(fmtDate())
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    const unsubscribe = subscribeClockMode(update)
    return () => {
      clearTimeout(id)
      observer.disconnect()
      unsubscribe()
    }
  }, [])
  const shown = useFlip(date)
  if (!now) return <span className="mx-[10px] inline-block w-40" />
  return (
    <button
      type="button"
      onClick={() => raise('settings')}
      // Named by the settled date, not the letters flicking through.
      aria-label={`${date} ${fmtTime(now)}, Date & Time settings`}
      className="flex h-full cursor-pointer items-center gap-3 px-[10px] font-(family-name:--font-label) [font-weight:var(--label-weight)] tracking-(--label-tracking) [text-transform:var(--label-case)] -outline-offset-4 outline-current outline-dotted not-focus-visible:outline-none active:bg-(--accent) active:text-(--on-accent)"
    >
      <span className="whitespace-pre tabular-nums">{shown}</span>
      <span className="tabular-nums">{fmtTime(now)}</span>
    </button>
  )
}
