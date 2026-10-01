// Ported from React Bits "Dither" (https://reactbits.dev/backgrounds/dither).
// The wave and dither shaders are merged into one pass on raw WebGL, so the
// site doesn't ship three, @react-three/fiber, or postprocessing. The canvas
// renders one texel per dither cell and CSS scales it up with pixelated
// sampling, which matches the original's pixel snapping at a fraction of the cost.
// Added: blockSize/bands/twoTone for a blocky, strictly two-colour variant,
// paletteLow/paletteHigh to map the grey levels onto a two-colour ramp, and
// warpDirection/warpStrength/drift to steer the motion.
import { useEffect, useRef } from 'react'

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec3 backgroundColor;
uniform vec2 mousePos;
uniform float enableMouseInteraction;
uniform float mouseRadius;
uniform float colorNum;
uniform float blockSize;
uniform float bands;
uniform float twoTone;
uniform vec3 paletteLow;
uniform vec3 paletteHigh;
uniform float usePalette;
uniform vec2 warpDirection;
uniform float warpStrength;
uniform vec2 drift;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

const int OCTAVES = 4;
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = waveFrequency;
  for (int i = 0; i < OCTAVES; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= waveAmplitude;
  }
  return value;
}

// Domain warp: the inner layer slides over time and bends the outer layer,
// which only moves if drift is set. Defaults reproduce the original.
float pattern(vec2 p) {
  vec2 p2 = p - time * waveSpeed * warpDirection;
  vec2 base = p - time * drift;
  return fbm(base + warpStrength * fbm(p2));
}

