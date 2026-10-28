import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { channels } from '#/lib/site'
import { renderDesktop, windowEl } from '#/test/desktop'

vi.mock('#/components/Backdrop', () => ({ Backdrop: () => null }))

// Footage for the first channel, so there are clips to skip through.
vi.mock('#/lib/site', async (load) => {
  const site = await load<typeof import('#/lib/site')>()
  const [first, ...rest] = site.channels
  return {
    ...site,
    channels: [
      {
        ...first!,
        clips: ['a', 'b', 'c'].map((n) => ({
          src: `https://x.public.blob.vercel-storage.com/${n}.mp4`,
        })),
      },
      ...rest,
    ],
  }
})

/** The clip on screen, once the page has loaded and clips are attached. */
const clip = async () =>
  (await screen.findByLabelText(/^Lisbon/)).getAttribute('src')

/** The key naming the channel on, which opens the list. */
const picker = () => screen.findByRole('button', { name: /^Channel: / })
const key = (name: string) => screen.getByRole('button', { name })
const on = async () => (await picker()).getAttribute('aria-label')

describe('Travel', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens on the first channel, with a list of every place', async () => {
    const { user } = await renderDesktop('/')
    expect(await on()).toBe(`Channel: ${channels[0]!.place}`)
    await user.click(await picker())
    const items = screen.getAllByRole('menuitemradio')
    expect(items.map((i) => i.textContent)).toEqual(
      channels.map(
        (c, i) => `${String(i + 1).padStart(2, '0')}${c.place}${c.country}`,
      ),
    )
    expect(items[0]!.getAttribute('aria-checked')).toBe('true')
    await waitFor(() => expect(document.activeElement).toBe(items[0]))
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
    expect(await clip()).toMatch(/b\.mp4$/)
    expect(screen.getByText('2/3')).toBeTruthy()
    await user.click(key('Previous clip'))
    await user.click(key('Previous clip'))
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
    act(() => key('Shuffle').focus())
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
