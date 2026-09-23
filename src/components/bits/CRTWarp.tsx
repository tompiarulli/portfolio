// Ported from React Bits "CRT Warp" (https://reactbits.dev/backgrounds/crt-warp).
// The three.js scene is replaced with raw WebGL on a single fullscreen
// triangle so the site doesn't ship three. Additions to the original shader:
// - uDither, uBands, uInvert: optional 1-bit ordered dither on the final
//   colour, optionally with the two colours swapped
// - uStaticNoise: freeze the grain so it textures without flickering
// - uDiagonalRate, uRippleRate, uDriftRate, uBroadRate: run each layer of the
//   plasma on its own clock
// - randomStart: begin each visit at a different point in the cycle
import { useEffect, useRef } from 'react'

const vertexShader = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;

varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uBackgroundColor;
uniform float uCurvature;
uniform float uScanlineStrength;
uniform float uScanlineFrequency;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uBloom;
uniform float uBloomRadius;
uniform float uNoise;
uniform float uVignette;
uniform float uBrightness;
uniform float uPixelation;
uniform float uRgbShift;
uniform vec2 uPointer;
uniform float uMouseStrength;
uniform float uMouseReact;
uniform float uDither;
uniform float uBands;
uniform float uInvert;
uniform float uStaticNoise;
uniform float uDiagonalRate;
uniform float uRippleRate;
uniform float uDriftRate;
uniform float uBroadRate;

// Recursive Bayer matrix, 0..1 threshold per cell.
float bayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 crtCurve(vec2 uv, float radius) {
  vec2 p = (uv - 0.5) * 2.0;
  float safeRadius = max(radius, 1.415);
  float cornerScale = safeRadius / sqrt(max(safeRadius * safeRadius - 2.0, 0.001));
  p = safeRadius * p / sqrt(max(safeRadius * safeRadius - dot(p, p), 0.001));
  p /= cornerScale;
  return p * 0.5 + 0.5;
}

float referencePlasma(vec2 uv, float t) {
  float frequencyScale = max(uWaveFrequency / 2.2, 0.001);
  uv = (uv - 0.5) * frequencyScale + 0.5;

  float scanline = 0.5 - 0.5 * cos(uv.y * 3.14159265 * uScanlineFrequency);
  scanline = mix(1.0, scanline, uScanlineStrength);

  uv *= vec2(80.0, 24.0);
  uv = ceil(uv);
  uv /= vec2(80.0, 24.0);

  float amplitude = uWaveAmplitude / 0.28;
  float field = 0.0;
  // Each layer reads the clock at its own rate (all 1 = the original).
  float tb = t * uBroadRate;
  float td = t * uDiagonalRate;
  float tc = t * uDriftRate;
  float tr = t * uRippleRate;

  // Broad background waves.
  field += 0.7 * sin(0.5 * uv.x + tb / 5.0);
  field += 3.0 * sin(1.6 * uv.y + tb / 5.0);
  // Main diagonal wave; its direction turns over time too.
  field += sin(10.0 * (uv.y * sin(td / 2.0) + uv.x * cos(td / 5.0)) + td / 2.0);

  // Ring ripples around a wandering center.
  float cx = uv.x + 0.5 * sin(tc / 2.0);
  float cy = uv.y + 0.5 * cos(tc / 4.0);
  field += 0.4 * sin(sqrt(100.0 * cx * cx + 100.0 * cy * cy + 1.0) + tr);
  field += 0.9 * sin(sqrt(75.0 * cx * cx + 25.0 * cy * cy + 1.0) + tr);
  field -= 1.4 * sin(sqrt(256.0 * cx * cx + 25.0 * cy * cy + 1.0) + tr);
  field += 0.3 * sin(0.5 * uv.y + uv.x + sin(tr));

  return scanline * floor(3.0 * (0.5 + 0.499 * sin(field * amplitude))) / 3.0;
}

