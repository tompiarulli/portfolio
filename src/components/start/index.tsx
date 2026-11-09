import { lazy } from 'react'
import type { ComponentType } from 'react'

import type { Stage } from '#/lib/power'
import type { Theme } from '#/lib/theme'

/** Each theme plays Restart its own way: its shut down, once the chrome
 *  has closed, which says when it's done; then its start screen, which is
 *  told when it's leaving, so it can play its exit before the desktop
 *  boots back (each theme's boot is CSS, under "Shut Down" in
 *  styles.css). */
export type ShutDownProps = { onDone: () => void }
export type StartScreenProps = { leaving: boolean }
type Sequence = {
  Down: ComponentType<ShutDownProps>
  Start: ComponentType<StartScreenProps>
}
/** `begun` once the theme's shut down has started, which can be before
 *  the chrome has finished closing (DOWN_AT). */
type SequenceProps = { stage: Stage; begun: boolean; onDone: () => void }

// Each theme's sequence is its own chunk; only the current theme's is
// fetched, while the browser is idle (see MenuBar) or as Restart begins.
const load: Record<Theme, () => Promise<Sequence>> = {
  orbital: () => import('#/components/start/Orbital'),
  rabbit: () => import('#/components/start/Rabbit'),
  steamboat: () => import('#/components/start/Steamboat'),
  traveler: () => import('#/components/start/Traveler'),
}

/** One component for the whole sequence, so it loads once and never
 *  suspends between its stages. */
const sequence = (theme: Theme) =>
  lazy(async () => {
    const { Down, Start } = await load[theme]()
    return {
      default: ({ stage, begun, onDone }: SequenceProps) => {
        if (stage === 'closing' || stage === 'down')
          return begun ? <Down onDone={onDone} /> : null
        return <Start leaving={stage === 'leaving'} />
      },
    }
  })

export const SEQUENCES: Record<Theme, ComponentType<SequenceProps>> = {
  orbital: sequence('orbital'),
  rabbit: sequence('rabbit'),
  steamboat: sequence('steamboat'),
  traveler: sequence('traveler'),
}

/** How long the desktop chrome takes to close at Restart, in ms: the
 *  windows fly into the dock, then the dock and menu bar fold away
 *  (styles.css, under "Shut Down"). */
export const CLOSING = 500

/** How far into the close, in ms, a theme's shut down starts, for one that
 *  overlaps it; the rest start once the chrome has closed. */
export const DOWN_AT: Partial<Record<Theme, number>> = {
  // As the dock and menu bar finish folding, so the gauge rises as they go.
  traveler: 400,
}

/** How long each start screen's exit plays, in ms; none without motion. */
export const START_EXITS: Record<Theme, number> = {
  orbital: 700,
  rabbit: 520,
  steamboat: 450,
  traveler: 550,
}

/** Starts fetching a theme's sequence ahead of time. */
export const preloadSequence = (theme: Theme) => void load[theme]()
