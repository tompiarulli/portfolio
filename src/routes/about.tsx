import { createFileRoute } from '@tanstack/react-router'
import { Window } from '#/components/Window'
import { site } from '#/lib/site'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: `About - ${site.title}` }] }),
  component: About,
})

function About() {
  return (
    <Window title={`About ${site.name}`} x={120} y={70} width={520}>
      <div className="flex gap-4">
        <div className="inset-well flex size-24 shrink-0 items-center justify-center text-4xl">
          ☺
        </div>
        <div>
          <h1 className="font-title text-xl">{site.name}</h1>
          <p className="mt-2">
            Write a short bio here. Keep it to a few lines; the window scrolls
            if it must.
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-dotted border-black pt-3">
        <dt className="font-title">System</dt>
        <dd>{site.os}</dd>
        <dt className="font-title">Built with</dt>
        <dd>React 19, TanStack Start, Tailwind 4, Vercel</dd>
      </dl>
    </Window>
  )
}
