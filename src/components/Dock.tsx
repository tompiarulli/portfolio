import { Link } from '@tanstack/react-router'

const APPS = [
  { to: '/', label: 'Home', glyph: '⌂' },
  { to: '/projects', label: 'Projects', glyph: '▤' },
  { to: '/about', label: 'About', glyph: '☺' },
  { to: '/contact', label: 'Contact', glyph: '✉' },
  { to: '/settings', label: 'Settings', glyph: '⚙' },
] as const

export function Dock() {
  return (
    <nav
      aria-label="Applications"
      className="fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 border border-b-0 border-black bg-(--surface)"
    >
      {APPS.map((app) => (
        <Link
          key={app.to}
          to={app.to}
          preload="intent"
          className="group flex w-[72px] flex-col items-center gap-1 border-r border-black px-2 pt-2 pb-1 last:border-r-0 hover:bg-(--tertiary) active:bg-(--accent)"
          activeProps={{ className: 'bg-(--accent)' }}
          activeOptions={{ exact: true }}
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
