import { createFileRoute } from '@tanstack/react-router'
import { Window } from '#/components/Window'
import { Button } from '#/components/Button'
import { site } from '#/lib/site'

export const Route = createFileRoute('/contact')({
  head: () => ({ meta: [{ title: `Contact - ${site.title}` }] }),
  component: Contact,
})

function Contact() {
  return (
    <Window title="Contact" x={200} y={100} width={400}>
      <p>Best way to reach me is email.</p>
      <a href={`mailto:${site.email}`} className="mt-3 inline-block">
        <Button accent>{site.email}</Button>
      </a>
    </Window>
  )
}
