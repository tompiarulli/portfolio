import { Link } from '@tanstack/react-router'

import { DockIcon } from '#/components/DockIcon'
import { useWindows } from '#/components/WindowManager'

const APPS = [
  { id: 'about', to: '/', label: 'About' },
  { id: 'contact', to: '/contact', label: 'Contact' },
  { id: 'terminal', to: '/terminal', label: 'Terminal' },
  { id: 'settings', to: '/settings', label: 'Settings' },
] as const

export function Dock() {
  const { stack, raise, minimized, minimize } = useWindows()
  return (
    <nav
      aria-label="Applications"
      data-shutdown="dock"
      className="fixed bottom-0 left-1/2 z-50 flex max-w-full -translate-x-1/2 border border-b-0 border-(--ink) bg-(--surface)"
    >
      {APPS.map((app) => {
        const open = stack.includes(app.id)
        const hidden = minimized.includes(app.id)
        const front = stack.at(-1) === app.id && !hidden
        return (
          <Link
            key={app.to}
            to={app.to}
            preload="intent"
            data-dock-link={app.id}
            aria-current={front ? 'page' : undefined}
            onClick={(e) => {
              // Clicking the focused window's icon minimizes it into the dock.
              if (front) {
                e.preventDefault()
                minimize(app.id)
                return
              }
              // Also raise here: the URL may already point at a closed or
              // minimized window.
              raise(app.id)
            }}
            className="group relative flex w-[calc(var(--icon-size)+51px)] min-w-0 flex-col items-center gap-[6px] border-r border-(--dock-divider) px-2 pt-[12px] pb-[7px] -outline-offset-4 outline-current outline-dotted not-focus-visible:outline-none last:border-r-0 hover:bg-(--tertiary) hover:text-(--on-tertiary) focus-visible:bg-(--tertiary) focus-visible:text-(--on-tertiary) active:bg-(--accent) active:text-(--on-accent)"
          >
            <DockIcon id={app.id} />
            <span className="font-mono text-(length:--dock-label-size) [font-weight:var(--label-weight)] tracking-tight [text-transform:var(--label-case)]">
              {app.label}
              {/* The marks below say this by sight. */}
              <span className="sr-only">
                {hidden ? ', minimized' : open ? ', open' : ''}
              </span>
            </span>
            <span
              aria-hidden
              className={`absolute bottom-[3px] left-1/2 h-[2px] w-[20px] -translate-x-1/2 transition-[scale,opacity] duration-150 ${
                stack.at(-1) === app.id
                  ? 'bg-(--indicator)'
                  : stack.includes(app.id)
                    ? // Open but behind: a shorter, fainter mark in ink.
                      'scale-x-40 bg-(--ink) opacity-15'
                    : 'scale-x-0'
              }`}
            />
          </Link>
        )
      })}
    </nav>
  )
}
