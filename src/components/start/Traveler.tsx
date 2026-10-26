import {
  BuildLine,
  Dither,
  Prompt,
  Thin,
  Title,
} from '#/components/start/parts'

/** OUTATIME's start screen: an 80s arcade logo over the streaks, the title
 *  dithered and the version in brush script. */
export default function TravelerStart() {
  return (
    <>
      {/* Filters the theme's tokens point at. */}
      <svg aria-hidden className="absolute size-0">
        <Dither id="title-dither" levels={8} />
        <Thin id="script-thin" />
      </svg>
      <div className="fade-in pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[8vh] px-4">
        <Title />
        <Prompt className="blink">Press Any Key to Start</Prompt>
      </div>
      <BuildLine />
    </>
  )
}
