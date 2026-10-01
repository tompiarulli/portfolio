export type Backdrop = 'rain' | 'stars' | 'streaks' | 'snow' | 'plain'

/** Themes set the colours (tokens in styles.css), the font, the mark and
 *  which backdrop draws behind the page; the layout is shared. Each is an
 *  homage to something I like. */
export const THEMES = [
  // Its release day.
  { id: 'rabbit', label: 'White Rabbit', backdrop: 'rain' },
  // Its release day.
  { id: 'believe', label: 'I Believe', backdrop: 'stars' },
  // Its release day.
  { id: 'tomspace', label: 'TomSpace', backdrop: 'plain' },
  // Its release day.
  { id: 'traveler', label: 'Time Traveler', backdrop: 'streaks' },
  // Its release day.
  { id: 'outpost', label: 'Outpost 31', backdrop: 'snow' },
] as const satisfies readonly {
  id: string
  label: string
  backdrop: Backdrop
}[]
export type Theme = (typeof THEMES)[number]['id']
export const DEFAULT_THEME: Theme = 'rabbit'
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
