export type Backdrop = 'rain' | 'streaks' | 'orbits' | 'film'

/** A theme sets its colour tokens and font (styles.css), the menu mark,
 *  the backdrop and the clock's date, and may restyle the chrome through
 *  tokens; the layout and behaviour are shared. */
export const THEMES = [
  { id: 'orbital', label: 'Orbital', backdrop: 'orbits', date: undefined },
  { id: 'rabbit', label: 'White Rabbit', backdrop: 'rain', date: '1999-03-31' },
  { id: 'steamboat', label: 'Steamboat', backdrop: 'film', date: '1908-08-17' },
  {
    id: 'traveler',
    label: 'OUTATIME',
    backdrop: 'streaks',
    date: '1985-10-26',
  },
] as const satisfies readonly {
  id: string
  label: string
  backdrop: Backdrop
  /** Day the clock shows, as YYYY-MM-DD; none means today. */
  date?: string
}[]
export type Theme = (typeof THEMES)[number]['id']
export const DEFAULT_THEME: Theme = 'orbital'
/** White Rabbit's code rain: half-width katakana, digits and a few
 *  symbols. */
export const RAIN_CHARACTERS =
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:.=*+<>'

const THEME_KEY = 'theme'

/** The query parameter that opens the site in a theme, for one visit:
 *  `?theme=steamboat`. */
export const THEME_PARAM = 'theme'

/** Every name `?theme=` accepts, lower case, to its theme: the id, and the
 *  label as a slug (`white-rabbit`, `outatime`). */
export const THEME_NAMES: Record<string, Theme> = Object.fromEntries(
  THEMES.flatMap((t) => [
    [t.id, t.id],
    [t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), t.id],
  ]),
)

/** Saves the theme and sets data-theme on <html>. A theme picked by hand
 *  replaces one from `?theme=`, so the parameter comes off the address
 *  too, or a reload would bring it back. */
export function applyTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {}
  document.documentElement.dataset.theme = theme
  const url = new URL(location.href)
  if (url.searchParams.has(THEME_PARAM)) {
    url.searchParams.delete(THEME_PARAM)
    history.replaceState(history.state, '', url)
  }
}

/** The theme on <html>, as set by the boot script or applyTheme. */
export function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme
  return THEMES.find((x) => x.id === t)?.id ?? DEFAULT_THEME
}

/** Inline in <head> so the first paint already has the theme: the one named
 *  by `?theme=` if it names one, else the saved one, else the default. The
 *  router runs it again on every navigation, so it only writes when the
 *  theme differs: rewriting the same value still fires every observer of
 *  data-theme and restarts the backdrop. */
export const themeBootScript = `(function(){var n=${JSON.stringify(THEME_NAMES)},t;try{var q=new URLSearchParams(location.search).get('${THEME_PARAM}');if(q){q=q.toLowerCase();if(Object.prototype.hasOwnProperty.call(n,q))t=n[q]}}catch(e){}if(!t){try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}}t=${JSON.stringify(THEMES.map((x) => x.id))}.indexOf(t)<0?'${DEFAULT_THEME}':t;var d=document.documentElement.dataset;if(d.theme!==t)d.theme=t})()`
