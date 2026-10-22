import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SectionFeatures from '../SectionFeatures.vue'
import { usePreferencesStore } from '../../stores/preferences'
import type { SectionFeature } from '../../types/river'

const byTestId = (id: string) => `[data-testid="${id}"]`

const features: SectionFeature[] = [
  { kind: 'bridge', category: 'access', name: null, point: [53.36, 16.79], distance: 278.3 },
  { kind: 'weir', category: 'obstacle', name: null, point: [53.35, 16.82], distance: 3548.8 },
  {
    kind: 'bridge',
    category: 'access',
    name: 'Most Bolesława Chrobrego',
    point: [53.15, 16.74],
    distance: 32502.4
  }
]

describe('SectionFeatures', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('counts obstacles and access points', () => {
    const wrapper = mount(SectionFeatures, { props: { features } })

    expect(wrapper.find(byTestId('section-features-summary')).text()).toBe(
      '1 obstacle · 2 access points'
    )
  })

  it('lists the features in order, with their distance from the start', () => {
    const wrapper = mount(SectionFeatures, { props: { features } })

    // The first span is the distance; the label follows the colour dot
    const rows = wrapper.findAll('li').map((row) => {
      const [distance, , label] = row.findAll(':scope > span')
      return [distance.text(), label.text().replace(/\s+/g, ' ')]
    })
    expect(rows).toEqual([
      ['0.3 km', 'Bridge'],
      ['3.5 km', 'Weir'],
      ['32.5 km', 'Bridge · Most Bolesława Chrobrego']
    ])
    expect(wrapper.findAll(byTestId('section-feature-obstacle'))).toHaveLength(1)
    expect(wrapper.findAll(byTestId('section-feature-access'))).toHaveLength(2)
  })

  it('shows distances in miles when chosen', async () => {
    const wrapper = mount(SectionFeatures, { props: { features } })

    usePreferencesStore().unit = 'mi'
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('li')[2].text()).toContain('20.2 mi')
  })

  it('says when nothing is mapped on the section', () => {
    const wrapper = mount(SectionFeatures, { props: { features: [] } })

    expect(wrapper.find(byTestId('section-features-empty')).text()).toContain(
      'No obstacles or access points'
    )
    expect(wrapper.find('ol').exists()).toBe(false)
  })
})
