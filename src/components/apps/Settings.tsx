import { useEffect, useState } from 'react'
import { Window } from '#/components/Window'
import { DEFAULT_THEME, THEMES, applyTheme, currentTheme } from '#/lib/theme'
import type { Backdrop, Theme } from '#/lib/theme'

export function Settings() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  useEffect(() => setTheme(currentTheme()), [])
  const pick = (t: Theme) => {
    setTheme(t)
    applyTheme(t)
  }

  return (
    <Window title="Settings" x={50} y={10} width={420}>
      <fieldset className="border border-(--ink) p-3">
        <legend className="px-1 font-title">Theme</legend>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <ThemeTile key={t.id} theme={t} on={theme === t.id} pick={pick} />
          ))}
        </div>
      </fieldset>
    </Window>
  )
}

function ThemeTile({
  theme: t,
  on,
  pick,
}: {
  theme: (typeof THEMES)[number]
  on: boolean
  pick: (theme: Theme) => void
}) {
  return (
    <label className="cursor-pointer border border-(--ink) outline-offset-2 has-focus-visible:outline-2 has-focus-visible:outline-(--ink)">
      <input
        type="radio"
        name="theme"
        value={t.id}
        checked={on}
        onChange={() => pick(t.id)}
        className="sr-only"
      />
      <ThemePreview theme={t.id} backdrop={t.backdrop} />
      <span
        className={`block border-t border-(--ink) py-1 text-center transition-colors duration-150 ${
          on ? 'bg-(--accent) text-(--on-accent)' : ''
        }`}
      >
        {t.label}
      </span>
    </label>
  )
}

/** A static screen of glyphs standing in for the code rain. */
const RAIN_PREVIEW =
  'K7@Q2#VZ8X&M4R+PJ9$L0N=T3<W6YH>A5*FD1;S/G8B:C#E2U@QX7M4&RZ9KV$P0L+JN3T=W6<YH5>AF*D1S;G/B8:CE#U2'

/** A still patch of the night sky, as an opacity mask painted in --warp:
 *  single-pixel stars at three brightnesses and a few
 *  crosses, like the desktop's caught mid-twinkle. One unit per CSS
 *  pixel. */
const SKY_PREVIEW = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='64' shape-rendering='crispEdges'>" +
    "<path fill-opacity='.3' d='M59 39h1v1h-1zM47 17h1v1h-1zM17 11h1v1h-1zM110 43h1v1h-1zM0 21h1v1h-1zM64 29h1v1h-1zM114 38h1v1h-1zM10 21h1v1h-1zM70 39h1v1h-1zM89 2h1v1h-1zM93 24h1v1h-1zM21 45h1v1h-1zM57 46h1v1h-1zM54 10h1v1h-1zM21 15h1v1h-1zM6 7h1v1h-1zM16 32h1v1h-1zM111 37h1v1h-1zM8 44h1v1h-1zM49 47h1v1h-1zM113 6h1v1h-1zM37 13h1v1h-1zM86 14h1v1h-1zM92 26h1v1h-1zM113 5h1v1h-1zM98 17h1v1h-1zM26 25h1v1h-1zM35 21h1v1h-1zM103 2h1v1h-1zM25 45h1v1h-1zM113 0h1v1h-1zM112 26h1v1h-1zM7 24h1v1h-1zM108 31h1v1h-1zM17 1h1v1h-1zM30 27h1v1h-1zM94 7h1v1h-1zM76 0h1v1h-1zM15 37h1v1h-1zM25 12h1v1h-1zM42 0h1v1h-1zM114 5h1v1h-1zM17 34h1v1h-1zM2 32h1v1h-1zM10 36h1v1h-1zM63 34h1v1h-1zM25 26h1v1h-1zM8 25h1v1h-1z'/>" +
    "<path fill-opacity='.6' d='M24 40h1v1h-1zM97 5h1v1h-1zM89 37h1v1h-1zM18 11h1v1h-1zM77 46h1v1h-1zM5 3h1v1h-1zM34 35h1v1h-1zM87 38h1v1h-1zM109 9h1v1h-1zM95 17h1v1h-1zM94 36h1v1h-1zM4 7h1v1h-1zM111 45h1v1h-1zM51 15h1v1h-1zM20 39h1v1h-1zM64 2h1v1h-1zM94 23h1v1h-1zM108 43h1v1h-1zM66 37h1v1h-1zM72 44h1v1h-1zM11 22h1v1h-1zM14 37h1v1h-1zM46 28h1v1h-1zM26 25h1v1h-1z'/>" +
    "<path d='M25 36h1v1h-1zM95 1h1v1h-1zM48 38h1v1h-1zM42 0h1v1h-1zM55 7h1v1h-1zM27 14h1v1h-1zM56 17h1v1h-1zM41 5h1v1h-1zM39 40h1v1h-1zM36 6h1v1h-1zM67 5h3v1h-3zM68 4h1v3h-1zM4 26h3v1h-3zM5 25h1v3h-1zM100 37h3v1h-3zM101 36h1v3h-1z'/>" +
    '</svg>',
)}")`

