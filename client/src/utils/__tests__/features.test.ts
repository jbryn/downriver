import { describe, expect, it } from 'vitest'
import { featureLabel, kindLabel } from '../features'
import type { SectionFeature } from '../../types/river'

const feature = (overrides: Partial<SectionFeature>): SectionFeature => ({
  kind: 'weir',
  category: 'obstacle',
  name: null,
  point: [53.3, 16.8],
  distance: 0,
  ...overrides
})

describe('kindLabel', () => {
  it('names every kind of feature', () => {
    expect(kindLabel('weir')).toBe('Weir')
    expect(kindLabel('dam')).toBe('Dam')
    expect(kindLabel('lock')).toBe('Lock')
    expect(kindLabel('rapids')).toBe('Rapids')
    expect(kindLabel('waterfall')).toBe('Waterfall')
    expect(kindLabel('put_in')).toBe('Put-in')
    expect(kindLabel('slipway')).toBe('Slipway')
    expect(kindLabel('bridge')).toBe('Bridge')
  })
})

describe('featureLabel', () => {
  it('adds the name when the map has one', () => {
    expect(featureLabel(feature({ kind: 'bridge', name: 'Most Zygmunta Starego' }))).toBe(
      'Bridge: Most Zygmunta Starego'
    )
  })

  it('is just the kind when the map has no name', () => {
    expect(featureLabel(feature({ kind: 'dam' }))).toBe('Dam')
  })
})
