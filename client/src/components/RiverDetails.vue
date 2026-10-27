<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '../stores/preferences'
import { useRiverStore } from '../stores/river'
import { formatDistance } from '../utils/trip'
import SectionPanel from './SectionPanel.vue'

const emit = defineEmits<{ back: [] }>()

const store = useRiverStore()
const { river, status, error } = storeToRefs(store)
const { unit } = storeToRefs(usePreferencesStore())

const length = computed(() => (river.value ? formatDistance(river.value.length, unit.value) : null))

const obstacles = computed(
  () => river.value?.features.filter((feature) => feature.category === 'obstacle').length ?? 0
)

const accessPoints = computed(
  () => river.value?.features.filter((feature) => feature.category === 'access').length ?? 0
)
</script>

<template>
  <section data-testid="river-details">
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-river hover:underline"
      data-testid="change-river"
      @click="emit('back')"
    >
      <span aria-hidden="true">←</span> Choose another river
    </button>

    <p
      v-if="status === 'loading'"
      class="text-muted"
      aria-live="polite"
      data-testid="river-loading"
    >
      Loading river…
    </p>

    <div v-else-if="status === 'error'" role="alert" data-testid="river-error">
      <p class="text-danger">{{ error }}</p>
      <button type="button" class="btn mt-3" data-testid="river-retry" @click="store.retry()">
        Try again
      </button>
    </div>

    <template v-else-if="river">
      <h2 class="animate-rise font-display text-4xl leading-tight" data-testid="river-name">
        {{ river.name }}
      </h2>

      <dl
        class="mt-4 grid animate-rise grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-paper/70 [animation-delay:60ms]"
      >
        <div class="px-3 py-3">
          <dt class="text-xs text-muted">Length</dt>
          <dd class="mt-1 font-display text-xl" data-testid="river-length">{{ length }}</dd>
        </div>
        <div class="px-3 py-3">
          <dt class="flex items-center gap-1.5 text-xs text-muted">
            <span class="dot dot-obstacle size-2.5" aria-hidden="true" />Obstacles
          </dt>
          <dd class="mt-1 font-display text-xl" data-testid="river-obstacles">{{ obstacles }}</dd>
        </div>
        <div class="px-3 py-3">
          <dt class="flex items-center gap-1.5 text-xs text-muted">
            <span class="dot dot-access size-2.5" aria-hidden="true" />Access
          </dt>
          <dd class="mt-1 font-display text-xl" data-testid="river-access-points">
            {{ accessPoints }}
          </dd>
        </div>
      </dl>

      <SectionPanel />
    </template>
  </section>
</template>
