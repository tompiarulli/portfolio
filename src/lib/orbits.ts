// The geometry of the orbital rings: circles tilted in 3D and projected
// flat. The backdrop draws it on a canvas; the Settings tile bakes a still
// of it into SVG.

/** A point on a ring: screen offset from the set's centre, and depth
 *  (-1 far .. 1 near). */
export type RingPoint = readonly [number, number, number]

/** Ring k of `count` at `t`, as a function from an angle round the ring to
 *  its projected point. Radii, and the points, are in the same units. */
export function ring(
  k: number,
  count: number,
  inner: number,
  outer: number,
  t: number,
) {
  const r = count > 1 ? inner + ((outer - inner) * k) / (count - 1) : inner
  // Camera distance for the perspective, past the outermost ring.
  const camera = outer * 3
  const turn = t * 0.6
  const ct = Math.cos(turn)
  const st = Math.sin(turn)
  // Mostly towards the viewer, so each ring reads as a flattened ellipse.
  const tilt = 1.15 + 0.25 * Math.sin(k * 1.7) + 0.08 * Math.sin(t + k)
  const roll = 0.45 * Math.sin(k * 2.3) + 0.05 * Math.cos(t * 0.8 + k)
  const cx1 = Math.cos(tilt)
  const sx1 = Math.sin(tilt)
  const cr = Math.cos(roll)
  const sr = Math.sin(roll)

  return (a: number): RingPoint => {
    let x = r * Math.cos(a)
    let y = r * Math.sin(a)
    let z = 0
    // Tilt about the horizontal axis.
    ;[y, z] = [y * cx1 - z * sx1, y * sx1 + z * cx1]
    // Roll about the view axis.
    ;[x, y] = [x * cr - y * sr, x * sr + y * cr]
    // The set's turn about the vertical.
    ;[x, z] = [x * ct + z * st, -x * st + z * ct]
    const s = camera / (camera - z)
    return [x * s, y * s, z / r]
  }
}

/** Where ring k's riding point is at `t`, as an angle round it. Inner
 *  rings ride faster, like real orbits; alternate ways round. */
export const rider = (k: number, t: number) =>
  t * (k % 2 ? 1 : -1) * (1.6 / Math.sqrt(1 + k)) + k * 2.1

/** How bright a point at `depth` is, from `far` behind to 1 in front. */
export const brightness = (depth: number, far: number) =>
  far + (1 - far) * (0.5 + 0.5 * depth)

/** The backdrop's settings for `backdrop: 'orbits'`; the Settings tile
 *  bakes its still from them too. */
export const ORBITS = {
  count: 7,
  /** Centre of the set, as fractions of the width and height. */
  center: [0.6, 0.55],
  /** Radius of the innermost and outermost rings, as fractions of the
   *  shorter screen side. */
  inner: 0.22,
  outer: 0.75,
  /** How fast the set turns, and the rings wobble and the points ride. */
  speed: 0.05,
  /** Brightness of the far half of each ring, against the near half. */
  far: 0.3,
  /** Line width in pixels. */
  lineWidth: 1,
  /** Radius of the riding points in pixels; 0 is none. */
  point: 2,
  fps: 30,
} as const
