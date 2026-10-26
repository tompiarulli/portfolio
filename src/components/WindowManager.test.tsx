import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { dockLink, renderDesktop, windowEl, windowOrder } from '#/test/desktop'

vi.mock('#/components/Backdrop', () => ({ Backdrop: () => null }))

const closeBox = (title: string) =>
  screen.getByRole('button', { name: `Close ${title}` })

describe('window manager', () => {
  describe('on load', () => {
    it('opens Contact in front of About at /', async () => {
      await renderDesktop('/')
      expect(windowOrder()).toEqual(['contact', 'about'])
      expect(dockLink('contact').getAttribute('aria-current')).toBe('true')
      expect(dockLink('about').getAttribute('aria-current')).toBeNull()
    })

    it('opens File Not Found for an unknown URL', async () => {
      // It reads the path from the page's own address.
      history.replaceState(null, '', '/nope')
      await renderDesktop('/nope')
      expect(windowOrder()).toEqual(['notfound', 'contact', 'about'])
      expect(windowEl('notfound').textContent).toContain('/nope')
      history.replaceState(null, '', '/')
    })

    it('leaves focus where the page put it', async () => {
      await renderDesktop('/')
      expect(document.activeElement).toBe(document.body)
    })

    it('stacks windows by z-index, front highest', async () => {
      await renderDesktop('/')
      expect(windowEl('contact').style.zIndex).toBe('2')
      expect(windowEl('about').style.zIndex).toBe('1')
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
      expect([slot('about'), slot('contact')]).toEqual(['0', '1'])
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
      expect(windowOrder()).toEqual(['work', 'contact', 'about'])
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
      expect(windowOrder()).toEqual(['terminal', 'contact', 'about'])
      expect(pathname()).toBe('/')
      // The prompt is marked to take focus over the window itself.
      await waitFor(() => expect(document.activeElement).toBe(input))
    })

    it('raises a window behind when it is pressed', async () => {
      await renderDesktop('/')
      fireEvent.pointerDown(windowEl('about'))
      await waitFor(() => expect(windowOrder()).toEqual(['about', 'contact']))
      expect(document.activeElement).toBe(windowEl('about'))
      expect(dockLink('about').getAttribute('aria-current')).toBe('true')
    })

    it('raises a window behind from the dock', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('about'))
      await waitFor(() => expect(windowOrder()).toEqual(['about', 'contact']))
      expect(document.activeElement).toBe(windowEl('about'))
    })

    it('keeps one window per app', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('about'))
      await user.click(dockLink('contact'))
      await user.click(dockLink('about'))
      expect(windowOrder()).toEqual(['about', 'contact'])
    })
  })

  describe('closing', () => {
    it('closes the front window and hands focus to the next', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('Contact'))
      expect(windowOrder()).toEqual(['about'])
      await waitFor(() =>
        expect(document.activeElement).toBe(windowEl('about')),
      )
    })

    it('closes a window behind without raising it', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('About'))
      expect(windowOrder()).toEqual(['contact'])
    })

    it('leaves the desktop empty after the last window closes', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('About'))
      await user.click(closeBox('Contact'))
      expect(windowOrder()).toEqual([])
    })

    it('moves focus to the dock once no window is left', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('About'))
      await user.click(closeBox('Contact'))
      await waitFor(() =>
        expect(document.activeElement).toBe(dockLink('contact')),
      )
    })

    it('closes the window holding focus on Escape', async () => {
      const { user } = await renderDesktop('/')
      // About's title, the handle that moves it.
      act(() => screen.getByRole('button', { name: 'About' }).focus())
      await user.keyboard('{Escape}')
      expect(windowOrder()).toEqual(['contact'])
      expect(document.activeElement).toBe(windowEl('contact'))
    })

    it('closes only the innermost window on Escape', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('terminal'))
      const input = await screen.findByRole('textbox', {
        name: 'Terminal input',
      })
      act(() => input.focus())
      await user.keyboard('{Escape}')
      expect(windowOrder()).toEqual(['contact', 'about'])
    })

    it('ignores an Escape something inside already handled', async () => {
      await renderDesktop('/')
      const link = windowEl('contact').querySelector('p') ?? windowEl('contact')
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      event.preventDefault()
      act(() => void link.dispatchEvent(event))
      expect(windowOrder()).toEqual(['contact', 'about'])
    })

    it('closes File Not Found with OK and moves the URL home', async () => {
      const { user, router, pathname } = await renderDesktop('/nope')
      const length = router.history.length
      await user.click(screen.getByRole('link', { name: 'OK' }))
      expect(windowOrder()).toEqual(['contact', 'about'])
      await waitFor(() => expect(pathname()).toBe('/'))
      // Replaced, so Back doesn't return to the bad URL.
      expect(router.history.length).toBe(length)
    })
  })

  describe('minimizing', () => {
    it("hides the front window into its dock icon when the icon's pressed", async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('contact'))
      // Still mounted, keeping its place, but out of sight and at the back.
      await waitFor(() =>
        expect(windowEl('contact').style.visibility).toBe('hidden'),
      )
      expect(windowOrder()).toEqual(['about', 'contact'])
      expect(dockLink('contact').textContent).toContain('minimized')
      expect(dockLink('about').getAttribute('aria-current')).toBe('true')
      // Focus stays on the icon that was pressed, so the dock can be worked
      // from the keyboard without being thrown into a window.
      expect(document.activeElement).toBe(dockLink('contact'))
    })

    it('brings a minimized window back from the dock', async () => {
      const { user } = await renderDesktop('/')
      await user.click(dockLink('contact'))
      await waitFor(() =>
        expect(windowEl('contact').style.visibility).toBe('hidden'),
      )
      await user.click(dockLink('contact'))
      await waitFor(() => expect(windowOrder()).toEqual(['contact', 'about']))
      expect(windowEl('contact').style.visibility).toBe('')
      expect(dockLink('contact').textContent).not.toContain('minimized')
    })

    it('keeps the last visible window mounted when it is minimized', async () => {
      const { user } = await renderDesktop('/')
      await user.click(closeBox('About'))
      await user.click(dockLink('contact'))
      await waitFor(() =>
        expect(windowEl('contact').style.visibility).toBe('hidden'),
      )
      expect(windowOrder()).toEqual(['contact'])
    })
  })

  describe('URL', () => {
    it('stays on / and adds no history as windows open, close and minimize', async () => {
      const { user, router, pathname } = await renderDesktop('/')
      const length = router.history.length
      await user.click(dockLink('terminal'))
      await screen.findByRole('region', { name: 'Terminal' })
      fireEvent.pointerDown(windowEl('about'))
      await user.click(dockLink('about'))
      await user.click(closeBox('Contact'))
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
      // About's title, the handle that moves it.
      act(() => screen.getByRole('button', { name: 'About' }).focus())
      expect(windowEl('about').style.zIndex).toBe('3')
      expect(windowOrder()).toEqual(['contact', 'about'])
      act(() => windowEl('contact').focus())
      expect(windowEl('about').style.zIndex).toBe('1')
    })

    it('moves a window with the arrow keys on its title', async () => {
      const { user } = await renderDesktop('/')
      const title = screen.getByRole('button', { name: 'Contact' })
      act(() => title.focus())
      await user.keyboard('{ArrowRight}')
      expect(windowEl('contact').style.transform).toBe(
        'translate3d(10px, 0px, 0)',
      )
      // jsdom has no layout, so every move starts from the corner.
      await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
      expect(windowEl('contact').style.transform).toBe(
        'translate3d(0px, 50px, 0)',
      )
      // Kept on screen.
      await user.keyboard('{ArrowLeft}')
      expect(windowEl('contact').style.transform).toBe(
        'translate3d(0px, 0px, 0)',
      )
    })

    it('rolls a window up with Enter on its title', async () => {
      const { user } = await renderDesktop('/')
      const title = screen.getByRole('button', { name: 'Contact' })
      act(() => title.focus())
      await user.keyboard('{Enter}')
      expect(title.getAttribute('aria-expanded')).toBe('false')
      await user.keyboard('{Enter}')
      expect(title.getAttribute('aria-expanded')).toBe('true')
    })
  })
})
