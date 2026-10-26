import { lazy } from 'react'
import type { ComponentType } from 'react'

import type { Theme } from '#/lib/theme'

// Each theme's start screen is its own chunk; only the current theme's is
// fetched, as Restart begins.
const load: Record<Theme, () => Promise<{ default: ComponentType }>> = {
  orbital: () => import('#/components/start/Orbital'),
  rabbit: () => import('#/components/start/Rabbit'),
  steamboat: () => import('#/components/start/Steamboat'),
  traveler: () => import('#/components/start/Traveler'),
}

export const START_SCREENS: Record<Theme, ComponentType> = {
  orbital: lazy(load.orbital),
  rabbit: lazy(load.rabbit),
  steamboat: lazy(load.steamboat),
  traveler: lazy(load.traveler),
}

/** Starts fetching a theme's start screen ahead of time. */
export const preloadStartScreen = (theme: Theme) => void load[theme]()
