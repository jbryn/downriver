import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CopyLinkButton from '../CopyLinkButton.vue'
import { flushPromises } from '../../test-utils/fetch'

const byTestId = (id: string) => `[data-testid="${id}"]`

/** Gives the page a clipboard, or takes it away, before the button looks for one */
const mountWithClipboard = (clipboard: Partial<Clipboard> | undefined) => {
  vi.stubGlobal('navigator', { ...navigator, clipboard })
  return mount(CopyLinkButton)
}

describe('CopyLinkButton', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?river=8974372&unit=km&speed=5')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('copies the address of the page', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    const wrapper = mountWithClipboard({ writeText })

    await wrapper.find(byTestId('copy-link')).trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/?river=8974372&unit=km&speed=5')
    expect(wrapper.text()).toBe('Link copied')
  })

  it('goes back to its label after a moment', async () => {
    const wrapper = mountWithClipboard({ writeText: () => Promise.resolve() })

    await wrapper.find(byTestId('copy-link')).trigger('click')
    await flushPromises()
    vi.advanceTimersByTime(2000)
    await flushPromises()

    expect(wrapper.text()).toBe('Copy link')
  })

  it('says when the browser refuses to copy', async () => {
    const wrapper = mountWithClipboard({
      writeText: () => Promise.reject(new Error('denied'))
    })

    await wrapper.find(byTestId('copy-link')).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toBe('Could not copy')
  })

  it('is not shown where there is no clipboard', async () => {
    const wrapper = mountWithClipboard(undefined)

    expect(wrapper.find(byTestId('copy-link')).exists()).toBe(false)
  })
})
