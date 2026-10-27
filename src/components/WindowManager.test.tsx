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
      expect(dockLink('about').getAttribute('aria-current')).toBe('true')
      expect(dockLink('contact').getAttribute('aria-current')).toBeNull()
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
      await renderDesktop('/')
      expect(document.activeElement).toBe(document.body)
    })

    it('stacks windows by z-index, front highest', async () => {
      await renderDesktop('/')
      expect(windowEl('about').style.zIndex).toBe('2')
      expect(windowEl('contact').style.zIndex).toBe('1')
    })
  })

  describe('opening and raising', () => {
    it('opens each window one slot below the last one opened', async () => {
      const { user } = await renderDesktop('/')
      const slot = (id: Parameters<typeof windowEl>[0]) =>
        windowEl(id).style.getPropertyValue('--slot')
      const openSystemInfo = async () => {
        await user.click(screen.getByRole('button', { name: 'System menu' }))
        await user.click(screen.getByRole('menuitem', { name: 'System Info' }))
        await screen.findByRole('region', { name: 'System Info' })
      }
      expect([slot('contact'), slot('about')]).toEqual(['0', '1'])
      // Out of the usual order: System Info before Terminal.
      await openSystemInfo()
      await user.click(dockLink('terminal'))
      await screen.findByRole('region', { name: 'Terminal' })
      expect([slot('system'), slot('terminal')]).toEqual(['2', '3'])
      // Raising keeps a window's slot; reopening takes the next one.
      await openSystemInfo()
      expect(slot('system')).toBe('2')
      await user.click(
        screen.getByRole('button', { name: 'Close System Info' }),
      )
      await openSystemInfo()
      expect(slot('system')).toBe('4')
    })

    it('opens Work from the dock, with its link to LinkedIn', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('work'))
      const link = await screen.findByRole('link', {
        name: 'Full work history on LinkedIn',
      })
      expect(windowOrder()).toEqual(['work', 'about', 'contact'])
      expect(link.getAttribute('href')).toBe(
        'https://www.linkedin.com/in/tompiarulli/',
      )
    })

    it('opens a closed window from the dock, focused', async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(dockLink('terminal'))
      const input = await screen.findByRole('textbox', {
        name: 'Terminal input',
      })
      expect(windowOrder()).toEqual(['terminal', 'about', 'contact'])
      expect(pathname()).toBe('/')
      // The prompt is marked to take focus over the window itself.
      await waitFor(() => expect(document.activeElement).toBe(input))
    })

    it('raises a window behind when it is pressed', async () => {
      await renderDesktop('/')
      fireEvent.pointerDown(windowEl('contact'))
      await waitFor(() => expect(windowOrder()).toEqual(['contact', 'about']))
      expect(document.activeElement).toBe(windowEl('contact'))
      expect(dockLink('contact').getAttribute('aria-current')).toBe('true')
    })

    it('raises a window behind from the dock', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('contact'))
      await waitFor(() => expect(windowOrder()).toEqual(['contact', 'about']))
      expect(document.activeElement).toBe(windowEl('contact'))
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
    it('closes the front window and hands focus to the next', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('About'))
      expect(windowOrder()).toEqual(['contact'])
      await waitFor(() =>
        expect(document.activeElement).toBe(windowEl('contact')),
      )
    })

    it('closes a window behind without raising it', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('Contact'))
      expect(windowOrder()).toEqual(['about'])
    })

    it('leaves the desktop empty after the last window closes', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('Contact'))
      await user.click(closeBox('About'))
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
      const { user } = await renderDesktop('/')
      // Contact's title, the handle that moves it.
      act(() => screen.getByRole('button', { name: 'Contact' }).focus())
      await user.keyboard('{Escape}')
      expect(windowOrder()).toEqual(['about'])
      expect(document.activeElement).toBe(windowEl('about'))
    })

    it('closes only the innermost window on Escape', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('terminal'))
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

    it('closes File Not Found with OK and moves the URL home', async () => {
      const { user, router, pathname } = await renderDesktop('/nope')
      const length = router.history.length
      await user.click(screen.getByRole('link', { name: 'OK' }))
      expect(windowOrder()).toEqual(['about', 'contact'])
      await waitFor(() => expect(pathname()).toBe('/'))
      // Replaced, so Back doesn't return to the bad URL.
      expect(router.history.length).toBe(length)
    })
  })

  describe('minimizing', () => {
    it("hides the front window into its dock key when the key's pressed", async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('about'))
      // Still mounted and in its place, so nothing moves in the DOM, but
      // out of sight, with the next window focused.
      await waitFor(() =>
        expect(windowEl('about').style.visibility).toBe('hidden'),
      )
      expect(windowOrder()).toEqual(['about', 'contact'])
      expect(dockLink('about').textContent).toContain('minimized')
      expect(dockLink('about').getAttribute('aria-current')).toBeNull()
      expect(dockLink('contact').getAttribute('aria-current')).toBe('true')
      // Focus stays on the key that was pressed, so the dock can be worked
      // from the keyboard without being thrown into a window.
      expect(document.activeElement).toBe(dockLink('about'))
    })

    it('brings a minimized window back from the dock', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('about'))
      await user.click(dockLink('contact'))
      await user.click(dockLink('about'))
      await waitFor(() => expect(windowOrder()).toEqual(['about', 'contact']))
      expect(windowEl('about').style.visibility).toBe('')
      expect(dockLink('about').textContent).not.toContain('minimized')
      expect(dockLink('about').getAttribute('aria-current')).toBe('true')
    })

    it('keeps the last visible window mounted when it is minimized', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('Contact'))
      await user.click(dockLink('about'))
      await waitFor(() =>
        expect(windowEl('about').style.visibility).toBe('hidden'),
      )
      expect(windowOrder()).toEqual(['about'])
      expect(dockLink('about').getAttribute('aria-current')).toBeNull()
    })

    it('closes a window behind and focuses the one in front, skipping minimized ones', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('terminal'))
      await screen.findByRole('region', { name: 'Terminal' })
      await user.click(dockLink('terminal'))
      await user.click(closeBox('About'))
      await waitFor(() =>
        expect(document.activeElement).toBe(windowEl('contact')),
      )
    })
  })

  describe('URL', () => {
    it('stays on / and adds no history as windows open, close and minimize', async () => {
      const { user, router, pathname } = await renderDesktop('/')
      const length = router.history.length
      await user.click(dockLink('terminal'))
      await screen.findByRole('region', { name: 'Terminal' })
      fireEvent.pointerDown(windowEl('contact'))
      await user.click(dockLink('contact'))
      await user.click(closeBox('About'))
      await user.click(dockLink('contact'))
      expect(pathname()).toBe('/')
      expect(router.history.length).toBe(length)
    })

    it('opens System Info from the menu without a URL of its own', async () => {
      const { user, pathname } = await renderDesktop('/')
      await user.click(screen.getByRole('button', { name: 'System menu' }))
      await user.click(screen.getByRole('menuitem', { name: 'System Info' }))
      const system = await screen.findByRole('region', { name: 'System Info' })
      expect(windowOrder()[0]).toBe('system')
      await waitFor(() => expect(document.activeElement).toBe(system))
      expect(pathname()).toBe('/')
    })
  })

  describe('keyboard focus', () => {
    it('draws a window behind on top while it holds focus, without restacking', async () => {
      await renderDesktop('/')
      // Contact's title, the handle that moves it.
      act(() => screen.getByRole('button', { name: 'Contact' }).focus())
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
