import { useSyncExternalStore } from 'react'

const SOUND_KEY = 'sound'
const listeners = new Set<() => void>()

/** Whether sound effects may play. Off until the visitor turns them on. */
export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === 'on'
  } catch {
    return false
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The sound setting; prerenders as off and settles after hydration. */
export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, soundEnabled, () => false)
}
