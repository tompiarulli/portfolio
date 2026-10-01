import { Window } from '#/components/Window'
import { build } from '#/lib/build'
import { site } from '#/lib/site'

export function SystemInfo() {
  return (
    <Window title="System" x={-80} y={-10} width={320}>
      <p className="font-title text-base">{site.os}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-dotted border-(--ink) pt-3">
        <dt className="font-title">Version</dt>
        <dd>
          {build.commit}
          {build.date && ` (${build.date})`}
        </dd>
        <dt className="font-title">Built with</dt>
        <dd>{site.builtWith}</dd>
      </dl>
    </Window>
  )
}