// Recursive Bayer 8x8 (same thresholds as the original's lookup table,
// which needs GLSL ES 3.0 array constructors).
float bayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  // One fragment per dither cell; resolution is in cells.
  vec2 cell = floor(gl_FragCoord.xy);
  // Sample the noise once per block so shapes get hard, stair-stepped edges.
  vec2 sampleCell = blockSize > 1.0
    ? (floor(cell / blockSize) + 0.5) * blockSize
    : cell;
  vec2 uv = sampleCell / resolution - 0.5;
  uv.x *= resolution.x / resolution.y;
  float f = pattern(uv);
  if (enableMouseInteraction > 0.5) {
    vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
    mouseNDC.x *= resolution.x / resolution.y;
    float dist = length(uv - mouseNDC);
    f -= 0.5 * (1.0 - smoothstep(0.0, mouseRadius, dist));
  }
  if (twoTone > 0.5) {
    // Posterise into flat bands, then Bayer-dither each band to exactly two
    // colours. A band's dot pattern is fixed in screen space, so pixels only
    // change where a band edge drifts past: no per-frame shimmer.
    float t = clamp(f, 0.0, 1.0);
    if (bands > 1.0) t = min(floor(t * bands) / (bands - 1.0), 1.0);
    gl_FragColor = vec4(t > bayer8(cell) ? waveColor : backgroundColor, 1.0);
    return;
  }
  vec3 color = mix(backgroundColor, waveColor, clamp(f, 0.0, 1.0));

  float threshold = bayer8(cell) - 0.25;
  float stepSize = 1.0 / (colorNum - 1.0);
  color += threshold * stepSize;
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float bias = mix(0.2, 0.0, smoothstep(0.45, 0.8, luminance));
  color = clamp(color - bias, 0.0, 1.0);
  color = floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
  if (usePalette > 0.5) {
    // Keep the dithered grey levels, recoloured between two theme colours.
    float level = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(paletteLow, paletteHigh, level);
  }
  gl_FragColor = vec4(color, 1.0);
}
`

export type DitherProps = {
  waveSpeed?: number
  waveFrequency?: number
  waveAmplitude?: number
  /** CSS hex colour. */
  waveColor?: string
  /** CSS hex colour. */
  backgroundColor?: string
  /** Levels per channel after dithering. */
  colorNum?: number
  /** Noise sampled once per block of this many dither cells; 1 is off. */
  blockSize?: number
  /** Posterise levels before dithering in two-tone mode; 0 is off. */
  bands?: number
  /** Output only backgroundColor or waveColor, dithered by brightness. */
  twoTone?: boolean
  /** Map black..white output onto paletteLow..paletteHigh (CSS hex). */
  paletteLow?: string
  paletteHigh?: string
  /** Direction the warp layer slides, [x, y]; [1, 1] is the original. */
  warpDirection?: readonly [number, number]
  /** How far the warp layer bends the shapes; 0 leaves plain noise. */
  warpStrength?: number
  /** Slide of the whole pattern per second, [x, y]; [0, 0] is off. */
  drift?: readonly [number, number]
  /** Dither cell size in CSS pixels. */
  pixelSize?: number
  disableAnimation?: boolean
  enableMouseInteraction?: boolean
  mouseRadius?: number
  fps?: number
  className?: string
}

/** "#rgb" or "#rrggbb" to 0..1 floats. */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  const n = parseInt(h, 16) || 0
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed')
  return s
}

export default function Dither({
  waveSpeed = 0.05,
  waveFrequency = 3,
  waveAmplitude = 0.3,
  waveColor = '#808080',
  backgroundColor = '#000000',
  colorNum = 4,
  blockSize = 1,
  bands = 0,
  twoTone = false,
  paletteLow,
  paletteHigh,
  warpDirection = [1, 1],
  warpStrength = 1,
  drift = [0, 0],
  pixelSize = 2,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 1,
  fps = 30,
  className = '',
}: DitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The render loop reads props from here, so prop changes never restart WebGL.
  const props = useRef({
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    waveColor,
    backgroundColor,
    colorNum,
    blockSize,
    bands,
    twoTone,
    paletteLow,
    paletteHigh,
    warpDirection,
    warpStrength,
    drift,
    pixelSize,
    disableAnimation,
    enableMouseInteraction,
    mouseRadius,
    fps,
  })
  props.current = {
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    waveColor,
    backgroundColor,
    colorNum,
    blockSize,
    bands,
    twoTone,
    paletteLow,
    paletteHigh,
    warpDirection,
    warpStrength,
    drift,
    pixelSize,
    disableAnimation,
    enableMouseInteraction,
    mouseRadius,
    fps,
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    })
    if (!canvas || !gl) return

    const program = gl.createProgram()
    const vs = compile(gl, gl.VERTEX_SHADER, vertexShader)
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader)
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    // One triangle that covers the viewport.
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(program, name)
    const loc = {
      resolution: u('resolution'),
      time: u('time'),
      waveSpeed: u('waveSpeed'),
      waveFrequency: u('waveFrequency'),
      waveAmplitude: u('waveAmplitude'),
      waveColor: u('waveColor'),
      backgroundColor: u('backgroundColor'),
      mousePos: u('mousePos'),
      enableMouseInteraction: u('enableMouseInteraction'),
      mouseRadius: u('mouseRadius'),
      colorNum: u('colorNum'),
      blockSize: u('blockSize'),
      bands: u('bands'),
      twoTone: u('twoTone'),
      paletteLow: u('paletteLow'),
      paletteHigh: u('paletteHigh'),
      usePalette: u('usePalette'),
      warpDirection: u('warpDirection'),
      warpStrength: u('warpStrength'),
      drift: u('drift'),
    }

    // One canvas pixel per dither cell; CSS stretches it back to full size.
    const resize = () => {
      const size = Math.max(1, props.current.pixelSize)
      canvas.width = Math.max(1, Math.round(canvas.clientWidth / size))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight / size))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    // The canvas sits behind windows, so track the pointer on window.
    // Stored in cells, y down, as the original shader expects.
    const mouse = { x: -1e4, y: -1e4 }
    const onPointerMove = (e: PointerEvent) => {
      const size = Math.max(1, props.current.pixelSize)
      mouse.x = e.clientX / size
      mouse.y = e.clientY / size
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    let frame = 0
    let last = 0
    const start = performance.now()
    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      if (document.hidden) return
      const p = props.current
      const interval = 1000 / Math.max(1, p.fps)
      if (now - last < interval) return
      last = now - ((now - last) % interval)

      gl.uniform2f(loc.resolution, canvas.width, canvas.height)
      if (!p.disableAnimation) gl.uniform1f(loc.time, (now - start) / 1000)
      gl.uniform1f(loc.waveSpeed, p.waveSpeed)
      gl.uniform1f(loc.waveFrequency, p.waveFrequency)
      gl.uniform1f(loc.waveAmplitude, p.waveAmplitude)
      gl.uniform3fv(loc.waveColor, hexToRgb(p.waveColor))
      gl.uniform3fv(loc.backgroundColor, hexToRgb(p.backgroundColor))
      gl.uniform2f(loc.mousePos, mouse.x, mouse.y)
      gl.uniform1f(loc.enableMouseInteraction, p.enableMouseInteraction ? 1 : 0)
      gl.uniform1f(loc.mouseRadius, p.mouseRadius)
      gl.uniform1f(loc.colorNum, p.colorNum)
      gl.uniform1f(loc.blockSize, p.blockSize)
      gl.uniform1f(loc.bands, p.bands)
      gl.uniform1f(loc.twoTone, p.twoTone ? 1 : 0)
      const palette = p.paletteLow && p.paletteHigh
      gl.uniform1f(loc.usePalette, palette ? 1 : 0)
      gl.uniform2f(loc.warpDirection, p.warpDirection[0], p.warpDirection[1])
      gl.uniform1f(loc.warpStrength, p.warpStrength)
      gl.uniform2f(loc.drift, p.drift[0], p.drift[1])
      if (palette) {
        gl.uniform3fv(loc.paletteLow, hexToRgb(p.paletteLow!))
        gl.uniform3fv(loc.paletteHigh, hexToRgb(p.paletteHigh!))
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`block size-full [image-rendering:pixelated] ${className}`}
    />
  )
}
