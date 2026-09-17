import { Link } from '@tanstack/react-router'
import { Clock } from './Clock'
import { site } from '#/lib/site'

export function MenuBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-7 items-center justify-between border-b border-black bg-(--surface) px-2 text-[12px]">
      <nav className="flex items-center gap-2">
        <Link
          to="/"
          className="font-title text-base leading-none"
          aria-label="Home"
        >
          ☼
        </Link>
        <Link
          to="/about"
          className="bevel px-2 py-0.5 font-title uppercase tracking-tight active:bevel-pressed"
          activeProps={{ className: 'bevel-accent' }}
        >
          About {site.name.split(' ')[0]}
        </Link>
      </nav>
      <Clock />
    </header>
  )
}
