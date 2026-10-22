import type { FeatureKind, RiverFeature, SectionFeature } from '../types/river'

const KIND_LABELS: Record<FeatureKind, string> = {
  weir: 'Weir',
  dam: 'Dam',
  lock: 'Lock',
  rapids: 'Rapids',
  waterfall: 'Waterfall',
  put_in: 'Put-in',
  slipway: 'Slipway',
  bridge: 'Bridge'
}

export const kindLabel = (kind: FeatureKind): string => KIND_LABELS[kind]

/** "Bridge: Most Bolesława Chrobrego", or just "Weir" when the map gives no name */
export const featureLabel = (feature: RiverFeature | SectionFeature): string =>
  feature.name ? `${kindLabel(feature.kind)}: ${feature.name}` : kindLabel(feature.kind)
