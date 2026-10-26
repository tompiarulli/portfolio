import { DockIcon } from '#/components/DockIcon'
import { useWindows } from '#/components/WindowManager'

const APPS = [
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'work', label: 'Work' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'settings', label: 'Settings' },
] as const

export function Dock() {
  const { stack, raise, minimized, minimize } = useWindows()
  return (
    <nav
      aria-label="Applications"
      data-shutdown="dock"
      // On a phone the dock spans the screen and its buttons share it.
      className="fixed bottom-0 left-1/2 z-50 flex max-w-full -translate-x-1/2 overflow-clip rounded-t-(--dock-radius) border border-b-0 border-(--ink) bg-(--surface) max-sm:inset-x-0 max-sm:translate-x-0"
    >
      {APPS.map((app) => {
        const open = stack.includes(app.id)
        const hidden = minimized.includes(app.id)
        const front = stack.at(-1) === app.id && !hidden
        return (
          <button
            key={app.id}
            type="button"
            data-dock-link={app.id}
            aria-current={front ? 'true' : undefined}
            onClick={() =>
              // Clicking the focused window's icon minimizes it into the dock.
              front ? minimize(app.id) : raise(app.id)
            }
            className="group relative flex size-[88px] min-w-0 cursor-pointer flex-col items-center justify-center gap-[4px] border-r border-(--dock-divider) px-1 -outline-offset-4 outline-current outline-dotted not-focus-visible:outline-none last:border-r-0 focus-visible:bg-(--tertiary) focus-visible:text-(--on-tertiary) max-sm:h-[76px] max-sm:w-auto max-sm:flex-1"
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
              className={`absolute bottom-[7px] left-1/2 h-[2px] w-[20px] -translate-x-1/2 transition-[scale,opacity] duration-150 ${
                stack.at(-1) === app.id
                  ? 'bg-(--indicator)'
                  : stack.includes(app.id)
                    ? // Open but behind: a shorter, fainter mark in ink.
                      'scale-x-40 bg-(--ink) opacity-15'
                    : 'scale-x-0'
              }`}
            />
          </button>
        )
      })}
    </nav>
  )
}
