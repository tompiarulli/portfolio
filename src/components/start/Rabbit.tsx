import { BuildLine, Dither, Prompt, Title } from '#/components/start/parts'

/** White Rabbit's start screen: a phosphor terminal over the code rain,
 *  the title dithered like a screen's scanlines. The title is drawn down
 *  the screen line by line, then the prompt typed out. */
export default function RabbitStart() {
  return (
    <>
      {/* Filters the theme's tokens point at. */}
      <svg aria-hidden className="absolute size-0">
        <Dither id="title-dither" levels={8} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[8vh] px-4">
        <div className="draw-down">
          <Title />
        </div>
        <Prompt className="type-on">Press Any Key to Start</Prompt>
      </div>
      <BuildLine />
    </>
  )
}
