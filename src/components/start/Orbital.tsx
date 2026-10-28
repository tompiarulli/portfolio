import type { CSSProperties } from 'react'

import { build } from '#/lib/build'
import { site } from '#/lib/site'

/** Orbital's start screen: clean and flat over the rings, one ruled panel
 *  with the version and build along its top, the title, and the prompt
 *  along its foot. The panel powers on like a display, its rows coming up
 *  in turn. */
export function Start() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 font-(family-name:--start-font) text-(--start-text)"
    >
      <div className="power-on w-[min(560px,100%)] border border-current bg-(--start-ground)">
        <p
          style={{ '--row': 0 } as CSSProperties}
          className="power-on-row flex items-center justify-between gap-4 border-b border-current px-[12px] py-[8px] text-[11px] tracking-[0.1em] sm:text-[12px]"
        >
          <span className="bg-(--start-text) px-[6px] font-semibold text-(--start-ground)">
            v{site.version}
          </span>
          <span className="truncate text-(--start-muted)">
            Build {build.commit}
            {build.date && ` (${build.date})`}
          </span>
        </p>
        <p
          style={{ '--row': 1 } as CSSProperties}
          className="power-on-row px-[12px] pt-[28px] pb-[32px] font-(family-name:--start-title-font) text-[64px] leading-[0.8] [font-weight:var(--start-title-weight)] tracking-(--start-title-tracking) sm:text-[104px]"
        >
          TomOS
        </p>
        {/* The prompt, in a ruled bar. */}
        <div
          style={{ '--row': 2 } as CSSProperties}
          className="power-on-row border-t border-current p-[12px]"
        >
          <p className="border border-current py-[6px] pl-[0.3em] text-center text-[11px] font-semibold tracking-[0.3em] whitespace-nowrap uppercase sm:text-[12px]">
            <Chevrons mark="‹" />
            {' Press any key to start '}
            <Chevrons mark="›" />
          </p>
        </div>
      </div>
    </div>
  )
}

/** Three chevrons either side of the prompt that fill in from the text
 *  outward, one at a time, then clear and start again, like a console
 *  waiting for input. Without motion they all show. */
function Chevrons({ mark }: { mark: '‹' | '›' }) {
  const steps = mark === '‹' ? [3, 2, 1] : [1, 2, 3]
  return (
    <>
      {steps.map((step) => (
        <span key={step} className={`chevron-${step}`}>
          {mark}
        </span>
      ))}
    </>
  )
}

export { ShutDownCard as Down } from '#/components/start/parts'
