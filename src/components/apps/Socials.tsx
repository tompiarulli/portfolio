import { Window } from '#/components/Window'
import { profiles } from '#/lib/site'

export function Socials() {
  return (
    <Window title="Socials" right x={-104} width={320}>
      <ul className="border-t border-(--ink)">
        {profiles.map((p) => (
          <li key={p.url} className="border-b border-dotted border-(--ink)">
            <a
              href={p.url}
              rel="me"
              className="flex justify-between gap-4 px-1 py-1.5 outline-none hover:bg-(--accent) hover:text-(--on-accent) focus-visible:bg-(--accent) focus-visible:text-(--on-accent)"
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
