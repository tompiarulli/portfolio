import { useSyncExternalStore } from 'react'
import type { SoundName } from './sfx'

const SOUND_KEY = 'sound'
const VOLUME = 0.6
const listeners = new Set<() => void>()

let ctx: AudioContext | undefined
let master: GainNode | undefined

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
  // Fade out anything still playing.
  if (!on && ctx && master)
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.02)
  listeners.forEach((l) => l())
}

/** Plays a sound effect if sound is on. Call from an event handler: the
 *  audio context is created on first use, inside the user's gesture. */
export function play(name: SoundName) {
  if (!soundEnabled()) return
  if (!ctx || !master) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setValueAtTime(VOLUME, ctx.currentTime)
  const audio = { ctx, out: master }
  // The recipes load on first play, keeping them out of the shell.
  void import('./sfx').then(({ sounds }) => sounds[name](audio.ctx, audio.out))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The sound setting; prerenders as off and settles after hydration. */
export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, soundEnabled, () => false)
}
