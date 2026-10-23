/** Every window the desktop can open. */
export type WindowId =
  | 'about'
  | 'contact'
  | 'terminal'
  | 'settings'
  | 'system'
  | 'notfound'

/** Where the page for unknown URLs prerenders, as 404.html. */
export const NOT_FOUND_PATH = '/404'

/** Whether a URL is the desktop's one page, ignoring trailing slashes. Any
 *  other URL is a 404. */
export const isHome = (pathname: string) => pathname.replace(/\/+$/, '') === ''

/** Windows open on first paint, back to front: About in front of Contact,
 *  with File Not Found on top for any URL but the home page. */
export function initialStack(pathname: string): WindowId[] {
  const base: WindowId[] = ['contact', 'about']
  return isHome(pathname) ? base : [...base, 'notfound']
}
