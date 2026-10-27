<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '../stores/preferences'
import { useSectionStore } from '../stores/section'
import {
  MAX_SPEED,
  MIN_SPEED,
  SPEED_STEP,
  distanceValue,
  formatDuration,
  formatSpeed,
  paddlingMinutes
} from '../utils/trip'
import CopyLinkButton from './CopyLinkButton.vue'
import SectionFeatures from './SectionFeatures.vue'

const store = useSectionStore()
const { start, end, section, status, error } = storeToRefs(store)

const { unit, speed } = storeToRefs(usePreferencesStore())

const length = computed(() =>
  section.value ? distanceValue(section.value.length, unit.value) : null
)

const duration = computed(() =>
  section.value ? formatDuration(paddlingMinutes(section.value.length, speed.value)) : null
)
</script>

<template>
  <section class="mt-7" aria-labelledby="section-heading" data-testid="section-panel">
    <h3 id="section-heading" class="text-xs font-bold tracking-[0.16em] text-muted uppercase">
      Your section
    </h3>

    <p v-if="!start" class="mt-2 flex items-center gap-2" data-testid="section-hint">
      <span class="buoy bg-start" aria-hidden="true">A</span>
      Click the river where you put in.
    </p>

    <p v-else-if="!end" class="mt-2 flex items-center gap-2" data-testid="section-hint">
      <span class="buoy bg-finish" aria-hidden="true">B</span>
      A is set. Now click where you take out.
    </p>

    <div v-else-if="section" class="mt-1 animate-rise">
      <p class="font-display text-6xl leading-none tracking-tight" data-testid="section-length">
        {{ length }}<span class="text-2xl text-muted">{{ ` ${unit}` }}</span>
      </p>
      <p class="mt-2 flex items-center gap-1.5 text-sm text-muted">
        along the river from <span class="buoy buoy-sm bg-start">A</span> to
        <span class="buoy buoy-sm bg-finish">B</span>
      </p>

      <div
        v-if="!section.downstream"
        class="mt-3 rounded-xl bg-warn px-3.5 py-3 text-sm text-warn-ink"
        data-testid="section-upstream"
      >
        <p>B is upstream of A: this trip goes against the current.</p>
        <!-- Reversing only helps when the points were set in the wrong order; a downstream trip needs no such button -->
        <button
          type="button"
          class="mt-2 rounded-lg border border-current px-2.5 py-1 font-semibold transition hover:bg-warn-ink hover:text-warn"
          data-testid="section-reverse"
          @click="store.swap()"
        >
          Paddle it downstream
        </button>
      </div>

      <div class="mt-4 rounded-2xl border border-line bg-paper/70 px-4 py-3.5">
        <p>
          About
          <span class="font-display text-xl" data-testid="section-duration">{{ duration }}</span>
          of paddling
        </p>
        <label class="mt-3 flex justify-between text-sm text-muted" for="paddling-speed">
          <span>Average speed, breaks included</span>
          <span class="font-semibold text-ink tabular-nums" data-testid="section-speed">{{
            formatSpeed(speed, unit)
          }}</span>
        </label>
        <input
          id="paddling-speed"
          v-model.number="speed"
          type="range"
          :min="MIN_SPEED"
          :max="MAX_SPEED"
          :step="SPEED_STEP"
          :aria-valuetext="formatSpeed(speed, unit)"
          class="mt-2 w-full accent-river"
          data-testid="speed-input"
        />
      </div>

      <SectionFeatures :features="section.features" />
    </div>

    <p
      v-if="status === 'loading'"
      class="mt-2 text-sm text-muted"
      aria-live="polite"
      data-testid="section-loading"
    >
      Measuring…
    </p>

    <p
      v-if="status === 'error'"
      class="mt-2 text-sm text-danger"
      role="alert"
      data-testid="section-error"
    >
      {{ error }}
    </p>

    <div v-if="start" class="mt-4 flex gap-2">
      <CopyLinkButton v-if="end" />
      <button type="button" class="btn" data-testid="section-clear" @click="store.clear()">
        Clear
      </button>
    </div>
  </section>
</template>
