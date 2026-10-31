import type { WorkEntry } from '#/lib/site'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** When something ran, first and last month as `YYYY-MM`, or year as
 *  `YYYY` where the month isn't known. */
export type Span = Pick<WorkEntry, 'start' | 'end'>

// `Jul 2023`, or the year alone.
const label = (ym: string) => {
  const [y, m] = ym.split('-')
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y!
}

/** When it ran, as LinkedIn says it: `Jul 2023 – Sep 2026`, or
 *  `2014 – 2016` by year. */
export const dates = (s: Span) => `${label(s.start)} – ${label(s.end)}`

/** Its years, as a list column shows them: `2023–2026`, or one year. */
export function years(s: Span) {
  const [a, z] = [s.start, s.end].map((ym) => ym.slice(0, 4))
  return a === z ? a! : `${a}–${z}`
}

export type Company = {
  company: string
  /** Its roles, by their place in the list, in the list's order. */
  roles: number[]
  /** From its first role's start to its last's end. */
  span: Span
}

/** Runs of roles at one company, in the order the roles are listed. */
export function companies(work: WorkEntry[]): Company[] {
  const out: Company[] = []
  work.forEach((w, i) => {
    const last = out.at(-1)
    if (last?.company === w.company) last.roles.push(i)
    else out.push({ company: w.company, roles: [i], span: w })
  })
  return out.map((c) => {
    const spans = c.roles.map((i) => work[i]!)
    const by = (pick: (s: Span) => string) => spans.map(pick).sort()
    return {
      ...c,
      span: { start: by((s) => s.start)[0]!, end: by((s) => s.end).at(-1)! },
    }
  })
}
