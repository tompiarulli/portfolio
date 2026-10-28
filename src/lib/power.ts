/** Where Restart has got to, as ShutDown keeps it in data-off on <html>:
 *  the chrome closing, the theme's shut down playing, its start screen up,
 *  or that screen leaving. Unset while the desktop is on. The chrome's CSS
 *  keys off it, and the backdrops read it every frame to play their part
 *  (the rings wind in, the rain drains, the streaks speed up). */
export type Stage = 'closing' | 'down' | 'title' | 'leaving'

export const stage = () =>
  document.documentElement.dataset.off as Stage | undefined
