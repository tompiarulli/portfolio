import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { channels } from '#/lib/site'
import { renderDesktop, windowEl } from '#/test/desktop'

vi.mock('#/components/Backdrop', () => ({ Backdrop: () => null }))

// Footage for the first channel, so there are clips to skip through: two
// videos with a photo between them. It has something to say under Info.
vi.mock('#/lib/site', async (load) => {
  const site = await load<typeof import('#/lib/site')>()
  const [first, ...rest] = site.channels
  return {
    ...site,
    channels: [
      {
        ...first!,
        about: ['A place worth the trip.'],
        clips: ['a.mp4', 'b.webp', 'c.mp4'].map((n) => ({
          src: n,
          still: n.endsWith('.webp'),
        })),
      },
      ...rest,
    ],
  }
})

/** The clip on screen, once the page has loaded and clips are attached:
 *  a video, labelled with its place, or a photo, described by it. */
const clip = () =>
  waitFor(() => {
    const place = new RegExp(`^${channels[0]!.place}`)
    const el = screen.queryByLabelText(place) ?? screen.getByAltText(place)
    return el.getAttribute('src')
  })

/** The key naming the channel on, which opens the list. */
const picker = () => screen.findByRole('button', { name: /^Channel: / })
const key = (name: string) => screen.getByRole('button', { name })
const on = async () => (await picker()).getAttribute('aria-label')

