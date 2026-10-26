import { BuildLine, Prompt, Title } from '#/components/start/parts'

/** Orbital's start screen: clean and flat over the rings. */
export default function OrbitalStart() {
  return (
    <>
      <div className="fade-in pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[8vh] px-4">
        <Title />
        <Prompt className="blink">Press Any Key to Start</Prompt>
      </div>
      <BuildLine />
    </>
  )
}
