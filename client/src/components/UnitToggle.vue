<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '../stores/preferences'
import type { DistanceUnit } from '../utils/trip'

const { unit } = storeToRefs(usePreferencesStore())

const options: { value: DistanceUnit; label: string; name: string }[] = [
  { value: 'km', label: 'km', name: 'Kilometers' },
  { value: 'mi', label: 'mi', name: 'Miles' }
]
</script>

<template>
  <div
    role="group"
    aria-label="Distance unit"
    data-testid="unit-toggle"
    class="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium dark:bg-slate-800"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :data-testid="`unit-${option.value}`"
      :aria-pressed="unit === option.value"
      :aria-label="option.name"
      class="rounded-md px-2.5 py-1 transition-colors"
      :class="
        unit === option.value
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      "
      @click="unit = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
