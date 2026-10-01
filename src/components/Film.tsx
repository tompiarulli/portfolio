// An old film running through the projector: a sepia frame that flickers,
// grain that changes every frame, a dark vignette, dust specks and the odd
// scratch running down the print. One fragment shader on raw WebGL, drawn
// at a low resolution and scaled up, at the projector's 24 frames a second.
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
uniform float frame;
uniform float grain;
uniform float flicker;
uniform float vignette;
uniform float dust;
uniform float scratches;
uniform vec3 paletteLow;
uniform vec3 paletteHigh;
uniform vec3 glint;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 cell = gl_FragCoord.xy;
  vec2 uv = cell / resolution;
  // The whole frame brightens and dims a little, frame to frame.
  float t = 0.8 + flicker * (hash(vec2(frame, 1.7)) - 0.5);
  // Darker towards the edges, like a projector's hot spot.
  vec2 d = (uv - 0.5) * vec2(resolution.x / resolution.y, 1.0);
  t *= 1.0 - vignette * smoothstep(0.3, 1.1, length(d));
  // Grain, fresh every frame.
  t += grain * (hash(cell + frame * 17.0) - 0.5);
  vec3 col = mix(paletteLow, paletteHigh, clamp(t, 0.0, 1.0));
  // Dust: specks of 2x2 cells, a few each frame, dark or light.
  float speck = hash(floor(cell / 2.0) + frame * 3.1);
  if (speck > 1.0 - dust * 0.002) {
    col = hash(vec2(frame, speck)) > 0.5 ? glint : paletteLow;
  }
  // Scratches: up to two thin lines down the print, each held for a few
  // frames before it jumps.
  for (int i = 0; i < 2; i++) {
    float hold = floor(frame / 6.0) + float(i) * 31.0;
    if (hash(vec2(hold, 9.1)) < scratches) {
      float x = hash(vec2(hold, 3.3)) * resolution.x;
      x += (hash(vec2(frame, float(i))) - 0.5) * 2.0;
      if (abs(cell.x - x) < 0.5) col = mix(col, glint, 0.6);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`

interface FilmProps {
  /** Grain strength; 0 is a clean print. */
  grain?: number
  /** How much the frame's brightness jumps, frame to frame. */
  flicker?: number
  /** How dark the edges get; 0 is none. */
  vignette?: number
  /** Dust specks per frame, roughly. */
  dust?: number
  /** Chance of each of the two scratches showing, 0..1. */
  scratches?: number
  /** Shadows, highlights and the light specks and scratches, as CSS hex. */
  paletteLow: string
  paletteHigh: string
  glint: string
  /** Cell size in CSS pixels. */
  pixelSize?: number
  /** Projector speed. */
  fps?: number
  disableAnimation?: boolean
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

export default function Film({
  grain = 0.12,
  flicker = 0.08,
  vignette = 0.7,
  dust = 1,
  scratches = 0.5,
  paletteLow,
  paletteHigh,
  glint,
  pixelSize = 2,
  fps = 24,
  disableAnimation = false,
  className = '',
}: FilmProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The render loop reads props from here, so prop changes never restart WebGL.
  const props = useRef({
    grain,
    flicker,
    vignette,
    dust,
    scratches,
    paletteLow,
    paletteHigh,
    glint,
    pixelSize,
    fps,
    disableAnimation,
  })
  props.current = {
    grain,
    flicker,
    vignette,
    dust,
    scratches,
    paletteLow,
    paletteHigh,
    glint,
    pixelSize,
    fps,
    disableAnimation,
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
      frame: u('frame'),
      grain: u('grain'),
      flicker: u('flicker'),
      vignette: u('vignette'),
      dust: u('dust'),
      scratches: u('scratches'),
      paletteLow: u('paletteLow'),
      paletteHigh: u('paletteHigh'),
      glint: u('glint'),
    }

    let raf = 0
    let last = 0
    let frame = 0

    // One canvas pixel per cell; CSS stretches it back to full size.
    // Resizing clears the canvas, so the next tick draws even when still.
    const resize = () => {
      const size = Math.max(1, props.current.pixelSize)
      canvas.width = Math.max(1, Math.round(canvas.clientWidth / size))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight / size))
      gl.viewport(0, 0, canvas.width, canvas.height)
      last = 0
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      if (document.hidden) return
      const p = props.current
      const interval = 1000 / Math.max(1, p.fps)
      // Still: draw one frame, then hold it.
      if (last && (p.disableAnimation || now - last < interval)) return
      last = now
      // Wraps well before float precision runs out in the shader.
      frame = (frame + 1) % 10000

      gl.uniform2f(loc.resolution, canvas.width, canvas.height)
      gl.uniform1f(loc.frame, frame)
      gl.uniform1f(loc.grain, p.grain)
      gl.uniform1f(loc.flicker, p.flicker)
      gl.uniform1f(loc.vignette, p.vignette)
      gl.uniform1f(loc.dust, p.dust)
      gl.uniform1f(loc.scratches, p.scratches)
      gl.uniform3fv(loc.paletteLow, hexToRgb(p.paletteLow))
      gl.uniform3fv(loc.paletteHigh, hexToRgb(p.paletteHigh))
      gl.uniform3fv(loc.glint, hexToRgb(p.glint))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
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
