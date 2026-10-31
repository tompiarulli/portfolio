import { describe, expect, it } from 'vitest'

import type { WorkEntry } from '#/lib/site'
import { companies, dates, years } from '#/lib/work'

const role = (company: string, start: string, end: string): WorkEntry => ({
  company,
  role: 'Role',
  start,
  end,
  summary: '',
  highlights: [],
})

describe('work', () => {
  it('says when, as LinkedIn does', () => {
    expect(dates(role('A', '2023-07', '2026-09'))).toBe('Jul 2023 – Sep 2026')
  })

  it('says the years where the month is not known', () => {
    expect(dates(role('A', '2014', '2016'))).toBe('2014 – 2016')
  })

  it('gives the years for a list column', () => {
    expect(years(role('A', '2023-07', '2026-09'))).toBe('2023–2026')
    expect(years(role('A', '2020-01', '2020-12'))).toBe('2020')
  })

  it('groups a run of roles at one company, spanning them all', () => {
    const list = companies([
      role('A', '2023-01', '2026-09'),
      role('A', '2020-01', '2022-12'),
      role('B', '2019-07', '2020-01'),
      role('A', '2015-01', '2015-06'),
    ])
    expect(list.map((c) => [c.company, c.roles])).toEqual([
      ['A', [0, 1]],
      ['B', [2]],
      ['A', [3]],
    ])
    expect(list[0]?.span).toEqual({ start: '2020-01', end: '2026-09' })
  })
})
