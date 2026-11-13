export type Backdrop = 'rain' | 'streaks' | 'orbits' | 'film'

/** A theme sets its colour tokens and font (styles.css), the menu mark,
 *  the backdrop and the clock's date, and may restyle the chrome through
 *  tokens; the layout and behaviour are shared. */
export const THEMES = [
  {
    id: 'orbital',
    label: 'Orbital',
    backdrop: 'orbits',
    date: undefined,
    fonts: ['geist-mono-400', 'geist-mono-500', 'geist-mono-600'],
  },
  {
    id: 'rabbit',
    label: 'White Rabbit',
    backdrop: 'rain',
    date: '1999-03-31',
    fonts: ['iosevka-500', 'iosevka-600', 'iosevka-700'],
  },
  {
    id: 'steamboat',
    label: 'Steamboat',
    backdrop: 'film',
    date: '1908-08-17',
    fonts: [
      'grandstander-400',
      'recursive-mono-casual-400',
      'recursive-mono-casual-700',
      'jost-600',
    ],
  },
  {
    id: 'traveler',
    label: 'OUTATIME',
    backdrop: 'streaks',
    date: '1985-10-26',
    fonts: ['iosevka-500', 'righteous-400', 'space-mono-700'],
  },
] as const satisfies readonly {
  id: string
  label: string
  backdrop: Backdrop
  /** Day the clock shows, as YYYY-MM-DD; none means today. */
  date?: string
  /** The faces on screen at first paint, from public/fonts/, which the boot
   *  script preloads. Only these: a preload the page doesn't use is a
   *  wasted download and a console warning. */
  fonts: readonly string[]
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

/** Calls `onChange` when the theme on <html> changes, from Settings or
 *  the terminal. */
export function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  return () => observer.disconnect()
}

const THEME_FONTS: Record<string, readonly string[]> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.fonts]),
)

/** Inline in <head> so the first paint already has the theme: the one named
 *  by `?theme=` if it names one, else the saved one, else the default. The
 *  router runs it again on every navigation, so it only writes when the
 *  theme differs: rewriting the same value still fires every observer of
 *  data-theme and restarts the backdrop. While the page is still parsing,
 *  it also preloads that theme's fonts, so they are fetched straight away
 *  rather than once the inlined styles are parsed. */
export const themeBootScript = `(function(){var n=${JSON.stringify(THEME_NAMES)},f=${JSON.stringify(THEME_FONTS)},t;try{var q=new URLSearchParams(location.search).get('${THEME_PARAM}');if(q){q=q.toLowerCase();if(Object.prototype.hasOwnProperty.call(n,q))t=n[q]}}catch(e){}if(!t){try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}}t=Object.prototype.hasOwnProperty.call(f,t)?t:'${DEFAULT_THEME}';var d=document.documentElement.dataset;if(d.theme!==t)d.theme=t;if(document.readyState==='loading')f[t].forEach(function(x){var l=document.createElement('link');l.rel='preload';l.as='font';l.type='font/woff2';l.crossOrigin='anonymous';l.href='/fonts/'+x+'.woff2';document.head.appendChild(l)})})()`
