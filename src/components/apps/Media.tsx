import { Window } from '#/components/Window'
import { site } from '#/lib/site'

export function Media() {
  return (
    <Window title="Media" right x={-104} width={480}>
      <p>{site.media}</p>
    </Window>
  )
}
