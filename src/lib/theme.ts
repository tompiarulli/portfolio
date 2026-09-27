export const MODES = ['system', 'light', 'dark'] as const
export type Mode = (typeof MODES)[number]
const KEY = 'mode'

export type Backdrop = 'dither' | 'rain'

/** Desktop themes. They only change the backdrop: its colours (--desk, --warp
 *  in styles.css) and which background draws them. The window
 *  chrome stays the same ink in every theme. */
export const THEMES = [
  { id: 'ink', label: 'Ink', backdrop: 'dither' },
  { id: 'rose', label: 'Rose', backdrop: 'dither' },
  { id: 'mint', label: 'Mint', backdrop: 'dither' },
  { id: 'pool', label: 'Pool', backdrop: 'dither' },
  { id: 'sand', label: 'Sand', backdrop: 'dither' },
  { id: 'lilac', label: 'Lilac', backdrop: 'dither' },
  { id: 'rabbit', label: 'White Rabbit', backdrop: 'rain' },
] as const satisfies readonly {
  id: string
  label: string
  backdrop: Backdrop
}[]
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
