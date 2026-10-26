import { BuildLine, Thin, Title } from '#/components/start/parts'

/** OUTATIME's start screen: a game's heads-up display over the grid. The
 *  title in electric blue with the version in pink brush script, and the
 *  prompt boxed in a royal blue rule in the title's wide capitals. The
 *  title flies in, the version writes itself in, and the prompt drops into
 *  place. */
export default function TravelerStart() {
  return (
    <>
      {/* The filter the version's tokens point at. */}
      <svg aria-hidden className="absolute size-0">
        <Thin id="script-thin" radius={1.6} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[7vh] px-4">
        <div className="fly-in">
          <Title />
        </div>
        <p
          aria-hidden
          className="drop-in border-2 border-(--start-title-edge) bg-(--off) px-[16px] py-[8px] pl-[calc(16px+0.25em)] font-(family-name:--start-title-font) text-[12px] tracking-[0.25em] text-(--start-title-1) uppercase sm:text-[14px]"
        >
          Press Any Key to Start
        </p>
      </div>
      <BuildLine />
    </>
  )
}