/** The moon as masks on a 22px grid, like the desktop's: its disc, the
 *  darker maria and lower right limb, and a dithered halo. */
const MOON_HALO = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' shape-rendering='crispEdges'><path d='M0 8h1v1H0zM0 10h1v1H0zM0 12h1v1H0zM2 4h1v1H2zM2 6h1v1H2zM2 8h1v1H2zM2 10h1v1H2zM2 12h1v1H2zM2 14h1v1H2zM2 16h1v1H2zM3 9h1v1H3zM3 11h1v1H3zM3 13h1v1H3zM4 2h1v1H4zM4 4h1v1H4zM4 6h1v1H4zM4 8h1v1H4zM4 10h1v1H4zM4 12h1v1H4zM4 14h1v1H4zM4 16h1v1H4zM4 18h1v1H4zM5 5h1v1H5zM5 7h1v1H5zM5 8h1v1H5zM5 9h1v1H5zM5 10h1v1H5zM5 11h1v1H5zM5 12h1v1H5zM5 13h1v1H5zM5 14h1v1H5zM5 15h1v1H5zM6 2h1v1H6zM6 4h1v1H6zM6 6h1v1H6zM6 7h1v1H6zM6 14h1v1H6zM6 16h1v1H6zM6 18h1v1H6zM6 20h1v1H6zM7 5h1v1H7zM7 6h1v1H7zM7 15h1v1H7zM7 16h1v1H7zM7 17h1v1H7zM8 0h1v1H8zM8 2h1v1H8zM8 4h1v1H8zM8 5h1v1H8zM8 16h1v1H8zM8 18h1v1H8zM8 20h1v1H8zM9 3h1v1H9zM9 4h1v1H9zM9 5h1v1H9zM9 16h1v1H9zM9 17h1v1H9zM10 0h1v1H10zM10 2h1v1H10zM10 4h1v1H10zM10 5h1v1H10zM10 16h1v1H10zM10 18h1v1H10zM10 20h1v1H10zM11 3h1v1H11zM11 4h1v1H11zM11 5h1v1H11zM11 16h1v1H11zM11 17h1v1H11zM12 0h1v1H12zM12 2h1v1H12zM12 4h1v1H12zM12 5h1v1H12zM12 16h1v1H12zM12 18h1v1H12zM12 20h1v1H12zM13 3h1v1H13zM13 4h1v1H13zM13 5h1v1H13zM13 16h1v1H13zM13 17h1v1H13zM14 2h1v1H14zM14 4h1v1H14zM14 6h1v1H14zM14 15h1v1H14zM14 16h1v1H14zM14 18h1v1H14zM14 20h1v1H14zM15 5h1v1H15zM15 6h1v1H15zM15 7h1v1H15zM15 14h1v1H15zM15 15h1v1H15zM15 17h1v1H15zM16 2h1v1H16zM16 4h1v1H16zM16 6h1v1H16zM16 8h1v1H16zM16 9h1v1H16zM16 10h1v1H16zM16 11h1v1H16zM16 12h1v1H16zM16 13h1v1H16zM16 14h1v1H16zM16 16h1v1H16zM16 18h1v1H16zM17 7h1v1H17zM17 8h1v1H17zM17 9h1v1H17zM17 10h1v1H17zM17 11h1v1H17zM17 12h1v1H17zM17 13h1v1H17zM17 15h1v1H17zM18 4h1v1H18zM18 6h1v1H18zM18 8h1v1H18zM18 10h1v1H18zM18 12h1v1H18zM18 14h1v1H18zM18 16h1v1H18zM18 18h1v1H18zM20 6h1v1H20zM20 8h1v1H20zM20 10h1v1H20zM20 12h1v1H20zM20 14h1v1H20z'/></svg>",
)}")`
const MOON_DISC = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' shape-rendering='crispEdges'><path d='M6 8h1v1H6zM6 9h1v1H6zM6 10h1v1H6zM6 11h1v1H6zM6 12h1v1H6zM6 13h1v1H6zM7 7h1v1H7zM7 8h1v1H7zM7 9h1v1H7zM7 10h1v1H7zM7 11h1v1H7zM7 12h1v1H7zM7 13h1v1H7zM7 14h1v1H7zM8 6h1v1H8zM8 7h1v1H8zM8 8h1v1H8zM8 9h1v1H8zM8 10h1v1H8zM8 11h1v1H8zM8 12h1v1H8zM8 13h1v1H8zM8 14h1v1H8zM8 15h1v1H8zM9 6h1v1H9zM9 7h1v1H9zM9 8h1v1H9zM9 9h1v1H9zM9 10h1v1H9zM9 11h1v1H9zM9 12h1v1H9zM9 13h1v1H9zM9 14h1v1H9zM9 15h1v1H9zM10 6h1v1H10zM10 7h1v1H10zM10 8h1v1H10zM10 9h1v1H10zM10 10h1v1H10zM10 11h1v1H10zM10 12h1v1H10zM10 13h1v1H10zM10 14h1v1H10zM10 15h1v1H10zM11 6h1v1H11zM11 7h1v1H11zM11 8h1v1H11zM11 9h1v1H11zM11 10h1v1H11zM11 11h1v1H11zM11 12h1v1H11zM11 13h1v1H11zM11 14h1v1H11zM11 15h1v1H11zM12 6h1v1H12zM12 7h1v1H12zM12 8h1v1H12zM12 9h1v1H12zM12 10h1v1H12zM12 11h1v1H12zM12 12h1v1H12zM12 13h1v1H12zM12 14h1v1H12zM12 15h1v1H12zM13 6h1v1H13zM13 7h1v1H13zM13 8h1v1H13zM13 9h1v1H13zM13 10h1v1H13zM13 11h1v1H13zM13 12h1v1H13zM13 13h1v1H13zM13 14h1v1H13zM13 15h1v1H13zM14 7h1v1H14zM14 8h1v1H14zM14 9h1v1H14zM14 10h1v1H14zM14 11h1v1H14zM14 12h1v1H14zM14 13h1v1H14zM14 14h1v1H14zM15 8h1v1H15zM15 9h1v1H15zM15 10h1v1H15zM15 11h1v1H15zM15 12h1v1H15zM15 13h1v1H15z'/></svg>",
)}")`
const MOON_MARIA = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' shape-rendering='crispEdges'><path d='M7 9h1v1H7zM8 8h1v1H8zM9 13h1v1H9zM11 11h1v1H11zM11 12h1v1H11zM11 15h1v1H11zM12 11h1v1H12zM12 14h1v1H12zM12 15h1v1H12zM13 13h1v1H13zM13 14h1v1H13zM13 15h1v1H13zM14 12h1v1H14zM14 13h1v1H14zM14 14h1v1H14zM15 11h1v1H15zM15 12h1v1H15zM15 13h1v1H15z'/></svg>",
)}")`

