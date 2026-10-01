import { Link } from '@tanstack/react-router'
import { useWindows } from './WindowManager'
import { WINDOWS, pathFor } from '#/lib/windows'

const TAB =
  'flex h-full items-center justify-center border-l border-(--ink) font-title first:border-l-0 tracking-tight [text-transform:var(--label-case)] [font-weight:var(--label-weight)]'

/** The phone's bottom bar in place of the taskbar: a tab per window. */
export function MobileNav() {
  const { stack, raise } = useWindows()
  const focused = stack.at(-1)
  return (
    <nav
      aria-label="Windows"
      className="fixed inset-x-0 bottom-0 z-50 grid h-[60px] grid-cols-3 border-t border-(--ink) bg-(--surface) has-aria-expanded:z-70 sm:hidden"
    >
      {WINDOWS.map((w) => (
        <Link
          key={w.id}
          to={pathFor(w.id)}
          // Also raise here: the URL may already point at a closed window.
          onClick={() => raise(w.id)}
          aria-current={focused === w.id ? 'page' : undefined}
          className={`${TAB} ${focused === w.id ? 'bg-(--accent) text-(--on-accent)' : ''}`}
        >
          {w.label}
        </Link>
      ))}
    </nav>
  )
}
