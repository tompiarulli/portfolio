import { Link } from '@tanstack/react-router'
import { Window } from '#/components/Window'
import { projects } from '#/lib/site'

export function Work() {
  return (
    <Window title="Work" x={0} y={-30} width={640} height={420}>
      <table className="w-full border-collapse text-left">
        <thead className="font-title">
          <tr className="border-b border-(--ink)">
            <th className="py-1 pr-4">Name</th>
            <th className="py-1 pr-4">Year</th>
            <th className="py-1">Stack</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr
              key={p.slug}
              className="border-b border-dotted border-(--ink) hover:bg-(--tertiary) hover:text-(--on-tertiary)"
            >
              <td className="py-1.5 pr-4">
                <Link
                  to="/work/$slug"
                  params={{ slug: p.slug }}
                  preload="intent"
                  className="underline"
                >
                  {p.name}
                </Link>
              </td>
              <td className="py-1.5 pr-4 tabular-nums">{p.year}</td>
              <td className="py-1.5">{p.stack.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Window>
  )
}
