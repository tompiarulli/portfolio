import { useEffect, useRef, useState } from 'react'
import { THEMES, currentTheme } from '#/lib/theme'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split(' ')
const DIGITS = '0123456789'
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function fmtTime(d: Date) {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "WED 31 MAR 1999": the theme's fixed day if it has one, else today. */
function fmtDate(now: Date) {
  const fixed = THEMES.find((t) => t.id === currentTheme())
  const iso = fixed && 'date' in fixed ? fixed.date : undefined
  const d = iso ? new Date(`${iso}T12:00:00`) : now
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

/** Renders empty on the server so prerendered HTML never bakes in a stale time. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null)
  const [date, setDate] = useState('')
  useEffect(() => {
    // Tick on each minute boundary so the display flips on time.
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      const d = new Date()
      setNow(d)
      setDate(fmtDate(d))
      id = setTimeout(
        tick,
        60_000 - d.getSeconds() * 1000 - d.getMilliseconds(),
      )
    }
    tick()
    // Themes can pin their own day, so follow theme switches too.
    const observer = new MutationObserver(() => setDate(fmtDate(new Date())))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => {
      clearTimeout(id)
      observer.disconnect()
    }
  }, [])
  const shown = useFlip(date)
  if (!now) return <span className="inline-block w-40" />
  return (
    <span className="flex items-center gap-3 font-title tracking-tight [text-transform:var(--label-case)] [font-weight:var(--label-weight)]">
      <span className="whitespace-pre tabular-nums">{shown}</span>
      <span className="tabular-nums">{fmtTime(now)}</span>
    </span>
  )
}
