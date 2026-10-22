import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Window } from '#/components/Window'
import { useWindows } from '#/components/WindowManager'

/** Opens for any URL without a window of its own. */
export function NotFound() {
  const { close } = useWindows()
  // Prerendered once as 404.html and served for every unknown URL, so the
  // path is only known in the browser.
  const [path, setPath] = useState<string | null>(null)
  useEffect(() => setPath(location.pathname), [])

  return (
    <Window title="File Not Found" x={40} y={60} width={360}>
      <p>
        The file {path && <code className="break-all font-title">{path}</code>}{' '}
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
          className="bevel px-6 py-1 font-title outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ink) active:bevel-pressed"
        >
          OK
        </Link>
      </div>
    </Window>
  )
}
