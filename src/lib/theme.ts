export const MODES = ['system', 'light', 'dark'] as const
export type Mode = (typeof MODES)[number]
const KEY = 'mode'

/** Desktop themes. They only change the backdrop colours (--desk, --warp in
 *  styles.css); the window chrome stays the same ink in every theme. */
export const THEMES = [
  { id: 'ink', label: 'Ink' },
  { id: 'rose', label: 'Rose' },
  { id: 'mint', label: 'Mint' },
  { id: 'pool', label: 'Pool' },
  { id: 'sand', label: 'Sand' },
  { id: 'lilac', label: 'Lilac' },
] as const
export type Theme = (typeof THEMES)[number]['id']
const THEME_KEY = 'theme'

const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches

/** Saves the mode and sets data-mode on <html> to the resolved light/dark. */
export function applyMode(mode: Mode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {}
  const dark = mode === 'dark' || (mode === 'system' && prefersDark())
  document.documentElement.dataset.mode = dark ? 'dark' : 'light'
}

export function savedMode(): Mode {
  try {
    const m = localStorage.getItem(KEY) as Mode | null
    if (m && MODES.includes(m)) return m
  } catch {}
  return 'system'
}

/** Saves the theme and sets data-theme on <html>. */
export function applyTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {}
  document.documentElement.dataset.theme = theme
}

export function savedTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY)
    const match = THEMES.find((x) => x.id === t)
    if (match) return match.id
  } catch {}
  return 'ink'
}

/** Inline in <head> so the first paint already has the saved mode and theme,
 *  and "system" keeps following OS changes. */
export const modeBootScript = `(function(){var d=document.documentElement,q=matchMedia('(prefers-color-scheme: dark)');try{var t=localStorage.getItem('${THEME_KEY}');if(t)d.dataset.theme=t}catch(e){}function r(){var m;try{m=localStorage.getItem('${KEY}')}catch(e){}if(m!=='light'&&m!=='dark')m=q.matches?'dark':'light';d.dataset.mode=m}r();q.addEventListener('change',r)})()`
