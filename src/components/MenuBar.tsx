import { Link } from '@tanstack/react-router'
import { Clock } from './Clock'
import { useWindows } from './WindowManager'
import { site } from '#/lib/site'

export function MenuBar() {
  const { raise } = useWindows()
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-7 items-center justify-between border-b border-(--ink) bg-(--surface) px-2 text-[12px]">
      <nav className="flex items-center gap-2">
        <Link
          to="/"
          preload="intent"
          onClick={() => raise('home')}
          className="font-title text-base leading-none"
          aria-label="Home"
        >
          ☼
        </Link>
        <Link
          to="/about"
          preload="intent"
          onClick={() => raise('about')}
          className="bevel px-2 py-0.5 font-title uppercase tracking-tight active:bevel-pressed"
        >
          About {site.name.split(' ')[0]}
        </Link>
      </nav>
      <Clock />
    </header>
  )
}
