export type Backdrop = 'rain' | 'sky' | 'plain' | 'road' | 'snow'

/** Themes set the colours (tokens in styles.css), the font, the menu mark
 *  and which background draws the desktop; the rest of the chrome is
 *  shared. Each is an homage to something I like. */
export const THEMES = [
  // Its release day.
  { id: 'rabbit', label: 'White Rabbit', backdrop: 'rain' },
  // Its release day.
  { id: 'believe', label: 'I Believe', backdrop: 'sky' },
  // Its release day.
  {
    id: 'tomspace',
    label: 'TomSpace',
    backdrop: 'plain',
  },
  // Its release day.
  {
    id: 'traveler',
    label: 'Time Traveler',
    backdrop: 'road',
  },
  // Its release day.
  {
    id: 'outpost',
    label: 'Outpost 31',
    backdrop: 'snow',
  },
] as const satisfies readonly {
  id: string
  label: string
  backdrop: Backdrop
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
