export const MODES = ['system', 'light', 'dark'] as const
export type Mode = (typeof MODES)[number]
const KEY = 'mode'

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

/** Inline in <head> so the first paint already has the saved mode, and
 *  "system" keeps following OS changes. */
export const modeBootScript = `(function(){var d=document.documentElement,q=matchMedia('(prefers-color-scheme: dark)');function r(){var m;try{m=localStorage.getItem('${KEY}')}catch(e){}if(m!=='light'&&m!=='dark')m=q.matches?'dark':'light';d.dataset.mode=m}r();q.addEventListener('change',r)})()`
