export const THEMES = ['pink', 'mint', 'sky', 'mono'] as const
export type Theme = (typeof THEMES)[number]
const KEY = 'theme'

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {}
}

/** Inline in <head> so the first paint already has the saved theme. */
export const themeBootScript = `try{var t=localStorage.getItem('${KEY}');if(t)document.documentElement.dataset.theme=t}catch(e){}`
