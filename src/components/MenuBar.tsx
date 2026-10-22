import { Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import { Clock } from '#/components/Clock'
import { ShutDown } from '#/components/ShutDown'
import { useWindows } from '#/components/WindowManager'

const BAR =
  'fixed top-0 z-50 flex h-[32px] items-center border-b border-(--ink) bg-(--surface) text-(length:--menu-size)'

const ITEM =
  'block w-full px-4 py-[3px] pointer-coarse:py-3 text-left whitespace-nowrap outline-none hover:bg-(--accent) hover:text-(--on-accent) focus-visible:bg-(--accent) focus-visible:text-(--on-accent)'

/** The theme logo menu, opened like the system menu on a 90s desktop. */
function SystemMenu({
  trigger,
  onShutDown,
}: {
  trigger: RefObject<HTMLButtonElement | null>
  onShutDown: () => void
}) {
  const { raise } = useWindows()
  const [open, setOpen] = useState(false)
  // The item to focus once the menu is open.
  const [start, setStart] = useState<'first' | 'last'>('first')
  const root = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const close = () => setOpen(false)

  const items = () => [
    ...(menu.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []),
  ]

  /** Opens the menu with the first or last item focused. */
  const openAt = (at: 'first' | 'last') => {
    setStart(at)
    setOpen(true)
  }
  useEffect(() => {
    if (open)
      items()
        .at(start === 'first' ? 0 : -1)
        ?.focus()
  }, [open, start])

  const actions: { label: string; onSelect: () => void }[] = [
    { label: 'Shut Down…', onSelect: onShutDown },
  ]

  // Down or Up on the button opens the menu at its first or last item.
  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    openAt(e.key === 'ArrowDown' ? 'first' : 'last')
  }

  // Arrow keys walk the items, Home and End jump to the ends, Escape closes
  // and hands focus back.
  const onMenuKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close()
      trigger.current?.focus()
      return
    }
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    const to =
      e.key === 'ArrowDown'
        ? (i + 1) % list.length
        : e.key === 'ArrowUp'
          ? (i - 1 + list.length) % list.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? list.length - 1
              : null
    if (to === null) return
    e.preventDefault()
    list[to]?.focus()
  }

  return (
    <div
      ref={root}
      className="relative flex h-full"
      // Tabbing out of the menu closes it, as clicking away does.
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget)) close()
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="System menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : openAt('first'))}
        onKeyDown={onTriggerKeyDown}
        className={`flex h-full items-center px-3 outline-current outline-dotted -outline-offset-4 not-focus-visible:outline-none ${open ? 'bg-(--accent) text-(--on-accent)' : ''}`}
      >
        <span aria-hidden className="logo" />
      </button>
      {open && (
        <div
          ref={menu}
          role="menu"
          aria-label="System"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full left-0 min-w-44 border border-(--ink) bg-(--surface) py-1 font-mono tracking-tight shadow-(--window-shadow)"
        >
          <Link
            to="/system"
            preload="intent"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              raise('system')
              close()
            }}
            className={ITEM}
          >
            System Info
          </Link>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close()
                a.onSelect()
              }}
              className={ITEM}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MenuBar() {
  const [off, setOff] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const boot = useCallback(() => setOff(false), [])
  // Back on, focus lands where Shut Down was chosen from, once the shut
  // down screen has gone and the bar is no longer inert.
  const wasOff = useRef(false)
  useEffect(() => {
    if (wasOff.current && !off) trigger.current?.focus()
    wasOff.current = off
  }, [off])
  return (
    <>
      {off && <ShutDown onBoot={boot} />}
      {/* One banner for both halves of the bar: the menu at the left, the
          clock at the right. */}
      <header>
        <div
          data-shutdown="bar"
          className={`${BAR} left-0 border-r has-aria-expanded:z-70`}
        >
          <SystemMenu trigger={trigger} onShutDown={() => setOff(true)} />
        </div>
        <div
          data-shutdown="bar"
          className={`${BAR} right-0 gap-3 border-l px-3`}
        >
          <Clock />
        </div>
      </header>
    </>
  )
}
