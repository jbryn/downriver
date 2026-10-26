import { MAX_SPEED, MIN_SPEED, type DistanceUnit } from './trip'
import type { LatLng } from '../types/river'

/** What a shared link holds: a river, optionally a section on it, and how to show it */
export interface TripLink {
  riverId: number
  from: LatLng | null
  /** Only set together with `from` */
  to: LatLng | null
  unit: DistanceUnit | null
  /** km/h */
  speed: number | null
}

/** Five decimals is about a meter, closer than any click can be */
const COORDINATE_DECIMALS = 5

const formatPoint = ([latitude, longitude]: LatLng) =>
  `${latitude.toFixed(COORDINATE_DECIMALS)},${longitude.toFixed(COORDINATE_DECIMALS)}`

/** A number written the plain way: no exponent, hex, spaces or empty parts */
const DECIMAL = /^-?\d+(\.\d+)?$/

const parsePoint = (value: string | null): LatLng | null => {
  const parts = value?.split(',')
  if (parts?.length !== 2 || !parts.every((part) => DECIMAL.test(part))) return null

  const [latitude, longitude] = parts.map(Number)
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null

  return [latitude, longitude]
}

const parseRiverId = (value: string | null): number | null => {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null

  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

const parseUnit = (value: string | null): DistanceUnit | null =>
  value === 'km' || value === 'mi' ? value : null

const parseSpeed = (value: string | null): number | null => {
  if (value === null || !DECIMAL.test(value)) return null

  const speed = Number(value)
  return speed >= MIN_SPEED && speed <= MAX_SPEED ? speed : null
}

/**
 * The query string for a trip, such as
 * "?river=8974372&from=53.36651,16.79653&to=53.05485,16.72602&unit=km&speed=5".
 * Coordinates only contain digits, dots, minus signs and a comma, so they need no escaping.
 */
export function encodeTripLink(trip: TripLink): string {
  const parts = [`river=${trip.riverId}`]

  if (trip.from) {
    parts.push(`from=${formatPoint(trip.from)}`)
    if (trip.to) parts.push(`to=${formatPoint(trip.to)}`)
  }
  if (trip.unit) parts.push(`unit=${trip.unit}`)
  if (trip.speed !== null) parts.push(`speed=${trip.speed}`)

  return `?${parts.join('&')}`
}

/**
 * Reads a trip from a query string. Without a valid river there is no trip. Each other
 * part is dropped on its own when it is malformed; an end without a valid start is
 * dropped too, since a section needs its start.
 */
export function decodeTripLink(search: string): TripLink | null {
  const params = new URLSearchParams(search)

  const riverId = parseRiverId(params.get('river'))
  if (riverId === null) return null

  const from = parsePoint(params.get('from'))
  const to = from ? parsePoint(params.get('to')) : null

  return {
    riverId,
    from,
    to,
    unit: parseUnit(params.get('unit')),
    speed: parseSpeed(params.get('speed'))
  }
}