describe('Travel', () => {
  // Clips are dealt in a random order; near 1, the deal leaves them as
  // they are.
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.9999))
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('opens on the one channel with footage, with a list of every place', async () => {
    const { user } = await renderDesktop('/')
    expect(await on()).toBe(`Channel: ${channels[0]!.place}`)
    await user.click(await picker())
    const items = screen.getAllByRole('menuitemradio')
    expect(items.map((i) => i.textContent)).toEqual(
      channels.map(
        (c, i) => `${String(i + 1).padStart(2, '0')}${c.place}${c.region}`,
      ),
    )
    expect(items[0]!.getAttribute('aria-checked')).toBe('true')
    await waitFor(() => expect(document.activeElement).toBe(items[0]))
  })

  it('comes on at a random channel with footage', async () => {
    // Footage on the third as well, which a pick near 1 lands on.
    const third = channels[2]!
    const empty = third.clips
    third.clips = [{ src: 'd.mp4' }]
    try {
      await renderDesktop('/')
      await waitFor(async () =>
        expect(await on()).toBe(`Channel: ${third.place}`),
      )
    } finally {
      third.clips = empty
    }
  })

  it('steps through the channels, wrapping at the ends', async () => {
    const { user } = await renderDesktop('/')
    await picker()
    await user.click(key('Previous channel'))
    expect(await on()).toBe(`Channel: ${channels.at(-1)!.place}`)
    await user.click(key('Next channel'))
    expect(await on()).toBe(`Channel: ${channels[0]!.place}`)
  })

  it('tunes a channel picked from the list, from the keyboard', async () => {
    const { user } = await renderDesktop('/')
    const button = await picker()
    await user.click(button)
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(screen.queryByRole('menu', { name: 'Channels' })).toBeNull()
    expect(await on()).toBe(`Channel: ${channels[2]!.place}`)
    expect(document.activeElement).toBe(button)
  })

  it('says what the place is under Info, closing on Escape', async () => {
    const { user } = await renderDesktop('/')
    const info = await screen.findByRole('button', { name: 'Info' })
    await user.click(info)
    const panel = screen.getByRole('region', {
      name: `About ${channels[0]!.place}`,
    })
    expect(panel.textContent).toContain(channels[0]!.about![0])
    expect(info.getAttribute('aria-expanded')).toBe('true')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: /^About / })).toBeNull()
    expect(screen.getByRole('region', { name: 'Travel' })).toBeTruthy()
    expect(document.activeElement).toBe(info)
  })

  it('turns Info off for a place with nothing to say', async () => {
    const { user } = await renderDesktop('/')
    await user.click(await screen.findByRole('button', { name: 'Info' }))
    await user.click(key('Next channel'))
    expect(key('Info')).toHaveProperty('disabled', true)
    expect(screen.queryByRole('region', { name: /^About / })).toBeNull()
  })

  it('closes the list on Escape without closing the window', async () => {
    const { user } = await renderDesktop('/')
    await user.click(await picker())
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: 'Channels' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Travel' })).toBeTruthy()
  })

  it('skips through the clips, round the channel', async () => {
    const { user } = await renderDesktop('/')
    expect(await clip()).toMatch(/a\.mp4$/)
    expect(screen.getByText('a.mp4')).toBeTruthy()
    expect(screen.getByText('1/3')).toBeTruthy()
    await user.click(key('Next clip'))
    expect(await clip()).toMatch(/b\.webp$/)
    expect(screen.getByText('2/3')).toBeTruthy()
    await user.click(key('Previous clip'))
    await user.click(key('Previous clip'))
    expect(await clip()).toMatch(/c\.mp4$/)
  })

  it('deals the clips in a new order each time the channel is tuned', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { user } = await renderDesktop('/')
    // At 0, each clip swaps with the first: b, c, a.
    expect(await clip()).toMatch(/b\.webp$/)
    expect(screen.getByText('1/3')).toBeTruthy()
    await user.click(key('Next clip'))
    expect(await clip()).toMatch(/c\.mp4$/)
    await user.click(key('Next channel'))
    vi.spyOn(Math, 'random').mockReturnValue(0.9999)
    await user.click(key('Previous channel'))
    expect(await clip()).toMatch(/a\.mp4$/)
  })

  it('holds a photo for a few seconds of play, then moves on', async () => {
    const { user } = await renderDesktop('/')
    await screen.findByRole('button', { name: 'Pause' })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(key('Next clip'))
    const place = new RegExp(`^${channels[0]!.place}`)
    expect((await screen.findByRole('img', { name: place })).tagName).toBe(
      'IMG',
    )
    // Paused, it stays.
    await user.click(key('Pause'))
    act(() => vi.advanceTimersByTime(10_000))
    expect(await clip()).toMatch(/b\.webp$/)
    await user.click(key('Play'))
    act(() => vi.advanceTimersByTime(5000))
    expect(await clip()).toMatch(/c\.mp4$/)
  })

  it('starts a channel on its first clip', async () => {
    const { user } = await renderDesktop('/')
    await clip()
    await user.click(key('Next clip'))
    await user.click(key('Next channel'))
    // No footage there: a test card, and nothing to skip.
    expect(key('Next clip')).toHaveProperty('disabled', true)
    expect(screen.getByText('No signal')).toBeTruthy()
    await user.click(key('Previous channel'))
    expect(await clip()).toMatch(/a\.mp4$/)
  })

  it('plays and pauses with Space while the window has the focus', async () => {
    const { user } = await renderDesktop('/')
    // It starts playing once the page has loaded.
    await screen.findByRole('button', { name: 'Pause' })
    act(() => windowEl('player').focus())
    await user.keyboard(' ')
    expect(key('Play')).toBeTruthy()
    await user.keyboard(' ')
    expect(key('Pause')).toBeTruthy()
  })

  it('leaves Space to the control that has the focus', async () => {
    const { user } = await renderDesktop('/')
    await screen.findByRole('button', { name: 'Pause' })
    const before = await on()
    act(() => key('Next channel').focus())
    await user.keyboard(' ')
    expect(await on()).not.toBe(before)
    expect(key('Pause')).toBeTruthy()
  })

  it('shuffles to any channel but the one on', async () => {
    const { user } = await renderDesktop('/')
    await picker()
    for (const r of [0, 0.5, 0.999]) {
      vi.spyOn(Math, 'random').mockReturnValue(r)
      const before = await on()
      await user.click(key('Shuffle'))
      expect(await on()).not.toBe(before)
    }
  })
})
