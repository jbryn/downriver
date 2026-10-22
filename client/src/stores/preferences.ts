import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { DEFAULT_SPEED, MAX_SPEED, MIN_SPEED, type DistanceUnit } from '../utils/trip'

export const PREFERENCES_STORAGE_KEY = 'preferences'

interface StoredPreferences {
  unit: DistanceUnit
  /** km/h */
  speed: number
}

const DEFAULTS: StoredPreferences = { unit: 'km', speed: DEFAULT_SPEED }

const isUnit = (value: unknown): value is DistanceUnit => value === 'km' || value === 'mi'

const isSpeed = (value: unknown): value is number =>
  typeof value === 'number' && value >= MIN_SPEED && value <= MAX_SPEED

/** Takes each remembered value that is still valid, and the default for the rest */
const readStored = (): StoredPreferences => {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const stored: unknown = raw === null ? null : JSON.parse(raw)
    if (typeof stored !== 'object' || stored === null) return DEFAULTS

    const { unit, speed } = stored as Record<string, unknown>
    return {
      unit: isUnit(unit) ? unit : DEFAULTS.unit,
      speed: isSpeed(speed) ? speed : DEFAULTS.speed
    }
  } catch {
    // Storage can be unavailable, for example in private browsing, or hold invalid JSON
    return DEFAULTS
  }
}

const store = (preferences: StoredPreferences): void => {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Not remembering the choice is acceptable
  }
}

/** How the user wants trips shown: distance unit and average paddling speed. Remembered. */
export const usePreferencesStore = defineStore('preferences', () => {
  const initial = readStored()

  const unit = ref<DistanceUnit>(initial.unit)
  /** Average paddling speed in km/h, whatever the unit shown */
  const speed = ref(initial.speed)

  watch([unit, speed], () => store({ unit: unit.value, speed: speed.value }))

  return { unit, speed }
})
