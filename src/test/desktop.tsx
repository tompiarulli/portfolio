import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { Desktop } from '#/components/Desktop'
import type { WindowId } from '#/lib/windows'

/** The site's routes as the router sees them: the desktop at the root and
 *  the home page its one child. Unknown URLs match the root alone. */
function testRouter(url: string) {
  const root = createRootRoute({
    component: Desktop,
    notFoundComponent: () => null,
  })
  const home = createRoute({ getParentRoute: () => root, path: '/' })
  return createRouter({
    routeTree: root.addChildren([home]),
    history: createMemoryHistory({ initialEntries: [url] }),
  })
}

/** Renders the desktop at `url`. Mock `#/components/Backdrop` in the test
 *  file: jsdom has no canvas to draw it on. */
export async function renderDesktop(url = '/') {
  const router = testRouter(url)
  await router.load()
  const user = userEvent.setup()
  const view = render(<RouterProvider router={router} />)
  return {
    ...view,
    router,
    user,
    pathname: () => router.state.location.pathname,
  }
}

/** Open windows' ids, front to back (the order they render in). */
export const windowOrder = () =>
  [...document.querySelectorAll<HTMLElement>('section[data-window]')].map(
    (el) => el.dataset.window,
  )

export const windowEl = (id: WindowId) => {
  const el = document.querySelector<HTMLElement>(`[data-window="${id}"]`)
  if (!el) throw new Error(`No ${id} window`)
  return el
}

export const dockLink = (id: WindowId) => {
  const el = document.querySelector<HTMLElement>(`[data-dock-link="${id}"]`)
  if (!el) throw new Error(`No ${id} dock icon`)
  return el
}
