import { lazy } from 'react'
import type { ComponentType } from 'react'

import type { Theme } from '#/lib/theme'

/** A start screen is told when it's leaving, so it can play its exit
 *  before the desktop comes back. */
export type StartScreenProps = { leaving: boolean }
type StartScreen = ComponentType<StartScreenProps>

// Each theme's start screen is its own chunk; only the current theme's is
// fetched, as Restart begins.
const load: Record<Theme, () => Promise<{ default: StartScreen }>> = {
  orbital: () => import('#/components/start/Orbital'),
  rabbit: () => import('#/components/start/Rabbit'),
  steamboat: () => import('#/components/start/Steamboat'),
  traveler: () => import('#/components/start/Traveler'),
}

export const START_SCREENS: Record<Theme, StartScreen> = {
  orbital: lazy(load.orbital),
  rabbit: lazy(load.rabbit),
  steamboat: lazy(load.steamboat),
  traveler: lazy(load.traveler),
}

/** How long a screen's exit plays, in ms; screens without one leave at
 *  once. */
export const START_EXITS: Partial<Record<Theme, number>> = {
  rabbit: 520,
  steamboat: 400,
}

/** Starts fetching a theme's start screen ahead of time. */
export const preloadStartScreen = (theme: Theme) => void load[theme]()
