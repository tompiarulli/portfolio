/** Colours already resolved, by the CSS they came from. The backdrops ask
 *  every frame, so each token is only painted once. */
const cache = new Map<string, [number, number, number]>()
let ctx: CanvasRenderingContext2D | null | undefined

/** Any CSS colour a token might hold (hex, rgb(), oklch() and so on) to
 *  0..255 sRGB channels. The browser parses it: the colour is painted on a
 *  canvas and the pixel read back. Anything it can't parse reads as black.
 *  Browser only. */
export function rgb(color: string): [number, number, number] {
  const hit = cache.get(color)
  if (hit) return hit
  ctx ??= document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true })
  if (!ctx) return [0, 0, 0]
  ctx.clearRect(0, 0, 1, 1)
  // An invalid colour leaves the previous fill in place, so reset it first.
  ctx.fillStyle = '#000'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  const channels: [number, number, number] = [r, g, b]
  cache.set(color, channels)
  return channels
}
