// A flickering frame under a vignette: one fragment shader on raw WebGL,
// drawn at a low resolution and scaled up pixelated, with grain over it.
import { useEffect, useLayoutEffect, useRef } from 'react'

import { FilmGrain } from '#/components/FilmGrain'
import { rgb } from '#/lib/color'

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
uniform float flicker;
uniform float vignette;
uniform vec3 paletteLow;
uniform vec3 paletteHigh;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 cell = gl_FragCoord.xy;
  vec2 uv = cell / resolution;
  float t = 0.8 + flicker * (hash(vec2(frame, 1.7)) - 0.5);
  // Darker towards the edges, like a projector's hot spot.
  vec2 d = (uv - 0.5) * vec2(resolution.x / resolution.y, 1.0);
  t *= 1.0 - vignette * smoothstep(0.3, 1.1, length(d));
  vec3 col = mix(paletteLow, paletteHigh, clamp(t, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
`

interface FilmProps {
  /** How much the frame's brightness jumps, frame to frame. */
  flicker?: number
  /** How dark the edges get; 0 is none. */
  vignette?: number
  /** Shadows and highlights, as CSS colours. */
  paletteLow: string
  paletteHigh: string
  /** Cell size in CSS pixels. */
  pixelSize?: number
  fps?: number
  disableAnimation?: boolean
}

/** A CSS colour to 0..1 floats, for the shader. */
const floats = (color: string) => rgb(color).map((c) => c / 255)

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed')
  return s
}

export default function Film({
  flicker = 0.08,
  vignette = 0.7,
  paletteLow,
  paletteHigh,
  pixelSize = 2,
  fps = 24,
  disableAnimation = false,
}: FilmProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The render loop reads props from here, so prop changes never restart WebGL.
  const latest = {
    flicker,
    vignette,
    paletteLow,
    paletteHigh,
    pixelSize,
    fps,
    disableAnimation,
  }
  const props = useRef(latest)
  useLayoutEffect(() => {
    props.current = latest
  })

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
      flicker: u('flicker'),
      vignette: u('vignette'),
      paletteLow: u('paletteLow'),
      paletteHigh: u('paletteHigh'),
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
      gl.uniform1f(loc.flicker, p.flicker)
      gl.uniform1f(loc.vignette, p.vignette)
      gl.uniform3fv(loc.paletteLow, floats(p.paletteLow))
      gl.uniform3fv(loc.paletteHigh, floats(p.paletteHigh))
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
    <>
      <canvas
        ref={canvasRef}
        className="block size-full [image-rendering:pixelated]"
      />
      {/* Fainter than on the start screen, under the windows all day. */}
      <FilmGrain strength={0.22} />
    </>
  )
}
