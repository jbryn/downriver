export type DistanceUnit = 'km' | 'mi'

export const METERS_PER_MILE = 1609.344

/** Average paddling speeds offered, in km/h */
export const MIN_SPEED = 2
export const MAX_SPEED = 12
export const SPEED_STEP = 0.5
/** A relaxed touring pace on a lowland river, breaks included */
export const DEFAULT_SPEED = 5

/** Paddling times are rounded to this many minutes; finer would suggest false precision */
const MINUTES_ROUNDING = 5

const metersPerUnit = (unit: DistanceUnit) => (unit === 'km' ? 1000 : METERS_PER_MILE)

/** "57.8 km" or "35.9 mi" */
export const formatDistance = (meters: number, unit: DistanceUnit): string =>
  `${(meters / metersPerUnit(unit)).toFixed(1)} ${unit}`

/** "5.0 km/h" or "3.1 mph", from a speed in km/h */
export const formatSpeed = (kilometersPerHour: number, unit: DistanceUnit): string =>
  unit === 'km'
    ? `${kilometersPerHour.toFixed(1)} km/h`
    : `${((kilometersPerHour * 1000) / METERS_PER_MILE).toFixed(1)} mph`

/** Minutes needed to paddle a distance at an average speed, rounded to 5 minutes */
export const paddlingMinutes = (meters: number, kilometersPerHour: number): number => {
  const minutes = (meters / 1000 / kilometersPerHour) * 60
  return Math.round(minutes / MINUTES_ROUNDING) * MINUTES_ROUNDING
}

/** "45 min", "3 h", "11 h 35 min" */
export const formatDuration = (minutes: number): string => {
  if (minutes < MINUTES_ROUNDING) return `under ${MINUTES_ROUNDING} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}
