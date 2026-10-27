import { describe, expect, it } from 'vitest'
import {
  METERS_PER_MILE,
  distanceValue,
  formatDistance,
  formatDuration,
  formatSpeed,
  paddlingMinutes
} from '../trip'

describe('formatDistance', () => {
  it('shows kilometers with one decimal', () => {
    expect(formatDistance(57810.7, 'km')).toBe('57.8 km')
    expect(formatDistance(0, 'km')).toBe('0.0 km')
    expect(formatDistance(142928.6, 'km')).toBe('142.9 km')
  })

  it('shows miles with one decimal', () => {
    expect(formatDistance(METERS_PER_MILE, 'mi')).toBe('1.0 mi')
    expect(formatDistance(57810.7, 'mi')).toBe('35.9 mi')
  })
})

describe('distanceValue', () => {
  it('is the number formatDistance shows, without the unit', () => {
    expect(distanceValue(57810.7, 'km')).toBe('57.8')
    expect(distanceValue(57810.7, 'mi')).toBe('35.9')
  })
})

describe('formatSpeed', () => {
  it('shows a speed given in km/h in the chosen unit', () => {
    expect(formatSpeed(5, 'km')).toBe('5.0 km/h')
    expect(formatSpeed(5, 'mi')).toBe('3.1 mph')
    expect(formatSpeed(12, 'mi')).toBe('7.5 mph')
  })
})

describe('paddlingMinutes', () => {
  it('divides the distance by the speed', () => {
    expect(paddlingMinutes(10000, 5)).toBe(120)
    expect(paddlingMinutes(2500, 5)).toBe(30)
  })

  it('rounds to five minutes', () => {
    // 57.8107 km at 5 km/h is 693.7 minutes
    expect(paddlingMinutes(57810.7, 5)).toBe(695)
    // 1 km at 5 km/h is 12 minutes
    expect(paddlingMinutes(1000, 5)).toBe(10)
    // 1.1 km at 5 km/h is 13.2 minutes
    expect(paddlingMinutes(1100, 5)).toBe(15)
  })

  it('is zero for no distance', () => {
    expect(paddlingMinutes(0, 5)).toBe(0)
  })
})

describe('formatDuration', () => {
  it('shows minutes under an hour', () => {
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(5)).toBe('5 min')
  })

  it('shows hours, and minutes when there are any', () => {
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(180)).toBe('3 h')
    expect(formatDuration(695)).toBe('11 h 35 min')
  })

  it('does not claim zero minutes for a very short trip', () => {
    expect(formatDuration(0)).toBe('under 5 min')
  })
})
