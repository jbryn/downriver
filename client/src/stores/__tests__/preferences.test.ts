import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { PREFERENCES_STORAGE_KEY, usePreferencesStore } from '../preferences'

const stored = () => JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? 'null') as unknown

const remember = (value: unknown) =>
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(value))

describe('preferences store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with kilometers and 5 km/h', () => {
    const store = usePreferencesStore()

    expect(store.unit).toBe('km')
    expect(store.speed).toBe(5)
  })

  it('remembers changes', async () => {
    const store = usePreferencesStore()

    store.unit = 'mi'
    store.speed = 7.5
    await nextTick()

    expect(stored()).toEqual({ unit: 'mi', speed: 7.5 })
  })

  it('starts from what it remembered', () => {
    remember({ unit: 'mi', speed: 3.5 })

    const store = usePreferencesStore()

    expect(store.unit).toBe('mi')
    expect(store.speed).toBe(3.5)
  })

  it('keeps the valid remembered values and defaults the rest', () => {
    remember({ unit: 'mi', speed: 40 })

    const store = usePreferencesStore()

    expect(store.unit).toBe('mi')
    expect(store.speed).toBe(5)
  })

  it.each([
    ['invalid JSON', '{unit'],
    ['a value that is not an object', '"km"'],
    ['an unknown unit and a speed that is not a number', '{"unit":"nm","speed":"fast"}']
  ])('falls back to the defaults when storage holds %s', (_case, raw) => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, raw)

    const store = usePreferencesStore()

    expect(store.unit).toBe('km')
    expect(store.speed).toBe(5)
  })

  it('works when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })

    const store = usePreferencesStore()
    expect(store.unit).toBe('km')

    store.unit = 'mi'
    await nextTick()
    expect(store.unit).toBe('mi')
  })
})
