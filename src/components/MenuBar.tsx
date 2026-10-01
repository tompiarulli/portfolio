import { Link } from '@tanstack/react-router'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Clock } from './Clock'
import { useWindows } from './WindowManager'

const BAR =
  'fixed top-0 z-50 flex h-[32px] items-center border-b border-(--ink) bg-(--surface) text-(length:--menu-size)'

const ITEM =
  'block w-full px-4 py-[3px] text-left whitespace-nowrap outline-none hover:bg-(--accent) hover:text-(--on-accent) focus-visible:bg-(--accent) focus-visible:text-(--on-accent)'

/** The screen after Shut Down, as Windows 95 left it. Any click or key
 *  boots back up. */
function Off({ onBoot }: { onBoot: () => void }) {
  useEffect(() => {
    window.addEventListener('keydown', onBoot)
    return () => window.removeEventListener('keydown', onBoot)
  }, [onBoot])
  return (
    <div
      role="dialog"
      aria-label="Shut down"
      onClick={onBoot}
      className="fixed inset-0 z-100 flex cursor-pointer items-center justify-center bg-(--desk) p-6 text-center font-title text-base text-(--glint)"
    >
      It is now safe to turn off your computer.
    </div>
  )
}

/** The theme logo menu, opened like the system menu on a 90s desktop. */
function SystemMenu({ onShutDown }: { onShutDown: () => void }) {
  const { raise } = useWindows()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const close = () => setOpen(false)

  // Menu groups after System Info, a rule before each.
  const actions: { label: string; onSelect: () => void }[][] = [
    [
      { label: 'Restart…', onSelect: () => location.reload() },
      { label: 'Shut Down…', onSelect: onShutDown },
    ],
  ]

  // Arrow keys walk the items, Escape closes and hands focus back.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close()
      trigger.current?.focus()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [
      ...(root.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []),
    ]
    if (!open) {
      setOpen(true)
      requestAnimationFrame(() =>
        root.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus(),
      )
      return
    }
    const i = items.indexOf(document.activeElement as HTMLElement)
    const step = e.key === 'ArrowDown' ? 1 : -1
    items[(i + step + items.length) % items.length]?.focus()
  }

  return (
    <div ref={root} className="relative flex h-full" onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        aria-label="System menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-full items-center px-3 ${open ? 'bg-(--accent) text-(--on-accent)' : ''}`}
      >
        <span aria-hidden className="logo" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="System"
          className="absolute top-full left-0 min-w-44 border border-(--ink) bg-(--surface) py-1 font-title tracking-tight shadow-(--window-shadow)"
        >
          <Link
            to="/system"
            preload="intent"
            role="menuitem"
            onClick={() => {
              raise('system')
              close()
            }}
            className={ITEM}
          >
            System Info
          </Link>
          {actions.map((group) => (
            <Fragment key={group[0].label}>
              <hr className="my-1 border-t border-(--ink)" />
              {group.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close()
                    a.onSelect()
                  }}
                  className={ITEM}
                >
                  {a.label}
                </button>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

export function MenuBar() {
  const [off, setOff] = useState(false)
  const boot = useCallback(() => setOff(false), [])
  return (
    <>
      {off && <Off onBoot={boot} />}
      <nav className={`${BAR} left-0 border-r has-aria-expanded:z-70`}>
        <SystemMenu onShutDown={() => setOff(true)} />
      </nav>
      <header className={`${BAR} right-0 gap-3 border-l px-3`}>
        <Clock />
      </header>
    </>
  )
}
