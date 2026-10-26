import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useTripLink } from '../useTripLink'
import { usePreferencesStore } from '../../stores/preferences'
import { useRiverStore } from '../../stores/river'
import { useSectionStore } from '../../stores/section'
import {
  controlledFetch,
  failure,
  flushPromises,
  gwda,
  gwdaSection,
  success
} from '../../test-utils/fetch'
import type { LatLng } from '../../types/river'

const A: LatLng = [53.36651, 16.79653]
const B: LatLng = [53.05485, 16.72602]

const API = 'http://localhost:8080/api/rivers'

/** Puts a query in the address, as if the page was opened with it */
const openAt = (search: string) => window.history.replaceState(null, '', `/${search}`)

const address = () => window.location.search

describe('useTripLink', () => {
  let api: ReturnType<typeof controlledFetch>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    api = controlledFetch()
    openAt('')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('opening a link', () => {
    it('opens the river and the section in the address', async () => {
      openAt(`?river=${gwda.id}&from=${A.join(',')}&to=${B.join(',')}&unit=mi&speed=6.5`)

      const opened = useTripLink()
      await flushPromises()
      expect(api.urls()[0]).toBe(`${API}/${gwda.id}`)

      api.respond(0, success(gwda))
      await flushPromises()
      expect(api.urls()[1]).toBe(`${API}/${gwda.id}/section?from=${A.join(',')}&to=${B.join(',')}`)

      api.respond(1, success(gwdaSection(A, B, 57810.7)))
      await opened

      expect(useRiverStore().river?.id).toBe(gwda.id)
      expect(useSectionStore().section?.length).toBe(57810.7)
      expect(usePreferencesStore().unit).toBe('mi')
      expect(usePreferencesStore().speed).toBe(6.5)
    })

    it('opens just the start when the link has no end', async () => {
      openAt(`?river=${gwda.id}&from=${A.join(',')}`)

      const opened = useTripLink()
      api.respond(0, success(gwda))
      await flushPromises()
      api.respond(1, success(gwdaSection(A, A, 0)))
      await opened

      expect(useSectionStore().start?.point).toEqual(A)
      expect(useSectionStore().end).toBeNull()
    })

    it('keeps the stored preferences when the link has none', async () => {
      localStorage.setItem('preferences', JSON.stringify({ unit: 'mi', speed: 4 }))
      openAt(`?river=${gwda.id}`)

      const opened = useTripLink()
      api.respond(0, success(gwda))
      await opened

      expect(usePreferencesStore().unit).toBe('mi')
      expect(usePreferencesStore().speed).toBe(4)
    })

    it('does nothing without a trip in the address', async () => {
      openAt('?utm_source=newsletter')

      await useTripLink()

      expect(api.fetchMock).not.toHaveBeenCalled()
      expect(useRiverStore().status).toBe('idle')
    })

    it('does not measure a section on a river that could not be loaded', async () => {
      openAt(`?river=123&from=${A.join(',')}&to=${B.join(',')}`)

      const opened = useTripLink()
      api.respond(0, failure('River 123 is not in the catalogue', 404))
      await opened

      expect(api.fetchMock).toHaveBeenCalledTimes(1)
      expect(useRiverStore().error).toBe('River 123 is not in the catalogue')
      // The river stays in the address so that Try again and a reload still work
      expect(address()).toBe('?river=123&unit=km&speed=5')
    })

    it('keeps the river when the section in the link is refused', async () => {
      openAt(`?river=${gwda.id}&from=52.2,21.0&to=${B.join(',')}`)

      const opened = useTripLink()
      api.respond(0, success(gwda))
      await flushPromises()
      api.respond(1, failure("The 'from' point is 301.0 km from the river Gwda", 422))
      await opened

      expect(useSectionStore().error).toContain('301.0 km')
      expect(address()).toBe(`?river=${gwda.id}&unit=km&speed=5`)
    })

    it('leaves the address alone while the link is opening', async () => {
      const search = `?river=${gwda.id}&from=${A.join(',')}&to=${B.join(',')}&unit=km&speed=5`
      openAt(search)
      const replace = vi.spyOn(window.history, 'replaceState')

      const opened = useTripLink()
      await flushPromises()
      // The river is selected but the section not yet measured
      expect(address()).toBe(search)

      api.respond(0, success(gwda))
      await flushPromises()
      expect(address()).toBe(search)

      api.respond(1, success(gwdaSection(A, B)))
      await opened
      expect(address()).toBe(search)
      expect(replace).not.toHaveBeenCalled()
    })
  })

  describe('following changes', () => {
    const start = async () => {
      await useTripLink()
    }

    it('writes the river once one is chosen, and clears the address when it is closed', async () => {
      await start()

      void useRiverStore().select(gwda.id)
      await nextTick()
      expect(address()).toBe(`?river=${gwda.id}&unit=km&speed=5`)

      useRiverStore().clear()
      await nextTick()
      expect(address()).toBe('')
    })

    it('writes the section as it is picked, moved and cleared', async () => {
      await start()
      const loading = useRiverStore().select(gwda.id)
      api.respond(0, success(gwda))
      await loading

      const sections = useSectionStore()
      void sections.pick(A)
      api.respond(1, success(gwdaSection(A, A, 0)))
      await flushPromises()
      expect(address()).toBe(`?river=${gwda.id}&from=${A.join(',')}&unit=km&speed=5`)

      void sections.pick(B)
      api.respond(2, success(gwdaSection(A, B)))
      await flushPromises()
      expect(address()).toBe(
        `?river=${gwda.id}&from=${A.join(',')}&to=${B.join(',')}&unit=km&speed=5`
      )

      sections.clear()
      await nextTick()
      expect(address()).toBe(`?river=${gwda.id}&unit=km&speed=5`)
    })

    it('writes the unit and speed', async () => {
      await start()
      const loading = useRiverStore().select(gwda.id)
      api.respond(0, success(gwda))
      await loading

      usePreferencesStore().unit = 'mi'
      usePreferencesStore().speed = 7
      await nextTick()

      expect(address()).toBe(`?river=${gwda.id}&unit=mi&speed=7`)
    })

    it('replaces the history entry instead of adding one', async () => {
      await start()
      const push = vi.spyOn(window.history, 'pushState')
      const length = window.history.length

      void useRiverStore().select(gwda.id)
      await nextTick()

      expect(push).not.toHaveBeenCalled()
      expect(window.history.length).toBe(length)
    })

    it('keeps the path and the fragment', async () => {
      window.history.replaceState(null, '', '/trips/#about')
      await start()

      void useRiverStore().select(gwda.id)
      await nextTick()

      expect(window.location.pathname).toBe('/trips/')
      expect(window.location.hash).toBe('#about')
    })
  })
})
