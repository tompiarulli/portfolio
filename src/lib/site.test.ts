import { describe, expect, it } from 'vitest'

import { channels } from '#/lib/site'

describe('channels', () => {
  it("open on All Places, which plays every other channel's clips", () => {
    const [first, ...rest] = channels
    expect(first!.place).toBe('All Places')
    const srcs = (clips: { src: string }[]) => clips.map((c) => c.src).sort()
    expect(srcs(first!.clips)).toEqual(srcs(rest.flatMap((c) => c.clips)))
  })
})
