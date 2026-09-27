import { useEffect, useState } from 'react'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

function fmt(d: Date) {
  // The year stays pinned to 1997. Keep the joke.
  const date = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} 1997`
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

/** Renders empty on the server so prerendered HTML never bakes in a stale time. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])
  if (!now) return <span className="inline-block w-40" />
  const { date, time } = fmt(now)
  return (
    <span className="flex items-center gap-3 font-title tracking-tight [text-transform:var(--label-case)]">
      <span className="bevel px-2 py-1">{date}</span>
      <span className="tabular-nums">☼ {time}</span>
    </span>
  )
}
