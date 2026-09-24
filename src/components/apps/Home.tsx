import { Link } from '@tanstack/react-router'
import { Window } from '#/components/Window'
import { Button } from '#/components/Button'
import { site } from '#/lib/site'

export function Home() {
  return (
    <Window title={`Welcome to ${site.os}`} x={48} y={40} width={480}>
      <h1 className="font-title text-2xl leading-tight">{site.name}</h1>
      <p className="mt-1 text-base">{site.tagline}</p>
      <hr className="my-4 border-0 border-t border-dotted border-(--ink)" />
      <p>
        This desktop is a portfolio. Open an app from the dock, or drag this
        window around. Every page is prerendered HTML, so it should feel
        instant.
      </p>
      <div className="mt-4 flex gap-2">
        <Link to="/projects" preload="intent">
          <Button accent>View projects</Button>
        </Link>
        <Link to="/contact" preload="intent">
          <Button>Say hello</Button>
        </Link>
      </div>
    </Window>
  )
}
