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
type SequenceProps = { stage: Stage; onDone: () => void }

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
      default: ({ stage, onDone }: SequenceProps) =>
        stage === 'closing' ? null : stage === 'down' ? (
          <Down onDone={onDone} />
        ) : (
          <Start leaving={stage === 'leaving'} />
        ),
    }
  })

export const SEQUENCES: Record<Theme, ComponentType<SequenceProps>> = {
  orbital: sequence('orbital'),
  rabbit: sequence('rabbit'),
  steamboat: sequence('steamboat'),
  traveler: sequence('traveler'),
}

/** How long each start screen's exit plays, in ms; none without motion. */
export const START_EXITS: Partial<Record<Theme, number>> = {
  rabbit: 520,
  steamboat: 400,
}

/** Starts fetching a theme's sequence ahead of time. */
export const preloadSequence = (theme: Theme) => void load[theme]()