/** A row of pines along the sky's foot, like the desktop's treeline:
 *  stepped triangles of varied heights on a strip of ground, 160x20, as
 *  two masks: the whole silhouette, and its moonlit side (the moon is to
 *  the right), solid along the right edges and checker-dithered toward the
 *  trunk. Each tree is [centre x, height]. */
const [TREELINE, TREELINE_LIT] = (() => {
  const trees = [
    [3, 11],
    [10, 16],
    [17, 9],
    [24, 14],
    [32, 18],
    [40, 12],
    [47, 15],
    [55, 10],
    [62, 17],
    [70, 13],
    [78, 19],
    [86, 11],
    [93, 15],
    [101, 12],
    [109, 17],
    [117, 10],
    [124, 14],
    [132, 18],
    [140, 12],
    [148, 16],
    [156, 11],
  ]
  let d = 'M0 18h160v2H0z'
  let lit = ''
  const dot = (x: number, y: number) => (lit += `M${x} ${y}h1v1h-1z`)
  for (const [x, h] of trees)
    for (let y = 0; y < h; y++) {
      // Widen by one every other row, stepping back in at each tier.
      const half = Math.max(0, Math.floor(y / 2) - (y % 5 === 4 ? 1 : 0))
      const row = 20 - h + y
      d += `M${x - half} ${row}h${2 * half + 1}v1h-${2 * half + 1}z`
      for (let px = x + 1; px <= x + half; px++)
        if (px === x + half || (px + row) % 2 === 0) dot(px, row)
    }
  // A sparse dither along the ground's top row.
  for (let px = 0; px < 160; px += 4) dot(px, 18)
  return [d, lit].map(
    (path) =>
      `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='20' shape-rendering='crispEdges'><path d='${path}'/></svg>`,
      )}")`,
  )
})()

