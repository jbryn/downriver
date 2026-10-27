<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

/** How long the result stays on the button */
const FEEDBACK_MS = 2000

// The clipboard is only there on secure pages (https and localhost)
const supported = typeof navigator !== 'undefined' && navigator.clipboard !== undefined

const state = ref<'idle' | 'copied' | 'failed'>('idle')
let reset: ReturnType<typeof setTimeout> | undefined

const LABELS = { idle: 'Copy link', copied: 'Link copied', failed: 'Could not copy' } as const

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href)
    state.value = 'copied'
  } catch {
    // The browser can refuse, for example without permission
    state.value = 'failed'
  }

  clearTimeout(reset)
  reset = setTimeout(() => (state.value = 'idle'), FEEDBACK_MS)
}

onBeforeUnmount(() => clearTimeout(reset))
</script>

<template>
  <button
    v-if="supported"
    type="button"
    class="btn"
    aria-live="polite"
    data-testid="copy-link"
    @click="copy"
  >
    {{ LABELS[state] }}
  </button>
</template>
