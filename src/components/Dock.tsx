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
      className="fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 border border-b-0 border-(--ink) bg-(--surface)"
    >
      {APPS.map((app) => (
        <Link
          key={app.to}
          to={app.to}
          preload="intent"
          onClick={(e) => {
            // Clicking the focused window's icon minimizes it into the dock.
            if (stack.at(-1) === app.id && !minimized.includes(app.id)) {
              e.preventDefault()
              minimize(app.id)
              return
            }
            // Also raise here: the URL may already point at a closed or
            // minimized window.
            raise(app.id)
          }}
          className="group relative flex w-[calc(var(--icon-size)+51px)] flex-col items-center gap-[6px] border-r border-(--dock-divider) px-2 pt-[12px] pb-[7px] last:border-r-0 hover:bg-(--tertiary) hover:text-(--on-tertiary) active:bg-(--accent) active:text-(--on-accent)"
        >
          <DockIcon id={app.id} />
          <span className="font-mono text-(length:--dock-label-size) tracking-tight [text-transform:var(--label-case)] [font-weight:var(--label-weight)]">
            {app.label}
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
      ))}
    </nav>
  )
}
