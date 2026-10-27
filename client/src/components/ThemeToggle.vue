<script setup lang="ts">
import { useTheme, type ThemePreference } from '../composables/useTheme'

const { preference } = useTheme()

/** Icons rather than words keep the header within a phone's width */
const options: { value: ThemePreference; label: string; icon: string }[] = [
  {
    value: 'system',
    label: 'Automatic theme',
    // Half light, half dark
    icon: 'M12 3a9 9 0 1 0 0 18Z M12 3a9 9 0 1 1 0 18'
  },
  {
    value: 'light',
    label: 'Light theme',
    icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4'
  },
  {
    value: 'dark',
    label: 'Dark theme',
    icon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z'
  }
]
</script>

<template>
  <div
    role="group"
    aria-label="Colour theme"
    data-testid="theme-toggle"
    class="inline-flex rounded-xl border border-line bg-sunken p-0.5"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :data-testid="`theme-${option.value}`"
      :aria-pressed="preference === option.value"
      :aria-label="option.label"
      :title="option.label"
      class="flex size-7 items-center justify-center rounded-lg transition-colors"
      :class="
        preference === option.value ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink'
      "
      @click="preference = option.value"
    >
      <svg
        class="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path :d="option.icon" />
      </svg>
    </button>
  </div>
</template>
