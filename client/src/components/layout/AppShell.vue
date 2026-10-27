<script setup lang="ts">
import { ref } from 'vue'
import ThemeToggle from '../ThemeToggle.vue'
import UnitToggle from '../UnitToggle.vue'

/**
 * The page layout: a header, the map filling the rest of the screen, and a panel for
 * controls. On wide screens the panel floats over the left of the map; on narrow ones
 * it is a sheet below the map that can be collapsed to leave more room for it.
 *
 * The map area sets --map-cover-left to the width the panel covers, so the map can keep
 * what it fits in view clear of the panel.
 */
const sheetOpen = ref(true)
</script>

<template>
  <div class="flex h-full flex-col" data-testid="app-shell">
    <header
      class="relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-paper px-4"
    >
      <h1 class="flex items-center gap-2 font-display text-xl leading-none" data-testid="app-title">
        <svg
          class="size-7 shrink-0"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          data-testid="app-logo"
        >
          <path
            d="M6 3c0 6 9 5 9 11s-9 5-9 11 5 4 8 4"
            class="stroke-river"
            stroke-width="3.5"
            stroke-linecap="round"
          />
          <circle cx="24" cy="9" r="3" class="fill-start" />
          <circle cx="24" cy="23" r="3" class="fill-finish" />
        </svg>
        <slot name="title" />
      </h1>
      <div class="flex items-center gap-2">
        <UnitToggle />
        <ThemeToggle />
      </div>
    </header>

    <div class="relative flex min-h-0 flex-1 flex-col md:block">
      <main
        class="relative isolate min-h-0 flex-1 bg-sunken md:absolute md:inset-0 md:[--map-cover-left:416px]"
        data-testid="map-area"
      >
        <slot name="map" />
      </main>

      <aside
        class="contours relative z-10 flex shrink-0 flex-col border-line bg-surface shadow-[0_-8px_24px_rgb(0_0_0/0.12)] backdrop-blur-md max-md:rounded-t-2xl max-md:border-t md:absolute md:top-4 md:bottom-4 md:left-4 md:w-96 md:rounded-2xl md:border md:shadow-2xl"
        :class="sheetOpen ? 'max-md:max-h-[60%]' : ''"
        data-testid="side-panel"
      >
        <button
          type="button"
          class="flex w-full items-center justify-center py-2 md:hidden"
          :aria-expanded="sheetOpen"
          aria-controls="panel-content"
          :aria-label="sheetOpen ? 'Collapse panel' : 'Expand panel'"
          data-testid="sheet-toggle"
          @click="sheetOpen = !sheetOpen"
        >
          <span class="h-1.5 w-10 rounded-full bg-line" />
        </button>

        <div
          id="panel-content"
          class="min-h-0 flex-1 overflow-y-auto px-5 pb-5 md:pt-5"
          :class="sheetOpen ? '' : 'max-md:hidden'"
          data-testid="panel-content"
        >
          <slot name="panel" />
        </div>
      </aside>
    </div>
  </div>
</template>
