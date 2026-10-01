import { useEffect, useRef, useState } from 'react'
import { SILK } from '#/components/Backdrop'
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
    <Window title="Settings" right x={-199} y={249} width={420}>
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

/** Fixed pseudo-random numbers in [0, 1), so previews match on server and
 *  client. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

const PREVIEW_ROWS = 7
const PREVIEW_COLUMNS = 32

/** A still of a drifting backdrop: `chars` scattered over a share of the
 *  cells. */
function scatter(chars: string, share: number, seed: number) {
  const next = seeded(seed)
  return Array.from({ length: PREVIEW_ROWS }, () =>
    Array.from({ length: PREVIEW_COLUMNS }, () =>
      next() < share ? chars[Math.floor(next() * chars.length)] : ' ',
    ).join(''),
  ).join('\n')
}

/** A still of the streaks: a run of trail glyphs in some rows. */
function streaks(seed: number) {
  const next = seeded(seed)
  return Array.from({ length: PREVIEW_ROWS }, () => {
    if (next() < 0.4) return ''
    const length = 5 + Math.floor(next() * 12)
    const start = Math.floor(next() * (PREVIEW_COLUMNS - length))
    return ' '.repeat(start) + '=-=~'.repeat(length).slice(0, length)
  }).join('\n')
}

/** A stand-in for the dither: shade glyphs filling in towards the bottom. */
function dither() {
  const ramp = ' ·░▒▓'
  return Array.from({ length: PREVIEW_ROWS }, (_, r) => {
    const level = (r / (PREVIEW_ROWS - 1)) * 0.9 * (ramp.length - 1)
    return Array.from({ length: PREVIEW_COLUMNS }, (__, c) => {
      const up = level % 1 > ((r * 3 + c * 7) % 16) / 16 ? 1 : 0
      return ramp[Math.min(Math.floor(level) + up, ramp.length - 1)]
    }).join('')
  }).join('\n')
}

/** "#rrggbb" to 0..255 channels. */
function channels(hex: string) {
  const n = parseInt(hex.trim().replace('#', ''), 16) || 0
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** How much of the desktop's silk the preview shows; lower is larger folds. */
const PREVIEW_SILK_ZOOM = 0.5

/** A still of the silk: the backdrop's own folds at time zero, in --desk
 *  and --warp. Drawn after mount, once the
 *  colours can be read; the server renders the plain --desk tile. */
function SilkPreview() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const style = getComputedStyle(canvas)
    const low = channels(style.getPropertyValue('--desk'))
    const high = channels(style.getPropertyValue('--warp'))
    const w = (canvas.width = Math.round(canvas.clientWidth * devicePixelRatio))
    const h = (canvas.height = Math.round(
      canvas.clientHeight * devicePixelRatio,
    ))
    const { scale, rotation, contrast, noiseIntensity } = SILK
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    // Closer in than the desktop, so the folds read at tile size.
    const zoom = scale * scale * PREVIEW_SILK_ZOOM
    const image = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // The shader's square uv, its y running up from the bottom.
        const u = (x / h) * zoom
        const v = ((h - y) / h) * zoom
        const tx = cos * u + sin * v
        const ty = -sin * u + cos * v + 0.03 * Math.sin(8 * tx)
        const fold =
          0.6 +
          0.4 *
            Math.sin(
              5 * (tx + ty + Math.cos(3 * tx + 5 * ty)) +
                Math.sin(20 * (tx + ty)),
            )
        const t = Math.min(
          1,
          Math.max(0, ((fold - 0.2) / 0.8 - 0.5) * contrast + 0.5),
        )
        // The shader's grain, the same hash of the pixel.
        const gx = Math.E * Math.sin(Math.E * x)
        const gy = Math.E * Math.sin(Math.E * (h - y))
        const g = gx * gy * (1 + x)
        const dim = ((g - Math.floor(g)) / 15) * noiseIntensity * 255
        const i = (y * w + x) * 4
        for (let k = 0; k < 3; k++)
          image.data[i + k] = low[k] + (high[k] - low[k]) * t - dim
        image.data[i + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  }, [])
  return <canvas ref={ref} className="absolute inset-0 size-full" />
}

const PREVIEWS: Record<Exclude<Backdrop, 'plain' | 'silk' | 'film'>, string> = {
  rain: RAIN_PREVIEW.repeat(2),
  stars: scatter('..··+*', 0.08, 7),
  streaks: streaks(88),
  snow: scatter('*·.+*', 0.2, 31),
  dust: scatter('·.·', 0.05, 11),
  dither: dither(),
}

const FILM_PREVIEW = scatter('··.│', 0.04, 19)

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
      ) : backdrop === 'silk' ? (
        <SilkPreview />
      ) : backdrop === 'film' ? (
        // A still of the film: the sepia frame darkening to the edges, with
        // a scratch and some dust.
        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--warp)_30%,var(--desk)_110%)] font-mono text-[10px] leading-[10px] tracking-[1px] whitespace-pre text-(--glint)">
          {FILM_PREVIEW}
        </span>
      ) : (
        <span
          className={`absolute inset-0 font-mono text-[10px] leading-[10px] tracking-[1px] text-(--warp) ${
            backdrop === 'rain' ? 'break-all' : 'whitespace-pre'
          }`}
        >
          {PREVIEWS[backdrop]}
        </span>
      )}
    </span>
  )
}
