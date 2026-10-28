import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { restart } from '#/lib/power'
import { renderDesktop, windowOrder } from '#/test/desktop'

vi.mock('#/components/Backdrop', () => ({ Backdrop: () => null }))
// The real one needs a modal dialog, which jsdom lacks; this stands in for
// it being up.
vi.mock('#/components/ShutDown', () => ({
  ShutDown: () => <p>Shutting down</p>,
  prefetch: () => {},
}))

const trigger = () => screen.getByRole('button', { name: 'System menu' })
const menu = () => screen.queryByRole('menu', { name: 'System' })
const item = (name: string) => screen.getByRole('menuitem', { name })

/** Renders the desktop with the system menu's button focused. */
async function withTrigger() {
  const desktop = await renderDesktop('/')
  act(() => trigger().focus())
  return desktop
}

describe('system menu', () => {
  it('opens on click with the first item focused', async () => {
    const { user } = await renderDesktop('/')
    expect(menu()).toBeNull()
    await user.click(trigger())
    expect(menu()).not.toBeNull()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(item('System Info'))
  })

  it('closes on a second click', async () => {
    const { user } = await renderDesktop('/')
    await user.click(trigger())
    await user.click(trigger())
    expect(menu()).toBeNull()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('opens at the first item with Down', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(item('System Info'))
  })

  it('opens at the last item with Up', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(item('Restart…'))
  })

  it('opens with Enter on the button', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(item('System Info'))
  })

  it('walks the items with the arrow keys, wrapping at the ends', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(item('Terminal'))
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(item('Restart…'))
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(item('System Info'))
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(item('Restart…'))
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(item('Terminal'))
  })

  it('jumps to the ends with Home and End', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(item('Restart…'))
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(item('System Info'))
  })

  it('keeps the items out of the tab order', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowDown}')
    for (const name of ['System Info', 'Terminal', 'Restart…'])
      expect(item(name).tabIndex).toBe(-1)
  })

  it('closes on Escape and hands focus back to the button', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await user.keyboard('{Escape}')
    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(trigger())
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('closes when Tab moves focus out of it', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowDown}')
    await user.tab()
    expect(menu()).toBeNull()
    expect(document.activeElement).not.toBe(document.body)
  })

  it('stays open when Shift+Tab moves focus back to the button', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowDown}')
    await user.tab({ shift: true })
    // The button is inside the menu's root, so focus stays in it and the
    // menu stays open.
    expect(document.activeElement).toBe(trigger())
    expect(menu()).not.toBeNull()
  })

  it('closes on a press outside', async () => {
    const { user } = await renderDesktop('/')
    await user.click(trigger())
    fireEvent.pointerDown(document.body)
    expect(menu()).toBeNull()
  })

  it('opens System Info from the menu', async () => {
    const { user } = await renderDesktop('/')
    await user.click(trigger())
    await user.click(item('System Info'))
    expect(menu()).toBeNull()
    const system = await screen.findByRole('region', { name: 'System Info' })
    expect(windowOrder()[0]).toBe('system')
    await waitFor(() => expect(document.activeElement).toBe(system))
  })

  it('opens Terminal from the menu, focused at its prompt', async () => {
    const { user } = await renderDesktop('/')
    await user.click(trigger())
    await user.click(item('Terminal'))
    expect(menu()).toBeNull()
    const input = await screen.findByRole('textbox', { name: 'Terminal input' })
    expect(windowOrder()[0]).toBe('terminal')
    await waitFor(() => expect(document.activeElement).toBe(input))
  })

  it('does not close the window behind it on Escape', async () => {
    const { user } = await withTrigger()
    await user.keyboard('{ArrowDown}{Escape}')
    expect(windowOrder()).toEqual(['about', 'contact', 'player'])
  })
})

describe('restart', () => {
  it('runs from the menu', async () => {
    const { user } = await renderDesktop('/')
    await user.click(trigger())
    await user.click(item('Restart…'))
    expect(await screen.findByText('Shutting down')).toBeTruthy()
  })

  it('runs when the terminal asks', async () => {
    await renderDesktop('/')
    expect(screen.queryByText('Shutting down')).toBeNull()
    act(() => void restart())
    expect(await screen.findByText('Shutting down')).toBeTruthy()
  })
})
