import { Link } from '@tanstack/react-router'
import { Window } from '#/components/Window'
import { Button } from '#/components/Button'
import { site } from '#/lib/site'

export function About() {
  return (
    <Window title="About" x={-60} y={-20} width={480}>
      <div className="flex gap-4">
        <div className="inset-well flex size-24 shrink-0 items-center justify-center text-4xl">
          ☺
        </div>
        <div>
          <h1 className="font-title text-2xl leading-tight">{site.name}</h1>
          <p className="mt-1 text-base">{site.tagline}</p>
        </div>
      </div>
      <hr className="my-4 border-0 border-t border-dotted border-(--ink)" />
      <p>{site.bio}</p>
      <div className="mt-4 flex gap-2">
        <Link to="/work" preload="intent">
          <Button accent>View work</Button>
        </Link>
        <Link to="/contact" preload="intent">
          <Button>Say hello</Button>
        </Link>
      </div>
    </Window>
  )
}
