// Ported from React Bits "Silk" (https://reactbits.dev/backgrounds/silk).
// The silk shader runs on raw WebGL, so the site doesn't ship three or
// @react-three/fiber. Retro take: the canvas renders one texel per cell and
// CSS scales it up with pixelated sampling, the folds can be quantised to a
// few shade levels with an ordered Bayer dither, and the grey is mapped onto
// a two-colour ramp, paletteLow to paletteHigh. The original's film grain is
// kept as noiseIntensity; it's what makes the folds read as fabric.
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
uniform float scale;
uniform float rotation;
uniform float contrast;
uniform float colorNum;
uniform float dither;
uniform float noiseIntensity;
uniform vec3 paletteLow;
uniform vec3 paletteHigh;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

// The original's grain: a fixed hash of the pixel, 0..1.
float grain(vec2 p) {
  const float e = 2.71828182845904523536;
  vec2 r = e * sin(e * p);
  return fract(r.x * r.y * (1.0 + p.x));
}

void main() {
  vec2 cell = gl_FragCoord.xy;
  // Square cells whatever the aspect, so the folds don't stretch.
  vec2 uv = cell / resolution.y;
  float c = cos(rotation);
  float s = sin(rotation);
  vec2 tex = mat2(c, -s, s, c) * uv * scale * scale;
  tex.y += 0.03 * sin(8.0 * tex.x - time);
  // The original's folds, 0.2..1.0.
  float pattern = 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y +
      cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * time) +
      sin(20.0 * (tex.x + tex.y - 0.1 * time)));
  float t = clamp(((pattern - 0.2) / 0.8 - 0.5) * contrast + 0.5, 0.0, 1.0);
  if (dither > 0.5) {
    float steps = max(colorNum - 1.0, 1.0);
    t = floor(t * steps + bayer4(cell)) / steps;
  }
  vec3 color = mix(paletteLow, paletteHigh, t) - grain(cell) / 15.0 * noiseIntensity;
  gl_FragColor = vec4(color, 1.0);
}
`

interface SilkProps {
  /** Fold speed; the original is 5. */
  speed?: number
  /** Fold size; bigger is tighter. */
  scale?: number
  /** Angle of the folds, in radians. */
  rotation?: number
  /** 1 uses the whole ramp; lower keeps the folds closer to paletteLow. */
  contrast?: number
  /** Quantise to colorNum levels with an ordered dither; off is smooth. */
  dither?: boolean
  /** Shade levels from paletteLow to paletteHigh, when dithered. */
  colorNum?: number
  /** Film grain that darkens each pixel a little; 0 is off. */
  noiseIntensity?: number
  /** The ramp, as CSS hex. */
  paletteLow: string
  paletteHigh: string
  /** Cell size in CSS pixels. */
  pixelSize?: number
  disableAnimation?: boolean
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

export default function Silk({
  speed = 5,
  scale = 1,
  rotation = 0,
  contrast = 1,
  dither = true,
  colorNum = 4,
  noiseIntensity = 0,
  paletteLow,
  paletteHigh,
  pixelSize = 3,
  disableAnimation = false,
  fps = 30,
  className = '',
}: SilkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The render loop reads props from here, so prop changes never restart WebGL.
  const props = useRef({
    speed,
    scale,
    rotation,
    contrast,
    dither,
    colorNum,
    noiseIntensity,
    paletteLow,
    paletteHigh,
    pixelSize,
    disableAnimation,
    fps,
  })
  props.current = {
    speed,
    scale,
    rotation,
    contrast,
    dither,
    colorNum,
    noiseIntensity,
    paletteLow,
    paletteHigh,
    pixelSize,
    disableAnimation,
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
      scale: u('scale'),
      rotation: u('rotation'),
      contrast: u('contrast'),
      colorNum: u('colorNum'),
      dither: u('dither'),
      noiseIntensity: u('noiseIntensity'),
      paletteLow: u('paletteLow'),
      paletteHigh: u('paletteHigh'),
    }

    // One canvas pixel per cell; CSS stretches it back to full size.
    const resize = () => {
      const size = Math.max(1, props.current.pixelSize)
      canvas.width = Math.max(1, Math.round(canvas.clientWidth / size))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight / size))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    let frame = 0
    let last = 0
    // Shader time, advanced by speed so a speed change doesn't jump.
    let time = 0
    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      if (document.hidden) return
      const p = props.current
      const interval = 1000 / Math.max(1, p.fps)
      if (now - last < interval) return
      // The original advances 0.1 per second at speed 1.
      if (last && !p.disableAnimation)
        time += Math.min(now - last, 100) * 0.0001 * p.speed
      last = now - ((now - last) % interval)

      gl.uniform2f(loc.resolution, canvas.width, canvas.height)
      gl.uniform1f(loc.time, time)
      gl.uniform1f(loc.scale, p.scale)
      gl.uniform1f(loc.rotation, p.rotation)
      gl.uniform1f(loc.contrast, p.contrast)
      gl.uniform1f(loc.colorNum, p.colorNum)
      gl.uniform1f(loc.dither, p.dither ? 1 : 0)
      gl.uniform1f(loc.noiseIntensity, p.noiseIntensity)
      gl.uniform3fv(loc.paletteLow, hexToRgb(p.paletteLow))
      gl.uniform3fv(loc.paletteHigh, hexToRgb(p.paletteHigh))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
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
