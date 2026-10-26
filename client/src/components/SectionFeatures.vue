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
  <div class="mt-5" data-testid="section-features">
    <h4 class="text-sm font-semibold">
      On the route
      <span class="font-normal text-slate-500 dark:text-slate-400">· distances from A</span>
    </h4>

    <p
      v-if="features.length === 0"
      class="mt-1 text-sm text-slate-500 dark:text-slate-400"
      data-testid="section-features-empty"
    >
      No obstacles or access points are mapped on this section.
    </p>

    <template v-else>
      <p
        class="mt-1 text-sm text-slate-500 dark:text-slate-400"
        data-testid="section-features-summary"
      >
        {{ plural(obstacles, 'obstacle') }} · {{ plural(accessPoints, 'access point') }}
      </p>

      <ol class="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-800">
        <li
          v-for="(feature, index) in features"
          :key="index"
          class="flex items-baseline gap-3 py-1.5"
          :data-testid="`section-feature-${feature.category}`"
        >
          <span class="w-16 shrink-0 text-right text-slate-500 tabular-nums dark:text-slate-400">
            {{ formatDistance(feature.distance, unit) }}
          </span>
          <span
            class="size-2.5 shrink-0 self-center rounded-full"
            :class="
              feature.category === 'obstacle'
                ? 'bg-red-600'
                : 'border-2 border-teal-700 bg-white dark:border-teal-400 dark:bg-slate-900'
            "
            aria-hidden="true"
          />
          <span class="min-w-0">
            <span :class="{ 'font-semibold': feature.category === 'obstacle' }">
              {{ kindLabel(feature.kind) }}
            </span>
            <span v-if="feature.name" class="text-slate-500 dark:text-slate-400">
              · {{ feature.name }}</span
            >
          </span>
        </li>
      </ol>
    </template>
  </div>
</template>
