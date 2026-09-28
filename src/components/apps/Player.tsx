import { Window } from '#/components/Window'
import { site } from '#/lib/site'

export function Player() {
  return (
    <Window title="Player" right x={-104} width={480}>
      <p>{site.player}</p>
    </Window>
  )
}
