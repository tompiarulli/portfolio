import { FilmGrain } from '#/components/FilmGrain'
import type { StartScreenProps } from '#/components/start'
import { BuildLine, Title } from '#/components/start/parts'
import { site } from '#/lib/site'

/** Steamboat's start screen: a cartoon title card on the dimmed film,
 *  like a projected print. It irises in, jumps as the projector
 *  catches up, then flickers, with grain and the odd scratch; its prompt
 *  is held still. Starting fades it into the desktop. */
export default function SteamboatStart({ leaving }: StartScreenProps) {
  return (
    <>
      {/* Leaving fades the card and its dimming away, leaving the film as
          the desktop's backdrop. */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-400 ${leaving ? 'opacity-0' : ''}`}
      >
        {/* The film, dimmed under the lettering. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-(--start-dim)"
        />
        <div className="projector-start pointer-events-none absolute inset-0">
          <div className="film-flicker absolute inset-0">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6vh] px-4">
              <Presents />
              <Title />
              <div className="mt-[3vh] flex flex-col items-center gap-[10px]">
                <Credit />
                <Rule />
              </div>
            </div>
            <BuildLine />
          </div>
        </div>
        {/* The print's wear over the card: grain, and two scratches that
            flash down the frame now and then (hidden without motion). */}
        <FilmGrain />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="film-scratch absolute inset-y-0 left-[31%] w-px bg-(--start-text)" />
          <div className="film-scratch absolute inset-y-0 left-[72%] w-px bg-(--start-text) [animation-delay:-2.3s]" />
        </div>
      </div>
      <div
        aria-hidden
        className="iris-in pointer-events-none absolute inset-0"
      />
    </>
  )
}

/** Who presents it, above the title, in small spaced capitals. */
function Presents() {
  return (
    <p
      aria-hidden
      className="-mb-[4vh] pl-[0.35em] font-(family-name:--prompt-font) text-[11px] [font-weight:var(--prompt-weight)] tracking-[0.35em] text-(--prompt) uppercase [text-shadow:0.08em_0.1em_0_var(--start-title-shade)] sm:text-[13px]"
    >
      {site.name} {site.shutdown.presents}
    </p>
  )
}

/** A thin rule under the credit, a diamond at each end. */
function Rule() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 8"
      className="h-[8px] w-[min(240px,70vw)] text-(--prompt) [filter:drop-shadow(1.5px_2px_0_var(--start-title-shade))]"
    >
      <path d="M12 4h216" stroke="currentColor" strokeWidth="1" />
      <path d="M4 4l4-3 4 3-4 3zM228 4l4-3 4 3-4 3z" fill="currentColor" />
    </svg>
  )
}

/** The prompt set like a credit line on the card: small spaced capitals
 *  either side of one word in the title's face, all cast in its shadow.
 *  The small capitals carry their spacing on the left too, to balance. */
function Credit() {
  const small =
    'pl-[0.35em] font-(family-name:--prompt-font) text-[11px] [font-weight:var(--prompt-weight)] tracking-[0.35em] sm:text-[13px]'
  return (
    <p
      aria-hidden
      className="flex items-baseline gap-[10px] whitespace-nowrap text-(--prompt) uppercase [text-shadow:0.08em_0.1em_0_var(--start-title-shade)] sm:gap-[14px]"
    >
      <span className={small}>Press</span>
      <span className="font-(family-name:--start-title-font) text-[24px] tracking-[0.02em] sm:text-[30px]">
        Any Key
      </span>
      <span className={small}>to Start</span>
    </p>
  )
}
