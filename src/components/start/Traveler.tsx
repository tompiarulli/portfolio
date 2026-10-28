import { BuildLine, Title } from '#/components/start/parts'

/** OUTATIME's start screen: a game's heads-up display over the grid. The
 *  title in orange capitals rushing into the distance, with the version in
 *  yellow glitched type, and the prompt glowing cyan in the title's face,
 *  like an arcade cabinet's attract screen. The title flies in, the
 *  version strikes on like lightning, and the prompt drops into place. */
export function Start() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[11vh] px-4">
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
    </>
  )
}

export { ShutDownCard as Down } from '#/components/start/parts'
