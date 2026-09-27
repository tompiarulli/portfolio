export type Backdrop = 'dither' | 'rain'

/** Themes drive every colour (tokens in styles.css), the fonts and which
 *  background draws the desktop. TomOS is the clean default; the rest are
 *  homages to things I like. */
export const THEMES = [
  { id: 'tomos', label: 'TomOS', backdrop: 'dither' },
  { id: 'rabbit', label: 'White Rabbit', backdrop: 'rain' },
] as const satisfies readonly {
  id: string
  label: string
  backdrop: Backdrop
}[]
export type Theme = (typeof THEMES)[number]['id']
export const DEFAULT_THEME: Theme = 'tomos'
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

/** Inline in <head> so the first paint already has the saved theme. */
export const themeBootScript = `(function(){var t;try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}document.documentElement.dataset.theme=t||'${DEFAULT_THEME}'})()`
