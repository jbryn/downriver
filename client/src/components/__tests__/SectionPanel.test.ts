import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SectionPanel from '../SectionPanel.vue'
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
import type { LatLng, SectionFeature } from '../../types/river'

const byTestId = (id: string) => `[data-testid="${id}"]`

const A: LatLng = [53.5, 16.9]
const B: LatLng = [53.2, 16.7]

describe('SectionPanel', () => {
  let api: ReturnType<typeof controlledFetch>
  let requests = 0

  const respond = async (body: Response) => {
    api.respond(requests++, body)
    await flushPromises()
  }

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    api = controlledFetch()
    requests = 0

    const loading = useRiverStore().select(gwda.id)
    await respond(success(gwda))
    await loading
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const pickStartAndEnd = async (
    length = 57810.7,
    downstream = true,
    features: SectionFeature[] = []
  ) => {
    const store = useSectionStore()
    void store.pick(A)
    await respond(success(gwdaSection(A, A, 0)))
    void store.pick(B)
    await respond(success({ ...gwdaSection(A, B, length), downstream, features }))
  }

  it('asks for a start first', () => {
    const wrapper = mount(SectionPanel)

    // The A badge beside the text is decorative and hidden from screen readers
    expect(wrapper.find(byTestId('section-hint')).text()).toContain(
      'Click the river where you put in.'
    )
    expect(wrapper.find(byTestId('section-clear')).exists()).toBe(false)
  })

  it('asks for the finish once the start is set', async () => {
    const wrapper = mount(SectionPanel)

    void useSectionStore().pick(A)
    await respond(success(gwdaSection(A, A, 0)))

    expect(wrapper.find(byTestId('section-hint')).text()).toContain('where you take out')
    expect(wrapper.find(byTestId('section-clear')).exists()).toBe(true)
  })

  it('shows the length of the section in kilometers', async () => {
    const wrapper = mount(SectionPanel)

    await pickStartAndEnd(57810.7)

    expect(wrapper.find(byTestId('section-length')).text()).toBe('57.8 km')
    expect(wrapper.find(byTestId('section-upstream')).exists()).toBe(false)
    expect(wrapper.find(byTestId('section-reverse')).exists()).toBe(false)
  })

  it('shows the length in miles when chosen', async () => {
    const wrapper = mount(SectionPanel)
    await pickStartAndEnd(57810.7)

    usePreferencesStore().unit = 'mi'
    await flushPromises()

    expect(wrapper.find(byTestId('section-length')).text()).toBe('35.9 mi')
    expect(wrapper.find(byTestId('section-speed')).text()).toBe('3.1 mph')
  })

  it('estimates the paddling time at the average speed', async () => {
    const wrapper = mount(SectionPanel)

    await pickStartAndEnd(57810.7)

    expect(wrapper.find(byTestId('section-duration')).text()).toBe('11 h 35 min')
    expect(wrapper.find(byTestId('section-speed')).text()).toBe('5.0 km/h')
  })

  it('updates the time when the speed changes, and remembers the speed', async () => {
    const wrapper = mount(SectionPanel)
    await pickStartAndEnd(57810.7)

    const slider = wrapper.find(byTestId('speed-input'))
    expect(slider.attributes()).toMatchObject({ min: '2', max: '12', step: '0.5' })

    await slider.setValue('8')

    expect(usePreferencesStore().speed).toBe(8)
    expect(wrapper.find(byTestId('section-speed')).text()).toBe('8.0 km/h')
    expect(slider.attributes('aria-valuetext')).toBe('8.0 km/h')
    // 57.8107 km at 8 km/h is 433.6 minutes
    expect(wrapper.find(byTestId('section-duration')).text()).toBe('7 h 15 min')
  })

  it('lists what is on the route', async () => {
    const wrapper = mount(SectionPanel)

    await pickStartAndEnd(57810.7, true, [
      { kind: 'dam', category: 'obstacle', name: null, point: [53.35, 16.82], distance: 3548.2 }
    ])

    expect(wrapper.find(byTestId('section-features-summary')).text()).toBe(
      '1 obstacle · 0 access points'
    )
  })

  it('warns when the finish is upstream of the start', async () => {
    const wrapper = mount(SectionPanel)

    await pickStartAndEnd(57810.7, false)

    expect(wrapper.find(byTestId('section-upstream')).text()).toContain('against the current')
  })

  it('reverses an upstream section from the warning', async () => {
    const wrapper = mount(SectionPanel)
    await pickStartAndEnd(57810.7, false)

    await wrapper.find(byTestId('section-reverse')).trigger('click')
    expect(api.urls()[3]).toBe(
      `http://localhost:8080/api/rivers/${gwda.id}/section?from=${B.join(',')}&to=${A.join(',')}`
    )

    await respond(success(gwdaSection(B, A, 57810.7)))
    expect(wrapper.find(byTestId('section-upstream')).exists()).toBe(false)
  })

  it('shows that it is measuring', async () => {
    const wrapper = mount(SectionPanel)

    void useSectionStore().pick(A)
    await flushPromises()

    expect(wrapper.find(byTestId('section-loading')).exists()).toBe(true)
  })

  it('shows why a point was refused', async () => {
    const wrapper = mount(SectionPanel)

    void useSectionStore().pick([52.2, 21.0])
    await respond(
      failure("The 'from' point is 301.0 km from the river Gwda; it must be within 2 km", 422)
    )

    expect(wrapper.find(byTestId('section-error')).text()).toContain('301.0 km from the river Gwda')
  })

  it('clears the selection through its button', async () => {
    const wrapper = mount(SectionPanel)
    await pickStartAndEnd()

    await wrapper.find(byTestId('section-clear')).trigger('click')
    expect(wrapper.find(byTestId('section-hint')).text()).toContain('where you put in')
  })
})
