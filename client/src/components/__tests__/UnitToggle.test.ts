import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UnitToggle from '../UnitToggle.vue'
import { usePreferencesStore } from '../../stores/preferences'

const byTestId = (id: string) => `[data-testid="${id}"]`

describe('UnitToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('offers kilometers and miles, with kilometers selected', () => {
    const wrapper = mount(UnitToggle)

    expect(wrapper.find(byTestId('unit-toggle')).attributes('aria-label')).toBe('Distance unit')
    expect(wrapper.find(byTestId('unit-km')).attributes('aria-pressed')).toBe('true')
    expect(wrapper.find(byTestId('unit-mi')).attributes('aria-pressed')).toBe('false')
    expect(wrapper.find(byTestId('unit-mi')).attributes('aria-label')).toBe('Miles')
  })

  it('switches the unit', async () => {
    const wrapper = mount(UnitToggle)

    await wrapper.find(byTestId('unit-mi')).trigger('click')

    expect(usePreferencesStore().unit).toBe('mi')
    expect(wrapper.find(byTestId('unit-mi')).attributes('aria-pressed')).toBe('true')
    expect(wrapper.find(byTestId('unit-km')).attributes('aria-pressed')).toBe('false')
  })
})
