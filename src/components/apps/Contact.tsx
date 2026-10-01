import { Window } from '#/components/Window'
import { Button } from '#/components/Button'
import { site } from '#/lib/site'

export function Contact() {
  return (
    <Window title="Contact" x={40} y={40} width={400}>
      <p>Best way to reach me is email.</p>
      <a href={`mailto:${site.email}`} className="mt-3 inline-block">
        <Button accent>{site.email}</Button>
      </a>
    </Window>
  )
}
