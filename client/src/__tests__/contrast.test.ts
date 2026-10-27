import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Checks that text stays readable in both themes: every pair of text and background
 * colour the components use must meet WCAG AA, a contrast ratio of at least 4.5:1.
 *
 * The colours are read from style.css. Panels are translucent and float over the map,
 * whose tiles can be anything from white to black, so translucent backgrounds are
 * checked over both.
 */

type Rgba = [number, number, number, number]

const css = readFileSync(resolve(__dirname, '../style.css'), 'utf8')

const block = (selector: string): string => {
  const match = new RegExp(`^${selector.replace('.', '\\.')} \\{([^}]*)\\}`, 'm').exec(css)
  if (!match) throw new Error(`No ${selector} block in style.css`)
  return match[1]
}

const parseColour = (value: string): Rgba => {
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const n = Number.parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
  }

  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(value)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4] ?? 1)]

  throw new Error(`Cannot read the colour ${value}`)
}

const palette = (selector: string): Record<string, Rgba> =>
  Object.fromEntries(
    [...block(selector).matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      parseColour(value.trim())
    ])
  )

/** A translucent colour as it looks over an opaque one */
const over = ([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba => [
  r * a + br * (1 - a),
  g * a + bg * (1 - a),
  b * a + bb * (1 - a),
  1
]

const luminance = ([r, g, b]: Rgba) => {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const ratio = (a: Rgba, b: Rgba) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

const WHITE: Rgba = [255, 255, 255, 1]
const BLACK: Rgba = [0, 0, 0, 1]

/** Text colour, background colour; 'white' is the text on the A and B badges */
const PAIRS: [string, string][] = [
  ['ink', 'paper'],
  ['muted', 'paper'],
  ['ink', 'surface'],
  ['muted', 'surface'],
  ['river', 'surface'],
  ['danger', 'surface'],
  ['ink', 'sunken'],
  ['muted', 'sunken'],
  ['warn-ink', 'warn'],
  ['white', 'start'],
  ['white', 'finish']
]

describe.each([
  ['light', ':root'],
  ['dark', '.dark']
])('the %s theme', (_theme, selector) => {
  const colours: Record<string, Rgba> = { ...palette(':root'), ...palette(selector), white: WHITE }

  it.each(PAIRS)('has readable %s text on %s', (text, background) => {
    // Over the lightest and the darkest map underneath
    for (const map of [WHITE, BLACK]) {
      const base = over(colours[background], map)
      expect(ratio(over(colours[text], base), base)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('the contrast check itself', () => {
  it('knows black on white is 21:1 and a colour on itself is 1:1', () => {
    expect(ratio(BLACK, WHITE)).toBeCloseTo(21)
    expect(ratio(WHITE, WHITE)).toBe(1)
  })

  it('reads every colour it checks from style.css', () => {
    const names = new Set(PAIRS.flat())
    names.delete('white')

    for (const selector of [':root', '.dark']) {
      expect(Object.keys(palette(selector))).toEqual(expect.arrayContaining([...names]))
    }
  })
})
