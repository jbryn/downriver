import { describe, expect, it } from 'vitest'
import { decodeTripLink, encodeTripLink, type TripLink } from '../tripLink'

const trip: TripLink = {
  riverId: 8974372,
  from: [53.36651, 16.79653],
  to: [53.05485, 16.72602],
  unit: 'mi',
  speed: 6.5
}

describe('encodeTripLink', () => {
  it('writes every part of a trip', () => {
    expect(encodeTripLink(trip)).toBe(
      '?river=8974372&from=53.36651,16.79653&to=53.05485,16.72602&unit=mi&speed=6.5'
    )
  })

  it('rounds coordinates to five decimals', () => {
    expect(encodeTripLink({ ...trip, from: [53.3665124, 16.7965265], to: null })).toContain(
      'from=53.36651,16.79653&unit'
    )
  })

  it('leaves out the parts that are not set', () => {
    expect(encodeTripLink({ riverId: 1, from: null, to: null, unit: null, speed: null })).toBe(
      '?river=1'
    )
    expect(encodeTripLink({ ...trip, to: null })).toBe(
      '?river=8974372&from=53.36651,16.79653&unit=mi&speed=6.5'
    )
  })

  it('never writes an end without a start', () => {
    expect(encodeTripLink({ ...trip, from: null })).toBe('?river=8974372&unit=mi&speed=6.5')
  })
})

describe('decodeTripLink', () => {
  it('reads back what was written', () => {
    expect(decodeTripLink(encodeTripLink(trip))).toEqual(trip)
  })

  it('reads negative coordinates', () => {
    const west: TripLink = { ...trip, from: [-33.5, -70.25], to: [-33.6, -70.3] }

    expect(decodeTripLink(encodeTripLink(west))).toEqual({
      ...west,
      from: [-33.5, -70.25],
      to: [-33.6, -70.3]
    })
  })

  it('reads a link with only a river', () => {
    expect(decodeTripLink('?river=34392')).toEqual({
      riverId: 34392,
      from: null,
      to: null,
      unit: null,
      speed: null
    })
  })

  it('reads commas written escaped', () => {
    expect(decodeTripLink('?river=1&from=53.1%2C16.7')?.from).toEqual([53.1, 16.7])
  })

  it.each([
    ['no query', ''],
    ['no river', '?from=53.1,16.7'],
    ['an empty river', '?river='],
    ['a river that is not a number', '?river=gwda'],
    ['a negative river', '?river=-5'],
    ['a zero river', '?river=0'],
    ['a fractional river', '?river=1.5'],
    ['a river with a leading zero', '?river=08974372'],
    ['a river too big to be exact', '?river=99999999999999999999']
  ])('finds no trip with %s', (_case, search) => {
    expect(decodeTripLink(search)).toBeNull()
  })

  it.each([
    ['one coordinate', '53.1'],
    ['three coordinates', '53.1,16.7,0'],
    ['an empty coordinate', '53.1,'],
    ['words', 'north,east'],
    ['an exponent', '5.31e1,16.7'],
    ['hexadecimal', '0x35,16.7'],
    ['spaces', ' 53.1, 16.7'],
    ['a latitude off the globe', '90.1,16.7'],
    ['a longitude off the globe', '53.1,-180.5'],
    ['infinity', 'Infinity,16.7']
  ])('drops a start with %s, and the end with it', (_case, from) => {
    const link = decodeTripLink(`?river=1&from=${from}&to=53.0,16.7`)

    expect(link).toMatchObject({ riverId: 1, from: null, to: null })
  })

  it('keeps the start when only the end is malformed', () => {
    const link = decodeTripLink('?river=1&from=53.1,16.7&to=south')

    expect(link).toMatchObject({ from: [53.1, 16.7], to: null })
  })

  it('drops an end given without a start', () => {
    expect(decodeTripLink('?river=1&to=53.0,16.7')?.to).toBeNull()
  })

  it.each([
    ['an unknown unit', 'unit=nm', { unit: null }],
    ['a speed too slow', 'speed=1.5', { speed: null }],
    ['a speed too fast', 'speed=12.5', { speed: null }],
    ['a speed that is not a number', 'speed=fast', { speed: null }],
    ['an empty speed', 'speed=', { speed: null }]
  ])('ignores %s and keeps the rest', (_case, part, expected) => {
    const link = decodeTripLink(`?river=1&from=53.1,16.7&${part}`)

    expect(link).toMatchObject({ riverId: 1, from: [53.1, 16.7], ...expected })
  })

  it('accepts the slowest and fastest speeds', () => {
    expect(decodeTripLink('?river=1&speed=2')?.speed).toBe(2)
    expect(decodeTripLink('?river=1&speed=12')?.speed).toBe(12)
  })
})
