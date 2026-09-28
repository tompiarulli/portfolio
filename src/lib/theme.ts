export type Backdrop = 'rain' | 'sky' | 'plain' | 'road' | 'snow'

/** Themes drive every colour (tokens in styles.css), the fonts and which
 *  background draws the desktop. Each is an homage to something I like. */
export const THEMES = [
  // The film's US release day.
  { id: 'rabbit', label: 'White Rabbit', backdrop: 'rain', date: '1999-03-31' },
  // The pilot's first broadcast.
  { id: 'believe', label: 'I Believe', backdrop: 'sky', date: '1993-09-10' },
  // The site's launch.
  {
    id: 'tomspace',
    label: 'TomSpace',
    backdrop: 'plain',
    date: '2003-08-01',
  },
  // The night the time traveller is trying to get back to: 26 October 1985, when he
  // left Twin Pines Mall at 88 miles per hour.
  {
    id: 'traveler',
    label: 'Time Traveler',
    backdrop: 'road',
    date: '1985-10-26',
  },
  // The film's US release.
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
  /** Day the menu bar clock shows, as YYYY-MM-DD; today when unset. */
  date?: string
}[]
export type Theme = (typeof THEMES)[number]['id']
export const DEFAULT_THEME: Theme = 'rabbit'
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
 *  theme that no longer exists falls back to the default. */
export const themeBootScript = `(function(){var t;try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}document.documentElement.dataset.theme=${JSON.stringify(THEMES.map((x) => x.id))}.indexOf(t)<0?'${DEFAULT_THEME}':t})()`