void main() {
  vec2 uv = vUv;
  if (uPixelation > 1.001) {
    vec2 cells = max(uResolution / uPixelation, vec2(1.0));
    uv = (floor(uv * cells) + 0.5) / cells;
  }

  float curveRadius = 1.1 + 0.42 / max(uCurvature, 0.001);
  if (uMouseReact > 0.5) {
    curveRadius *= exp(-uPointer.y * uMouseStrength * 0.4);
  }
  vec2 curvedUv = crtCurve(uv, curveRadius);
  if (uMouseReact > 0.5) {
    curvedUv.x -= uPointer.x * uMouseStrength * 0.035;
  }

  float signal = referencePlasma(curvedUv, uTime);
  float radius = 0.01 * uBloomRadius;
  float glow = signal * 0.2;
  glow += referencePlasma(curvedUv + vec2(radius, 0.0), uTime) * 0.12;
  glow += referencePlasma(curvedUv - vec2(radius, 0.0), uTime) * 0.12;
  glow += referencePlasma(curvedUv + vec2(0.0, radius), uTime) * 0.12;
  glow += referencePlasma(curvedUv - vec2(0.0, radius), uTime) * 0.12;
  glow += referencePlasma(curvedUv + vec2(radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv - vec2(radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv + vec2(radius, -radius), uTime) * 0.08;
  glow += referencePlasma(curvedUv + vec2(-radius, radius), uTime) * 0.08;

  float redSignal = referencePlasma(curvedUv + vec2(uRgbShift, 0.0), uTime);
  float blueSignal = referencePlasma(curvedUv - vec2(uRgbShift, 0.0), uTime);
  vec3 channelSignal = vec3(redSignal, signal, blueSignal);
  vec3 waveColor = uColor * (0.3 + signal * 0.7 + glow * uBloom * 0.65);
  waveColor += (channelSignal - signal) * 0.42;

  float edge = clamp(1.0 - dot(vUv - 0.5, vUv - 0.5) * 2.0, 0.0, 1.0);
  float edgeFade = mix(1.0, smoothstep(0.0, 1.0, edge), uVignette);
  float waveMask = clamp(signal * 0.82 + glow * 0.52, 0.0, 1.0) * edgeFade;

  float seed = uStaticNoise > 0.5 ? 0.0 : fract(uTime) * 173.0;
  float grain = hash21(gl_FragCoord.xy + vec2(seed));
  waveColor = max(waveColor * uBrightness, vec3(0.0));
  vec3 color = mix(uBackgroundColor, waveColor, waveMask);
  color += (grain - 0.5) * uNoise;
  if (uDither > 0.0) {
    // Snap to exactly two colours: where the pixel sits between background
    // and wave colour, against a Bayer threshold. uDither is the cell size.
    vec3 lw = vec3(0.299, 0.587, 0.114);
    float lb = dot(uBackgroundColor, lw);
    float t = (dot(color, lw) - lb) / max(dot(uColor, lw) - lb, 0.001);
    // Flat bands give each region one fixed dot pattern instead of a
    // slightly different texture per shade.
    if (uBands > 1.0) {
      t = min(floor(clamp(t, 0.0, 1.0) * uBands) / (uBands - 1.0), 1.0);
    }
    float threshold = bayer8(gl_FragCoord.xy / uDither);
    // Invert swaps the output only, so a light variant is an exact
    // negative of the dark one instead of re-running the glow maths.
    bool on = (t > threshold) != (uInvert > 0.5);
    color = on ? uColor : uBackgroundColor;
  }
  gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
}
`

export type CRTWarpProps = {
  color?: string
  backgroundColor?: string
  speed?: number
  curvature?: number
  scanlineStrength?: number
  scanlineFrequency?: number
  waveAmplitude?: number
  waveFrequency?: number
  bloom?: number
  bloomRadius?: number
  noise?: number
  vignette?: number
  brightness?: number
  pixelation?: number
  rgbShift?: number
  /** Dither cell size in pixels; 0 keeps full colour. */
  dither?: number
  /** Posterise levels before dithering; 0 is off. */
  bands?: number
  /** With dither, swap the two output colours (light-on-dark to dark-on-light). */
  invert?: boolean
  /** Freeze the grain pattern instead of re-rolling it every frame. */
  staticNoise?: boolean
  /** Start the clock at a random point so visits don't all open on the same frame and direction. */
  randomStart?: boolean
  /** Per-layer speed multipliers on top of `speed`; 1 is the original. */
  diagonalRate?: number
  rippleRate?: number
  driftRate?: number
  broadRate?: number
  mouseReact?: boolean
  mouseStrength?: number
  dpr?: number
  fps?: number
  paused?: boolean
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

export default function CRTWarp({
  color = '#c755f7',
  backgroundColor = '#05010a',
  speed = 0.5,
  curvature = 0.25,
  scanlineStrength = 0.25,
  scanlineFrequency = 200,
  waveAmplitude = 0.3,
  waveFrequency = 2.5,
  bloom = 1.5,
  bloomRadius = 1,
  noise = 0.1,
  vignette = 0,
  brightness = 1.25,
  pixelation = 1,
  rgbShift = 0.015,
  dither = 0,
  bands = 0,
  invert = false,
  staticNoise = false,
  randomStart = false,
  diagonalRate = 1,
  rippleRate = 1,
  driftRate = 1,
  broadRate = 1,
  mouseReact = true,
  mouseStrength = 0.5,
  dpr = 1,
  fps = 30,
  paused = false,
  className = '',
}: CRTWarpProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The render loop reads props from here, so prop changes never restart WebGL.
  const props = useRef({
    color,
    backgroundColor,
    speed,
    curvature,
    scanlineStrength,
    scanlineFrequency,
    waveAmplitude,
    waveFrequency,
    bloom,
    bloomRadius,
    noise,
    vignette,
    brightness,
    pixelation,
    rgbShift,
    dither,
    bands,
    invert,
    staticNoise,
    randomStart,
    diagonalRate,
    rippleRate,
    driftRate,
    broadRate,
    mouseReact,
    mouseStrength,
    dpr,
    fps,
    paused,
  })
  props.current = {
    color,
    backgroundColor,
    speed,
    curvature,
    scanlineStrength,
    scanlineFrequency,
    waveAmplitude,
    waveFrequency,
    bloom,
    bloomRadius,
    noise,
    vignette,
    brightness,
    pixelation,
    rgbShift,
    dither,
    bands,
    invert,
    staticNoise,
    randomStart,
    diagonalRate,
    rippleRate,
    driftRate,
    broadRate,
    mouseReact,
    mouseStrength,
    dpr,
    fps,
    paused,
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
      resolution: u('uResolution'),
      time: u('uTime'),
      color: u('uColor'),
      background: u('uBackgroundColor'),
      curvature: u('uCurvature'),
      scanlineStrength: u('uScanlineStrength'),
      scanlineFrequency: u('uScanlineFrequency'),
      waveAmplitude: u('uWaveAmplitude'),
      waveFrequency: u('uWaveFrequency'),
      bloom: u('uBloom'),
      bloomRadius: u('uBloomRadius'),
      noise: u('uNoise'),
      vignette: u('uVignette'),
      brightness: u('uBrightness'),
      pixelation: u('uPixelation'),
      rgbShift: u('uRgbShift'),
      pointer: u('uPointer'),
      mouseStrength: u('uMouseStrength'),
      mouseReact: u('uMouseReact'),
      dither: u('uDither'),
      bands: u('uBands'),
      invert: u('uInvert'),
      staticNoise: u('uStaticNoise'),
      diagonalRate: u('uDiagonalRate'),
      rippleRate: u('uRippleRate'),
      driftRate: u('uDriftRate'),
      broadRate: u('uBroadRate'),
    }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, props.current.dpr)
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    // The canvas sits behind windows, so track the pointer on window.
    const target = { x: 0, y: 0 }
    const pointer = { x: 0, y: 0 }
    const onPointerMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const onPointerLeave = () => {
      target.x = 0
      target.y = 0
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)

    let frame = 0
    let last = 0
    let prev = performance.now()
    // 40π spans the shader's t/2, t/4 and t/5 cycles together.
    let time = props.current.randomStart ? Math.random() * 40 * Math.PI : 0
    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      if (document.hidden) return
      const p = props.current
      const interval = 1000 / Math.max(1, p.fps)
      if (now - last < interval) return
      last = now - ((now - last) % interval)
      const delta = Math.min((now - prev) / 1000, 0.1)
      prev = now
      if (!p.paused) time += delta * p.speed
      pointer.x += (target.x - pointer.x) * 0.08
      pointer.y += (target.y - pointer.y) * 0.08

      gl.uniform2f(loc.resolution, canvas.width, canvas.height)
      gl.uniform1f(loc.time, time)
      gl.uniform3fv(loc.color, hexToRgb(p.color))
      gl.uniform3fv(loc.background, hexToRgb(p.backgroundColor))
      gl.uniform1f(loc.curvature, p.curvature)
      gl.uniform1f(loc.scanlineStrength, p.scanlineStrength)
      gl.uniform1f(loc.scanlineFrequency, p.scanlineFrequency)
      gl.uniform1f(loc.waveAmplitude, p.waveAmplitude)
      gl.uniform1f(loc.waveFrequency, p.waveFrequency)
      gl.uniform1f(loc.bloom, p.bloom)
      gl.uniform1f(loc.bloomRadius, p.bloomRadius)
      gl.uniform1f(loc.noise, p.noise)
      gl.uniform1f(loc.vignette, p.vignette)
      gl.uniform1f(loc.brightness, p.brightness)
      gl.uniform1f(loc.pixelation, p.pixelation)
      gl.uniform1f(loc.rgbShift, p.rgbShift)
      gl.uniform2f(loc.pointer, pointer.x, pointer.y)
      gl.uniform1f(loc.mouseStrength, p.mouseStrength)
      gl.uniform1f(loc.mouseReact, p.mouseReact ? 1 : 0)
      gl.uniform1f(loc.dither, p.dither)
      gl.uniform1f(loc.bands, p.bands)
      gl.uniform1f(loc.invert, p.invert ? 1 : 0)
      gl.uniform1f(loc.staticNoise, p.staticNoise ? 1 : 0)
      gl.uniform1f(loc.diagonalRate, p.diagonalRate)
      gl.uniform1f(loc.rippleRate, p.rippleRate)
      gl.uniform1f(loc.driftRate, p.driftRate)
      gl.uniform1f(loc.broadRate, p.broadRate)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [])

  return <canvas ref={canvasRef} className={`block size-full ${className}`} />
}
