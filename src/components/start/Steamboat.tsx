import { BuildLine, Prompt, Title } from '#/components/start/parts'

/** Steamboat's start screen: a cartoon title card on the dimmed film. */
export default function SteamboatStart() {
  return (
    <>
      {/* The film, dimmed under the lettering. */}
      <div
        aria-hidden
        className="fade-in pointer-events-none absolute inset-0 bg-(--start-dim)"
      />
      <div className="fade-in pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[8vh] px-4">
        <Title />
        <Prompt className="blink">Press Any Key to Start</Prompt>
      </div>
      <BuildLine />
    </>
  )
}
