<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { TILE_ATTRIBUTION, TILE_URL } from '../config'
import { featureLabel } from '../utils/features'
import type { LatLng, River, SectionFeature } from '../types/river'

const props = defineProps<{
  river: River | null
  start: LatLng | null
  end: LatLng | null
  /** The selected stretch of the river, drawn over it */
  section: LatLng[] | null
  /** Obstacles and access points on the selected stretch */
  features: SectionFeature[] | null
  /** Changes whenever a request about the selection finishes; see syncMarkers() */
  revision: number
}>()

const emit = defineEmits<{
  pick: [point: LatLng]
  moveStart: [point: LatLng]
  moveEnd: [point: LatLng]
}>()

/** Poland, where all the offered rivers are */
const START_CENTER: L.LatLngTuple = [52.1, 19.4]
const START_ZOOM = 6

const container = ref<HTMLElement | null>(null)

let map: L.Map | null = null
let riverLine: L.Polyline | null = null
let sectionLine: L.Polyline | null = null
let startMarker: L.Marker | null = null
let endMarker: L.Marker | null = null
let featureLayer: L.LayerGroup | null = null
let resizeObserver: ResizeObserver | null = null

const toLatLng = (latlng: L.LatLng): LatLng => [latlng.lat, latlng.lng]

const markerIcon = (label: string, colour: string) =>
  L.divIcon({
    className: '',
    html: `<span class="flex size-8 items-center justify-center rounded-full border-[3px] border-white font-display text-base text-white shadow-lg ${colour}">${label}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })

const createMarker = (
  label: string,
  title: string,
  colour: string,
  onMoved: (point: LatLng) => void
) =>
  L.marker([0, 0], { icon: markerIcon(label, colour), draggable: true, title, keyboard: true }).on(
    'dragend',
    (event) => onMoved(toLatLng((event.target as L.Marker).getLatLng()))
  )

/**
 * Shows each marker where the selection says it is. Called after every finished
 * request, so a marker dragged to a refused place jumps back.
 */
const syncMarkers = () => {
  if (!map) return

  for (const [marker, point] of [
    [startMarker, props.start],
    [endMarker, props.end]
  ] as const) {
    if (!marker) continue

    if (point) {
      marker.setLatLng(point)
      if (!map.hasLayer(marker)) marker.addTo(map)
    } else {
      marker.remove()
    }
  }
}

/** Space kept around what the map fits in view, clear of the panel floating over it */
const fitPadding = (): L.FitBoundsOptions => {
  const covered = container.value
    ? Number.parseFloat(getComputedStyle(container.value).getPropertyValue('--map-cover-left'))
    : 0
  const left = Number.isFinite(covered) ? covered : 0

  return { paddingTopLeft: [left + 24, 24], paddingBottomRight: [24, 24] }
}

const showRiver = (river: River | null) => {
  if (!map) return

  riverLine?.remove()
  riverLine = null

  if (river) {
    // Colours of lines and markers come from the theme, in style.css
    riverLine = L.polyline(river.points, { weight: 4, className: 'river-line' }).addTo(map)
    map.fitBounds(riverLine.getBounds(), fitPadding())
  }
}

const showSection = (points: LatLng[] | null) => {
  if (!map) return

  sectionLine?.remove()
  sectionLine = null

  if (points && points.length >= 2) {
    sectionLine = L.polyline(points, {
      weight: 7,
      className: 'section-line',
      // Clicks on the section go to the map, like clicks on the river
      bubblingMouseEvents: true
    }).addTo(map)
  }
}

/** Above the river and section lines (z-index 400), below the A and B markers (600) */
const FEATURE_PANE = 'features'

const showFeatures = (features: SectionFeature[] | null) => {
  if (!featureLayer) return

  featureLayer.clearLayers()

  for (const feature of features ?? []) {
    L.circleMarker(feature.point, {
      fillOpacity: 1,
      radius: 6,
      weight: 2,
      className: `feature-marker feature-${feature.category}`,
      pane: FEATURE_PANE
    })
      .bindTooltip(featureLabel(feature))
      .addTo(featureLayer)
  }
}

onMounted(() => {
  if (!container.value) return

  map = L.map(container.value, { zoomControl: false }).setView(START_CENTER, START_ZOOM)
  // On the right: on wide screens the panel covers the left of the map
  L.control.zoom({ position: 'topright' }).addTo(map)
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)

  map.on('click', (event: L.LeafletMouseEvent) => {
    if (props.river) emit('pick', toLatLng(event.latlng))
  })

  map.createPane(FEATURE_PANE).style.zIndex = '450'
  featureLayer = L.layerGroup().addTo(map)

  startMarker = createMarker('A', 'Start', 'bg-start', (point) => emit('moveStart', point))
  endMarker = createMarker('B', 'Finish', 'bg-finish', (point) => emit('moveEnd', point))

  // The map's box changes when the bottom sheet opens or closes; Leaflet must be told
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => map?.invalidateSize())
    resizeObserver.observe(container.value)
  }

  // Lets end-to-end tests turn coordinates into screen positions; not in production builds
  if (import.meta.env.DEV) {
    ;(window as Window & { __downriverMap?: L.Map }).__downriverMap = map
  }

  showRiver(props.river)
  showSection(props.section)
  showFeatures(props.features)
  syncMarkers()
})

watch(() => props.river, showRiver)
watch(() => props.section, showSection)
watch(() => props.features, showFeatures)
watch([() => props.start, () => props.end, () => props.revision], syncMarkers)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="h-full w-full" :class="{ 'map-picking': river }" data-testid="river-map">
    <!-- Leaflet's own container: a class binding here would overwrite the classes Leaflet adds -->
    <div ref="container" class="h-full w-full" />
  </div>
</template>
