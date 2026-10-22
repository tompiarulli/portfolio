import { Link } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'

import { Window } from '#/components/Window'
import { useWindows } from '#/components/WindowManager'

// The path never changes while the window is open: the URL leaving it
// closes the window.
const noChange = () => () => {}

/** Opens for any URL without a window of its own. */
export function NotFound() {
  const { close } = useWindows()
  // Prerendered once as 404.html and served for every unknown URL, so the
  // path is only known in the browser.
  const path = useSyncExternalStore(
    noChange,
    () => location.pathname,
    () => null,
  )

  return (
    <Window title="File Not Found" x={40} y={60} width={360}>
      <p>
        The file {path && <code className="font-title break-all">{path}</code>}{' '}
        could not be found. It may have moved, or the address has a typo.
      </p>
      <div className="mt-5 flex justify-end">
        {/* A link, so it still gets you home before the page hydrates. */}
        <Link
          to="/"
          preload="intent"
          onClick={(e) => {
            e.preventDefault()
            close('notfound')
          }}
          className="bevel font-title active:bevel-pressed px-6 py-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ink)"
        >
          OK
        </Link>
      </div>
    </Window>
  )
}
