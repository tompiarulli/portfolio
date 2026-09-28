import { Link } from '@tanstack/react-router'
import { useWindows } from './WindowManager'

const APPS = [
  { id: 'about', to: '/', label: 'About' },
  { id: 'work', to: '/work', label: 'Work' },
  { id: 'player', to: '/player', label: 'Player' },
  { id: 'blog', to: '/blog', label: 'Blog' },
  { id: 'contact', to: '/contact', label: 'Contact' },
  { id: 'settings', to: '/settings', label: 'Settings' },
] as const

export function Dock() {
  const { stack, raise, minimized, minimize } = useWindows()
  return (
    <nav
      aria-label="Applications"
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
          className="group relative flex w-[83px] flex-col items-center gap-[6px] border-r border-(--dock-divider) px-2 pt-[12px] pb-[7px] last:border-r-0 hover:bg-(--tertiary) hover:text-(--on-tertiary) active:bg-(--accent) active:text-(--on-accent)"
        >
          {/* Themes can swap any icon by overriding its --icon-* token. */}
          <span
            aria-hidden
            className="dock-icon group-active:translate-y-px"
            style={{ maskImage: `var(--icon-${app.id})` }}
          />
          <span className="font-title text-(length:--dock-label-size) tracking-tight [text-transform:var(--label-case)] [font-weight:var(--label-weight)]">
            {app.label}
          </span>
          <span
            aria-hidden
            className={`absolute bottom-[3px] left-1/2 h-[2px] w-[20px] -translate-x-1/2 bg-(--indicator) transition-[scale,opacity] group-hover:bg-current group-active:bg-current duration-150 ${
              stack.at(-1) === app.id
                ? ''
                : stack.includes(app.id)
                  ? 'scale-x-40 opacity-45'
                  : 'scale-x-0'
            }`}
          />
        </Link>
      ))}
    </nav>
  )
}
