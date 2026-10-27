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
    class="inline-flex rounded-xl border border-line bg-sunken p-0.5 text-xs font-semibold"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :data-testid="`unit-${option.value}`"
      :aria-pressed="unit === option.value"
      :aria-label="option.name"
      class="rounded-lg px-2.5 py-1 transition-colors"
      :class="unit === option.value ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink'"
      @click="unit = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
