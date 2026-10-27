<script setup lang="ts">
import { useRiverSearch } from '../composables/useRiverSearch'

const emit = defineEmits<{ select: [id: number] }>()

const { query, results, status, error, retry } = useRiverSearch()
</script>

<template>
  <section data-testid="river-search">
    <h2 class="animate-rise font-display text-3xl leading-tight">Where are you paddling?</h2>
    <p class="mt-2 animate-rise text-muted [animation-delay:60ms]">
      Pick a river, then click where you put in and where you take out.
    </p>

    <label for="river-query" class="sr-only">River</label>
    <div class="relative mt-5 animate-rise [animation-delay:120ms]">
      <svg
        class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="river-query"
        v-model="query"
        type="search"
        autocomplete="off"
        placeholder="Search rivers, e.g. Gwda"
        class="w-full rounded-xl border border-line bg-paper py-2.5 pr-3 pl-10 text-base placeholder:text-muted focus:border-river focus:ring-4 focus:ring-river/20 focus:outline-none"
        data-testid="river-query"
      />
    </div>

    <p v-if="status === 'error'" class="mt-4 text-danger" role="alert" data-testid="search-error">
      {{ error }}
      <button
        type="button"
        class="ml-1 font-semibold underline"
        data-testid="search-retry"
        @click="retry"
      >
        Try again
      </button>
    </p>

    <p
      v-else-if="status === 'done' && results.length === 0"
      class="mt-4 text-muted"
      data-testid="search-empty"
    >
      No rivers match “{{ query.trim() }}”.
    </p>

    <ul
      v-else
      class="mt-4 grid animate-rise grid-cols-2 gap-2 [animation-delay:180ms]"
      :aria-busy="status === 'loading'"
      aria-label="Rivers"
      data-testid="search-results"
    >
      <li v-for="river in results" :key="river.id">
        <button
          type="button"
          class="group flex w-full items-center gap-2 rounded-xl border border-line bg-paper/60 px-3 py-2.5 text-left transition hover:-translate-y-px hover:border-river hover:shadow-md focus-visible:border-river focus-visible:ring-4 focus-visible:ring-river/20 focus-visible:outline-none"
          :data-testid="`river-option-${river.id}`"
          @click="emit('select', river.id)"
        >
          <svg
            class="size-4 shrink-0 text-river transition group-hover:translate-x-0.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M2 4c3 0 3 4 6 4s3-4 6-4M2 10c3 0 3 4 6 4s3-4 6-4" />
          </svg>
          <span class="leading-tight">{{ river.name }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>
