import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderDesktop } from '#/test/desktop'

vi.mock('#/components/Backdrop', () => ({ Backdrop: () => null }))

/** Opens the Terminal from the system menu and returns its prompt. */
async function openTerminal() {
  const { user } = await renderDesktop('/')
  await user.click(screen.getByRole('button', { name: 'System menu' }))
  await user.click(screen.getByRole('menuitem', { name: 'Terminal' }))
  return screen.findByRole<HTMLInputElement>('textbox', {
    name: 'Terminal input',
  })
}

/** The text of each line on screen. */
const lines = () =>
  [
    ...screen
      .getByRole('log', { name: 'Terminal output' })
      .querySelectorAll('p'),
  ].map((p) => p.textContent)

/** Types a command at the prompt and presses Enter. */
function enter(input: HTMLInputElement, command: string) {
  fireEvent.change(input, { target: { value: command } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('terminal', () => {
  it('keeps a bounded scrollback when flooded', async () => {
    const input = await openTerminal()
    for (let i = 0; i < 400; i++) enter(input, `echo ${i}`)
    expect(lines()).toHaveLength(500)
    expect(lines().at(-1)).toBe('399')
  })

  it('keeps a bounded history when flooded', async () => {
    const input = await openTerminal()
    for (let i = 0; i < 600; i++) enter(input, `echo ${i}`)
    enter(input, 'history')
    // The 600 echoes and `history` itself, less the oldest 101.
    expect(lines().at(-500)).toBe('   1  echo 101')
    expect(lines().at(-1)).toBe(' 500  history')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.value).toBe('history')
  })

  it('caps how long one command can be', async () => {
    const input = await openTerminal()
    expect(input.maxLength).toBe(256)
  })
})
