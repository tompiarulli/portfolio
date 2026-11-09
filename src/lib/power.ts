/** Where Restart has got to, as ShutDown keeps it in data-off on <html>:
 *  the chrome closing, the theme's shut down playing, its start screen up,
 *  or that screen leaving. Unset while the desktop is on. The chrome's CSS
 *  keys off it, and the backdrops read it every frame to play their part
 *  (the rain drains, the streaks speed up). */
export type Stage = 'closing' | 'down' | 'title' | 'leaving'

export const stage = () =>
  document.documentElement.dataset.off as Stage | undefined

// The power left as a theme's shut down runs out of it (OUTATIME's fuel),
// 0 to 1; unset while nothing is running it down.
let power: number | undefined

/** Sets the power left, for the backdrop to slow with it (the streaks
 *  coast to a stop as the fuel drains); `undefined` once it's done. */
export const setPower = (p: number | undefined) => {
  power = p
}

/** The power left, read every frame by the backdrop; unset unless a shut
 *  down is running it down. */
export const powerLeft = () => power

const RESTART = 'tomos:restart'

/** Restarts the desktop as the system menu's Restart does, from anywhere
 *  (the terminal's `restart`). MenuBar runs it. */
export const restart = () => window.dispatchEvent(new Event(RESTART))

/** Calls `onRestart` when something asks to restart. */
export function subscribeRestart(onRestart: () => void) {
  window.addEventListener(RESTART, onRestart)
  return () => window.removeEventListener(RESTART, onRestart)
}
