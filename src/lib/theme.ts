export type Backdrop =
  | 'rain'
  | 'stars'
  | 'streaks'
  | 'snow'
  | 'dust'
  | 'dither'
  | 'silk'
  | 'film'
  | 'plain'

/** Themes set the colours (tokens in styles.css), the font, the menu mark,
 *  which background draws the desktop and the day the clock shows; the
 *  rest of the chrome is shared. Each is an homage to something I like. */
export const THEMES = [
  // Each theme's clock shows a day that matters to what it nods to; the
  // default shows today.
  { id: 'silk', label: 'Silk', backdrop: 'silk', date: undefined },
  { id: 'rabbit', label: 'White Rabbit', backdrop: 'rain', date: '1999-03-31' },
  { id: 'believe', label: 'Believe', backdrop: 'stars', date: '1993-09-10' },
  // The first fully hand-drawn animated film.
  { id: 'steamboat', label: 'Steamboat', backdrop: 'film', date: '1908-08-17' },
  {
    id: 'traveler',
    label: 'Time Traveler',
    backdrop: 'streaks',
    date: '1985-10-26',
  },
  {
    id: 'outpost',
    label: 'Outpost 31',
    backdrop: 'snow',
    date: '1982-06-25',
  },
] as const satisfies readonly {
  id: string
  label: string
  backdrop: Backdrop
  /** Day the clock shows, as YYYY-MM-DD; none means today. */
  date?: string
}[]
export type Theme = (typeof THEMES)[number]['id']
export const DEFAULT_THEME: Theme = 'silk'
/** Glyphs of White Rabbit's code rain: half-width katakana and digits, as
 *  in the film. Shared with the Settings preview. */
export const RAIN_CHARACTERS =
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:.=*+<>'

const THEME_KEY = 'theme'

/** Saves the theme and sets data-theme on <html>. */
export function applyTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {}
  document.documentElement.dataset.theme = theme
}

/** The theme on <html>, as set by the boot script or applyTheme. */
export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme
  return THEMES.find((x) => x.id === t)?.id ?? DEFAULT_THEME
}

/** Inline in <head> so the first paint already has the saved theme. A saved
 *  theme that no longer exists falls back to the default. The router runs it
 *  again on every navigation, so it only writes when the theme differs:
 *  rewriting the same value would still restart everything watching
 *  data-theme, like the backdrop. */
export const themeBootScript = `(function(){var t;try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}t=${JSON.stringify(THEMES.map((x) => x.id))}.indexOf(t)<0?'${DEFAULT_THEME}':t;var d=document.documentElement.dataset;if(d.theme!==t)d.theme=t})()`
