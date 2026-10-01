import type { CSSProperties } from 'react'

/** A dock icon. The theme supplies either a mask painted in the text
 *  colour (--icon-<id>-mask) or the drawing itself (--icon-<id>-image);
 *  see the icon tokens in styles.css. */
const ICONS = ['about', 'contact', 'terminal', 'settings'] as const

export type DockIconId = (typeof ICONS)[number]

export function DockIcon({ id }: { id: DockIconId }) {
  return (
    <span
      aria-hidden
      data-dock-icon={id}
      className="dock-icon group-active:translate-y-px"
      style={
        {
          '--icon-mask': `var(--icon-${id}-mask, none)`,
          '--icon-image': `var(--icon-${id}-image, none)`,
        } as CSSProperties
      }
    />
  )
}
