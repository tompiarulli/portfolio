import { Window } from '#/components/Window'
import { site } from '#/lib/site'

export function Player() {
  return (
    <Window title="Player" x={-30} y={0} width={480}>
      <p>{site.player}</p>
    </Window>
  )
}
