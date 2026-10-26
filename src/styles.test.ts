// WCAG AA contrast for every colour pair the chrome paints, in every theme,
// read straight from the tokens in styles.css. The end-to-end axe check
// sees text at rest; this also covers hover, focus and pressed states, and
// the 3:1 that icons, borders and marks need.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { THEMES } from '#/lib/theme'

const css = readFileSync(join(import.meta.dirname, 'styles.css'), 'utf8')

/** The custom properties declared in each block whose selector matches. */
function declarations(matches: (selector: string) => boolean) {
  const tokens: Record<string, string> = {}
  for (const [, selector = '', body = ''] of css.matchAll(
    /([^{}]+)\{([^{}]*)\}/g,
  )) {
    if (!matches(selector.replace(/\/\*[\s\S]*?\*\//g, '').trim())) continue
    for (const [, name = '', value = ''] of body.matchAll(
      /(--[\w-]+)\s*:\s*([^;]+);/g,
    ))
      tokens[name] = value.trim()
  }
  return tokens
}

/** A theme's tokens: the base block, then its own blocks over the top. */
function tokens(theme: string) {
  return {
    ...declarations((s) => s === ':root,\n[data-theme]'),
    ...declarations((s) => s === `[data-theme='${theme}']`),
  }
}

/** A token's colour, following var() references, as 0..1 channels. */
function color(all: Record<string, string>, name: string): number[] {
  const value = all[name]
  if (!value) throw new Error(`${name} is not set`)
  const ref = value.match(/^var\((--[\w-]+)\)$/)
  if (ref) return color(all, ref[1]!)
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
  if (!hex) throw new Error(`${name} is not a hex colour: ${value}`)
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
}

function luminance([r = 0, g = 0, b = 0]: number[]) {
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: number[], b: number[]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/** Foreground, background, the ratio AA asks of it, and where it's seen.
 *  Text needs 4.5; icons, borders and marks need 3. */
const PAIRS: [string, string, number, string][] = [
  ['--ink', '--surface', 4.5, 'window, menu and dock text and icons'],
  ['--ink', '--well', 4.5, 'text in wells'],
  ['--on-title', '--title', 4.5, "the focused window's title and close box"],
  ['--on-accent', '--accent', 4.5, 'the picked theme, pressed and menu items'],
  ['--on-tertiary', '--tertiary', 4.5, 'a hovered or focused dock button'],
  ['--terminal-text', '--terminal', 4.5, "the terminal's output"],
  ['--glint', '--terminal', 4.5, "the terminal's prompt and input"],
  ['--indicator', '--surface', 3, "the dock's open-window mark"],
]

describe.each(THEMES)('$label', ({ id }) => {
  const all = tokens(id)
  it.each(PAIRS)('%s on %s meets %s:1 (%s)', (fg, bg, min) => {
    const ratio = contrast(color(all, fg), color(all, bg))
    expect(Math.round(ratio * 100) / 100).toBeGreaterThanOrEqual(min)
  })
})
