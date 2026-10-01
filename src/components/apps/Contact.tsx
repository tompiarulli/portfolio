import { Window } from '#/components/Window'
import { Button } from '#/components/Button'
import { profiles, site } from '#/lib/site'

export function Contact() {
  return (
    <Window title="Contact" right x={-104} width={400}>
      <p>Best way to reach me is email.</p>
      <a href={`mailto:${site.email}`} className="mt-3 inline-block">
        <Button accent>{site.email}</Button>
      </a>
      <ul className="mt-5 border-t border-(--ink)">
        {profiles.map((p) => (
          <li key={p.url} className="border-b border-dotted border-(--ink)">
            <a
              href={p.url}
              rel="me"
              className="flex justify-between gap-4 px-1 py-1.5 outline-none hover:bg-(--tertiary) hover:text-(--on-tertiary) focus-visible:bg-(--tertiary) focus-visible:text-(--on-tertiary)"
            >
              <span className="font-title">{p.label}</span>
              <span className="truncate">{p.handle}</span>
            </a>
          </li>
        ))}
      </ul>
    </Window>
  )
}
