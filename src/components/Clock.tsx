import { useEffect, useState } from 'react'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split(' ')

function fmtTime(d: Date) {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "WED 31 MAR 1999". */
function fmtDate(d: Date) {
  const day = String(d.getDate()).padStart(2, '0')
  return `${DAYS[d.getDay()]} ${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Renders empty on the server so prerendered HTML never bakes in a stale time. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    // Tick on each minute boundary so the display flips on time.
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      const d = new Date()
      setNow(d)
      id = setTimeout(
        tick,
        60_000 - d.getSeconds() * 1000 - d.getMilliseconds(),
      )
    }
    tick()
    return () => clearTimeout(id)
  }, [])
  if (!now) return <span className="inline-block w-40" />
  return (
    <span className="flex items-center gap-3 py-[3px] font-title tracking-tight [text-transform:var(--label-case)] [font-weight:var(--label-weight)]">
      <span className="tabular-nums">{fmtDate(now)}</span>
      <span className="tabular-nums">{fmtTime(now)}</span>
    </span>
  )
}
