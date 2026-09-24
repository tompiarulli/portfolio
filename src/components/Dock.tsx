import { Link } from '@tanstack/react-router'
import { useWindows } from './WindowManager'

const APPS = [
  { id: 'home', to: '/', label: 'Home', glyph: '⌂' },
  { id: 'projects', to: '/projects', label: 'Projects', glyph: '▤' },
  { id: 'about', to: '/about', label: 'About', glyph: '☺' },
  { id: 'contact', to: '/contact', label: 'Contact', glyph: '✉' },
  { id: 'settings', to: '/settings', label: 'Settings', glyph: '⚙' },
] as const

export function Dock() {
  const { raise } = useWindows()
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
          // Also raise here: the URL may already point at a closed window.
          onClick={() => raise(app.id)}
          className="group flex w-[72px] flex-col items-center gap-1 border-r border-(--ink) px-2 pt-2 pb-1 last:border-r-0 hover:bg-(--tertiary) hover:text-(--on-tertiary) active:bg-(--accent) active:text-(--on-accent)"
        >
          <span
            aria-hidden
            className="inset-well flex size-9 items-center justify-center text-xl leading-none group-active:translate-y-px"
          >
            {app.glyph}
          </span>
          <span className="font-title text-[11px] tracking-tight">
            {app.label}
          </span>
        </Link>
      ))}
    </nav>
  )
}
