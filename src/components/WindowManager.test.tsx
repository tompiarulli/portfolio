import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { dockLink, renderDesktop, windowEl, windowOrder } from '#/test/desktop'

vi.mock('#/components/Backdrop', () => ({ Backdrop: () => null }))

const closeBox = (title: string) =>
  screen.getByRole('button', { name: `Close ${title}` })

describe('window manager', () => {
  describe('on load', () => {
    it('opens About in front of Contact at /', async () => {
      await renderDesktop('/')
      expect(windowOrder()).toEqual(['about', 'contact'])
      expect(dockLink('about').getAttribute('aria-current')).toBe('page')
      expect(dockLink('contact').getAttribute('aria-current')).toBeNull()
    })

    it("opens the URL's window in front", async () => {
      await renderDesktop('/terminal')
      await screen.findByRole('region', { name: 'Terminal' })
      expect(windowOrder()).toEqual(['terminal', 'about', 'contact'])
    })

    it('opens File Not Found for an unknown URL', async () => {
      // It reads the path from the page's own address.
      history.replaceState(null, '', '/nope')
      await renderDesktop('/nope')
      expect(windowOrder()).toEqual(['notfound', 'about', 'contact'])
      expect(windowEl('notfound').textContent).toContain('/nope')
      history.replaceState(null, '', '/')
    })

    it('leaves focus where the page put it', async () => {
      await renderDesktop('/contact')
      expect(document.activeElement).toBe(document.body)
    })

    it('stacks windows by z-index, front highest', async () => {
      await renderDesktop('/')
      expect(windowEl('about').style.zIndex).toBe('2')
      expect(windowEl('contact').style.zIndex).toBe('1')
    })
  })

  describe('opening and raising', () => {
    it('opens a closed window from the dock, focused, with its URL', async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(dockLink('terminal'))
      const input = await screen.findByRole('textbox', {
        name: 'Terminal input',
      })
      expect(windowOrder()).toEqual(['terminal', 'about', 'contact'])
      expect(pathname()).toBe('/terminal')
      // The prompt is marked to take focus over the window itself.
      await waitFor(() => expect(document.activeElement).toBe(input))
    })

    it('raises a window behind when it is pressed, and points the URL at it', async () => {
      const { pathname } = await renderDesktop('/')
      fireEvent.pointerDown(windowEl('contact'))
      await waitFor(() => expect(pathname()).toBe('/contact'))
      expect(windowOrder()).toEqual(['contact', 'about'])
      expect(document.activeElement).toBe(windowEl('contact'))
      expect(dockLink('contact').getAttribute('aria-current')).toBe('page')
    })

    it('raises a window behind from the dock', async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(dockLink('contact'))
      await waitFor(() => expect(windowOrder()).toEqual(['contact', 'about']))
      expect(pathname()).toBe('/contact')
    })

    it('keeps one window per app', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('contact'))
      await user.click(dockLink('about'))
      await user.click(dockLink('contact'))
      expect(windowOrder()).toEqual(['contact', 'about'])
    })
  })

  describe('closing', () => {
    it('closes the front window and hands focus and the URL to the next', async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(closeBox('About'))
      expect(windowOrder()).toEqual(['contact'])
      await waitFor(() => expect(pathname()).toBe('/contact'))
      expect(document.activeElement).toBe(windowEl('contact'))
    })

    it('closes a window behind without raising it or moving the URL', async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(closeBox('Contact'))
      expect(windowOrder()).toEqual(['about'])
      expect(pathname()).toBe('/')
    })

    it('goes home with nothing open after the last window closes', async () => {
      const { user, pathname } = await renderDesktop('/contact')
      await user.click(closeBox('Contact'))
      await user.click(closeBox('About'))
      expect(windowOrder()).toEqual([])
      // Nothing reopens About, though the URL is now its own.
      await waitFor(() => expect(pathname()).toBe('/'))
      expect(windowOrder()).toEqual([])
    })

    it('moves focus to the dock once no window is left', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('Contact'))
      await user.click(closeBox('About'))
      await waitFor(() =>
        expect(document.activeElement).toBe(dockLink('about')),
      )
    })

    it('closes the window holding focus on Escape', async () => {
      const { user, pathname } = await renderDesktop('/')
      const link = windowEl('contact').querySelector('a')
      act(() => link?.focus())
      await user.keyboard('{Escape}')
      expect(windowOrder()).toEqual(['about'])
      expect(pathname()).toBe('/')
      expect(document.activeElement).toBe(windowEl('about'))
    })

    it('closes only the innermost window on Escape', async () => {
      const { user } = await renderDesktop('/terminal')
      const input = await screen.findByRole('textbox', {
        name: 'Terminal input',
      })
      act(() => input.focus())
      await user.keyboard('{Escape}')
      expect(windowOrder()).toEqual(['about', 'contact'])
    })

    it('ignores an Escape something inside already handled', async () => {
      await renderDesktop('/')
      const link = windowEl('about').querySelector('p') ?? windowEl('about')
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      event.preventDefault()
      act(() => void link.dispatchEvent(event))
      expect(windowOrder()).toEqual(['about', 'contact'])
    })

    it('closes File Not Found with OK and goes to the next window', async () => {
      const { user, pathname } = await renderDesktop('/nope')
      await user.click(screen.getByRole('link', { name: 'OK' }))
      expect(windowOrder()).toEqual(['about', 'contact'])
      await waitFor(() => expect(pathname()).toBe('/'))
    })
  })

  describe('minimizing', () => {
    it("hides the front window into its dock icon when the icon's pressed", async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(dockLink('about'))
      // Still mounted, keeping its place, but out of sight and at the back.
      await waitFor(() =>
        expect(windowEl('about').style.visibility).toBe('hidden'),
      )
      expect(windowOrder()).toEqual(['contact', 'about'])
      expect(dockLink('about').textContent).toContain('minimized')
      expect(dockLink('contact').getAttribute('aria-current')).toBe('page')
      await waitFor(() => expect(pathname()).toBe('/contact'))
      expect(document.activeElement).toBe(windowEl('contact'))
    })

    it('brings a minimized window back from the dock', async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(dockLink('about'))
      await waitFor(() => expect(pathname()).toBe('/contact'))
      await user.click(dockLink('about'))
      await waitFor(() => expect(pathname()).toBe('/'))
      expect(windowOrder()).toEqual(['about', 'contact'])
      expect(windowEl('about').style.visibility).toBe('')
      expect(dockLink('about').textContent).not.toContain('minimized')
    })

    it('stays home when the last visible window is minimized', async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(closeBox('Contact'))
      await user.click(dockLink('about'))
      await waitFor(() =>
        expect(windowEl('about').style.visibility).toBe('hidden'),
      )
      expect(pathname()).toBe('/')
      expect(windowOrder()).toEqual(['about'])
    })
  })

  describe('URL', () => {
    it('opens and focuses the window a new URL points at', async () => {
      const { router } = await renderDesktop('/')
      await act(() => router.navigate({ to: '/system' }))
      const system = await screen.findByRole('region', { name: 'System Info' })
      expect(windowOrder()[0]).toBe('system')
      await waitFor(() => expect(document.activeElement).toBe(system))
    })

    it('follows back and forward', async () => {
      const { user, router, pathname } = await renderDesktop('/')
      await user.click(dockLink('terminal'))
      await screen.findByRole('region', { name: 'Terminal' })
      act(() => router.history.back())
      await waitFor(() => expect(pathname()).toBe('/'))
      await waitFor(() => expect(windowOrder()[0]).toBe('about'))
      await waitFor(() =>
        expect(document.activeElement).toBe(windowEl('about')),
      )
      act(() => router.history.forward())
      await waitFor(() => expect(windowOrder()[0]).toBe('terminal'))
    })

    it('replaces the history entry when focus moves between windows', async () => {
      const { router, pathname } = await renderDesktop('/')
      const length = router.history.length
      fireEvent.pointerDown(windowEl('contact'))
      await waitFor(() => expect(pathname()).toBe('/contact'))
      expect(router.history.length).toBe(length)
    })
  })

  describe('keyboard focus', () => {
    it('draws a window behind on top while it holds focus, without restacking', async () => {
      await renderDesktop('/')
      const link = windowEl('contact').querySelector('a')
      act(() => link?.focus())
      expect(windowEl('contact').style.zIndex).toBe('3')
      expect(windowOrder()).toEqual(['about', 'contact'])
      act(() => windowEl('about').focus())
      expect(windowEl('contact').style.zIndex).toBe('1')
    })

    it('moves a window with the arrow keys on its title', async () => {
      const { user } = await renderDesktop('/')
      const title = screen.getByRole('button', { name: 'About' })
      act(() => title.focus())
      await user.keyboard('{ArrowRight}')
      expect(windowEl('about').style.transform).toBe(
        'translate3d(10px, 0px, 0)',
      )
      // jsdom has no layout, so every move starts from the corner.
      await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
      expect(windowEl('about').style.transform).toBe(
        'translate3d(0px, 50px, 0)',
      )
      // Kept on screen.
      await user.keyboard('{ArrowLeft}')
      expect(windowEl('about').style.transform).toBe('translate3d(0px, 0px, 0)')
    })

    it('rolls a window up with Enter on its title', async () => {
      const { user } = await renderDesktop('/')
      const title = screen.getByRole('button', { name: 'About' })
      act(() => title.focus())
      await user.keyboard('{Enter}')
      expect(title.getAttribute('aria-expanded')).toBe('false')
      await user.keyboard('{Enter}')
      expect(title.getAttribute('aria-expanded')).toBe('true')
    })
  })
})
