import { Window } from '#/components/Window'
import { site } from '#/lib/site'

export function Blog() {
  return (
    <Window title="Blog" x={0} y={10} width={480}>
      <p>{site.blog}</p>
    </Window>
  )
}
