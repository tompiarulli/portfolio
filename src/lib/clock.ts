/** Whether the clock shows the theme's day or today. The time is always
 *  real. Saved, like the theme, and changed from Settings. */
export type ClockMode = 'theme' | 'accurate'

export const CLOCK_MODES: { id: ClockMode; label: string }[] = [
  { id: 'theme', label: 'Themed' },
  { id: 'accurate', label: 'Current' },
]

const CLOCK_KEY = 'clock'
const CHANGE = 'clockmodechange'

export function clockMode(): ClockMode {
  try {
    return localStorage.getItem(CLOCK_KEY) === 'accurate' ? 'accurate' : 'theme'
  } catch {
    return 'theme'
  }
}

export function setClockMode(mode: ClockMode) {
  try {
    localStorage.setItem(CLOCK_KEY, mode)
  } catch {}
  window.dispatchEvent(new Event(CHANGE))
}

/** Calls `onChange` when the mode changes, here or in another tab. */
export function subscribeClockMode(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CLOCK_KEY) onChange()
  }
  window.addEventListener(CHANGE, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE, onChange)
    window.removeEventListener('storage', onStorage)
  }
}
