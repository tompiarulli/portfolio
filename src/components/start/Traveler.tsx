import { useEffect, useState } from 'react'

import type { ShutDownProps, StartScreenProps } from '#/components/start'
import { BuildLine, Title } from '#/components/start/parts'
import { site } from '#/lib/site'

/** OUTATIME's shut down, like an arcade cabinet's game over: the words fly
 *  in over the grid in the title's glowing cyan, and a continue prompt
 *  drops in under them and counts down from nine, each number striking on
 *  bright. Nobody continues, so the picture tube switches off and the
 *  cabinet goes dark. */
export function Down({ onDone }: ShutDownProps) {
  const [count, setCount] = useState(CONTINUE)
  const [part, setPart] = useState<'over' | 'tube' | 'dark'>('over')
  useEffect(() => {
    const t =
      part === 'over'
        ? setTimeout(
            () => (count ? setCount(count - 1) : setPart('tube')),
            count === CONTINUE ? FIRST : TICK,
          )
        : setTimeout(part === 'tube' ? () => setPart('dark') : onDone, 500)
    return () => clearTimeout(t)
  }, [count, part, onDone])
  if (part !== 'over')
    return (
      <div className="absolute inset-0 bg-(--off)">
        {part === 'tube' && (
          <div aria-hidden className="tube-off absolute inset-0 bg-(--glint)" />
        )}
      </div>
    )
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8vh] bg-(--start-ground)/60 px-4 text-center font-(family-name:--start-title-font) uppercase">
      <p className="fly-in prompt-glow pl-[0.08em] text-[52px] leading-none tracking-[0.08em] sm:text-[96px]">
        {site.shutdown.gameOver}
      </p>
      <p className="flex [animation:drop-in_300ms_ease-out_800ms_both] items-center gap-[0.8em] pl-[0.25em] text-[16px] tracking-[0.25em] text-(--start-text) sm:text-[22px]">
        {site.shutdown.continue}
        <span
          // Strikes on again with each number.
          key={count}
          className="count-tick inline-block w-[1ch] text-[2em] text-(--script) tabular-nums"
        >
          {count}
        </span>
      </p>
    </div>
  )
}

/** OUTATIME's start screen: a game's heads-up display over the grid. The
 *  title in orange capitals rushing into the distance, with the version in
 *  yellow glitched type, and the prompt glowing cyan in the title's face,
 *  like an arcade cabinet's attract screen. It comes up out of the dark;
 *  the title flies in, the version strikes on like lightning, and the
 *  prompt drops into place. Leaving, the title rushes past as the streaks
 *  hit full speed (Streaks), and the screen flashes white; the desktop
 *  comes back out of the flash (see "Shut Down" in styles.css). */
export function Start({ leaving }: StartScreenProps) {
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[11vh] px-4 ${leaving ? 'fly-past' : ''}`}
      >
        <div className="fly-in">
          <Title taper />
        </div>
        <p
          aria-hidden
          className="drop-in prompt-glow pl-[0.25em] font-(family-name:--start-title-font) text-[15px] tracking-[0.25em] uppercase sm:text-[18px]"
        >
          Press Any Key to Start
        </p>
      </div>
      <BuildLine />
      <div aria-hidden className="from-dark absolute inset-0 bg-(--off)" />
      {leaving && (
        <div aria-hidden className="flash-in absolute inset-0 bg-(--glint)" />
      )}
    </>
  )
}

// The continue prompt counts down from this, waiting for the prompt to
// drop in before the first number, then a tick each.
const CONTINUE = 9
const FIRST = 1100
const TICK = 220
