import { Window } from '#/components/Window'
import { site } from '#/lib/site'

export function Albums() {
  return (
    <Window title="Albums" x={20} y={20} width={480}>
      <p>{site.albums}</p>
    </Window>
  )
}
