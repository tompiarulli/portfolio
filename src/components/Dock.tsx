import { useWindows } from '#/components/WindowManager'

const APPS = [
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'work', label: 'Work' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'settings', label: 'Settings' },
] as const

export function Dock() {
  const { stack, raise } = useWindows()
  return (
    <nav
      aria-label="Applications"
      data-shutdown="dock"
      // On a phone the dock spans the screen and its keys share it.
      className="fixed bottom-0 left-1/2 z-50 flex max-w-full -translate-x-1/2 gap-[6px] overflow-clip rounded-t-(--dock-radius) border border-b-0 border-(--frame) bg-(--surface) p-[6px] max-sm:inset-x-0 max-sm:translate-x-0 max-sm:gap-[4px] max-sm:p-[4px]"
    >
      {APPS.map((app) => {
        const open = stack.includes(app.id)
        const front = stack.at(-1) === app.id
        return (
          // A ruled key with the app's name, like a console's soft keys.
          <button
            key={app.id}
            type="button"
            data-dock-link={app.id}
            data-open={open || undefined}
            aria-current={front ? 'true' : undefined}
            // The focused window's key does nothing, as on a Mac.
            onClick={() => front || raise(app.id)}
            className="group relative flex h-[42px] w-[96px] min-w-0 cursor-pointer items-center justify-center rounded-(--close-radius) border border-(--ink) px-1 -outline-offset-4 outline-current outline-dotted not-focus-visible:outline-none focus-visible:bg-(--tertiary) focus-visible:text-(--on-tertiary) max-sm:w-auto max-sm:flex-1 max-sm:px-0"
          >
            {/* Spaced a little tighter on a phone, so the longest name fits. */}
            <span className="font-(family-name:--font-label) text-(length:--label-size) [font-weight:var(--label-weight)] tracking-(--label-tracking) [text-transform:var(--label-case)] group-active:translate-y-px max-sm:tracking-[min(var(--label-tracking),0.04em)]">
              {app.label}
              {/* The lamp says this by sight. */}
              <span className="sr-only">{open ? ', open' : ''}</span>
            </span>
            {/* A lamp in the corner: lit for the front window, an outline
                for one open behind it. It grows in as its window opens,
                and fills as the window comes to the front. */}
            <span
              aria-hidden
              data-lamp
              className={`absolute top-[5px] left-[5px] size-[5px] border transition-[opacity,scale,background-color,border-color] duration-150 ${
                front
                  ? 'border-(--indicator) bg-(--indicator)'
                  : open
                    ? 'border-(--ink)'
                    : 'scale-0 border-(--ink) opacity-0'
              }`}
            />
          </button>
        )
      })}
    </nav>
  )
}
