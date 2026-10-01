import { Link } from '@tanstack/react-router'
import { SystemMenu } from './SystemMenu'
import { useWindows } from './WindowManager'
import { PINNED, pathFor } from '#/lib/windows'

const TAB =
  'flex h-full items-center justify-center border-l border-(--ink) font-title tracking-tight [text-transform:var(--label-case)] [font-weight:var(--label-weight)]'

/** The phone's bottom bar in place of the taskbar: the logo menu, then a
 *  tab per window. */
export function MobileNav() {
  const { stack, raise, minimized } = useWindows()
  // A window minimized on a wider screen isn't showing.
  const top = stack.at(-1)
  const focused = top && !minimized.includes(top) ? top : null
  return (
    <nav
      aria-label="Windows"
      className="fixed inset-x-0 bottom-0 z-50 grid h-[60px] grid-cols-[60px_1fr_1fr_1fr] border-t border-(--ink) bg-(--surface) has-aria-expanded:z-70 sm:hidden"
    >
      <SystemMenu className="h-full w-full justify-center" />
      {PINNED.map((w) => (
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