/** A tiny desktop: just the theme's backdrop. */
function ThemePreview({
  theme,
  backdrop,
}: {
  theme: Theme
  backdrop: Backdrop
}) {
  return (
    <span
      data-theme={theme}
      aria-hidden
      className="relative block h-16 overflow-hidden bg-(--desk)"
    >
      {backdrop === 'plain' ? (
        // Nothing to show of a plain desktop, so the theme's menu mark, at
        // twice its grid.
        <span
          className="logo absolute inset-0 m-auto text-(--on-title)"
          style={{
            width: 'calc(2 * var(--logo-size))',
            height: 'calc(2 * var(--logo-size))',
          }}
        />
      ) : backdrop === 'sky' ? (
        <>
          <span
            className="absolute inset-0 bg-(--warp) mask-no-repeat"
            style={{ maskImage: SKY_PREVIEW }}
          />
          {/* The moon, in its glow. */}
          <span className="absolute top-[4px] right-[14px] size-[22px]">
            {[
              ['bg-(--moon) opacity-40', MOON_HALO],
              ['bg-(--moon)', MOON_DISC],
              ['bg-(--desk) opacity-20', MOON_MARIA],
            ].map(([colour, mask]) => (
              <span
                key={mask}
                className={`absolute inset-0 mask-no-repeat ${colour}`}
                style={{ maskImage: mask }}
              />
            ))}
          </span>
          {/* The treeline, and its moonlit side. */}
          {[
            ['bg-(--pine)', TREELINE],
            ['bg-(--pine-lit)', TREELINE_LIT],
          ].map(([colour, mask]) => (
            <span
              key={mask}
              className={`absolute inset-x-0 bottom-0 h-[20px] mask-no-repeat ${colour}`}
              style={{ maskImage: mask }}
            />
          ))}
        </>
      ) : (
        <span className="absolute inset-0 font-mono text-[10px] leading-[10px] tracking-[1px] break-all text-(--warp)">
          {RAIN_PREVIEW.repeat(2)}
        </span>
      )}
    </span>
  )
}
