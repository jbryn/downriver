import { watch } from 'vue'
import { usePreferencesStore } from '../stores/preferences'
import { useRiverStore } from '../stores/river'
import { useSectionStore } from '../stores/section'
import { decodeTripLink, encodeTripLink } from '../utils/tripLink'

/**
 * Keeps the page address in step with the trip, so the address can be shared.
 *
 * On start, opens the trip in the address, if any. From then on, every change to the
 * river, the section, the unit or the speed rewrites the address. It replaces the
 * current history entry instead of adding one: dragging a marker should not fill the
 * Back button with every step.
 *
 * Returns a promise that settles once the trip from the address has been opened.
 */
export function useTripLink(): Promise<void> {
  const rivers = useRiverStore()
  const sections = useSectionStore()
  const preferences = usePreferencesStore()

  // Until the trip in the address is open, the stores are still filling and writing
  // their state would erase the parts not yet loaded
  let opening = true

  const write = () => {
    const search =
      rivers.selectedId === null
        ? ''
        : encodeTripLink({
            riverId: rivers.selectedId,
            from: sections.start?.point ?? null,
            to: sections.end?.point ?? null,
            unit: preferences.unit,
            speed: preferences.speed
          })

    if (search !== window.location.search) {
      const { pathname, hash } = window.location
      window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`)
    }
  }

  watch(
    [
      () => rivers.selectedId,
      () => sections.start,
      () => sections.end,
      () => preferences.unit,
      () => preferences.speed
    ],
    () => {
      if (!opening) write()
    }
  )

  const open = async () => {
    const link = decodeTripLink(window.location.search)
    if (!link) return

    if (link.unit) preferences.unit = link.unit
    if (link.speed !== null) preferences.speed = link.speed

    await rivers.select(link.riverId)
    if (rivers.status === 'ready' && link.from) {
      await sections.restore(link.from, link.to)
    }
  }

  return open().finally(() => {
    opening = false
    write()
  })
}
