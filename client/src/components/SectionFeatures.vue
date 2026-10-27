<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '../stores/preferences'
import { kindLabel } from '../utils/features'
import { formatDistance } from '../utils/trip'
import type { SectionFeature } from '../types/river'

const props = defineProps<{ features: SectionFeature[] }>()

const { unit } = storeToRefs(usePreferencesStore())

const obstacles = computed(
  () => props.features.filter((feature) => feature.category === 'obstacle').length
)
const accessPoints = computed(() => props.features.length - obstacles.value)

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
</script>

<template>
  <div class="mt-6" data-testid="section-features">
    <h4 class="text-xs font-bold tracking-[0.16em] text-muted uppercase">
      On the route
      <span class="font-normal tracking-normal normal-case">· distances from A</span>
    </h4>

    <p
      v-if="features.length === 0"
      class="mt-2 text-sm text-muted"
      data-testid="section-features-empty"
    >
      No obstacles or access points are mapped on this section.
    </p>

    <template v-else>
      <p class="mt-2 flex items-center gap-3 text-sm" data-testid="section-features-summary">
        <span class="flex items-center gap-1.5"
          ><span class="dot dot-obstacle" aria-hidden="true" />{{
            plural(obstacles, 'obstacle')
          }}</span
        >
        <span class="text-muted">{{ ' · ' }}</span>
        <span class="flex items-center gap-1.5"
          ><span class="dot dot-access" aria-hidden="true" />{{
            plural(accessPoints, 'access point')
          }}</span
        >
      </p>

      <!-- The line down the list stands for the river, with each feature on it -->
      <ol
        class="relative mt-3 text-sm before:absolute before:top-3 before:bottom-3 before:left-[82px] before:w-0.5 before:rounded-full before:bg-river/30"
      >
        <li
          v-for="(feature, index) in features"
          :key="index"
          class="relative flex items-baseline gap-3 py-1.5"
          :data-testid="`section-feature-${feature.category}`"
        >
          <span class="w-[70px] shrink-0 text-right text-muted tabular-nums">
            {{ formatDistance(feature.distance, unit) }}
          </span>
          <span
            class="dot self-center"
            :class="feature.category === 'obstacle' ? 'dot-obstacle' : 'dot-access'"
            aria-hidden="true"
          />
          <span class="min-w-0">
            <span :class="{ 'font-bold': feature.category === 'obstacle' }">
              {{ kindLabel(feature.kind) }}
            </span>
            <span v-if="feature.name" class="text-muted"> · {{ feature.name }}</span>
          </span>
        </li>
      </ol>
    </template>
  </div>
</template>
