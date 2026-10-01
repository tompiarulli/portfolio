import { Link } from '@tanstack/react-router'
import { Clock } from './Clock'
import { SystemMenu } from './SystemMenu'
import { useWindows } from './WindowManager'
import { PINNED, pathFor } from '#/lib/windows'

/** System lives in the logo menu and only gets a button while open. */
const SYSTEM = { id: 'system', label: 'System Info' } as const

/** The bar along the bottom, like the Windows taskbar: the logo menu, a
 *  button per window (the focused one filled in, the rest faded) and the
 *  clock. Phones use MobileNav. */
export function Taskbar() {
  const { stack, raise } = useWindows()
  const buttons = stack.includes('system') ? [...PINNED, SYSTEM] : PINNED
  return (
    <nav
      aria-label="Windows"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[36px] items-center gap-1.5 border-t border-(--ink) bg-(--surface) px-1.5 has-aria-expanded:z-70 max-sm:hidden"
    >
      <SystemMenu className="h-[26px] border border-(--ink) px-2.5 hover:bg-(--tertiary) hover:text-(--on-tertiary)" />
      {buttons.map((w) => {
        const focused = stack.at(-1) === w.id
        return (
          <Link
            key={w.id}
            to={pathFor(w.id)}
            preload="intent"
            // Also raise here: the URL may already point at a closed window.
            onClick={() => raise(w.id)}
            aria-current={focused ? 'page' : undefined}
            className={`flex h-[26px] min-w-0 flex-1 basis-0 items-center border border-(--ink) px-2.5 outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--ink) sm:max-w-[160px] ${
              focused
                ? 'bg-(--accent) text-(--on-accent)'
                : 'opacity-55 hover:bg-(--tertiary) hover:text-(--on-tertiary) hover:opacity-100'
            }`}
          >
            <span className="truncate font-title tracking-tight [text-transform:var(--label-case)] [font-weight:var(--label-weight)]">
              {w.label}
            </span>
          </Link>
        )
      })}
      <div className="ml-auto shrink-0 border-l border-(--ink) pr-1.5 pl-3">
        <Clock />
      </div>
    </nav>
  )
}
