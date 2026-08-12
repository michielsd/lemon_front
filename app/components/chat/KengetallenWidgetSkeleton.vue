<script setup lang="ts">
defineProps<{
  kengetal: string
  gemeenteNaam: string
}>()
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-default bg-elevated/40">
    <div class="flex items-start justify-between gap-3 border-b border-default px-4 py-3">
      <div class="space-y-1.5">
        <p class="font-medium text-highlighted">
          {{ kengetal }}
        </p>
        <p class="text-sm text-muted">
          {{ gemeenteNaam }}
        </p>
      </div>
      <USkeleton class="size-8 rounded-md" />
    </div>

    <div class="space-y-4 px-4 py-4">
      <div class="flex flex-wrap gap-3">
        <USkeleton class="h-9 min-w-64 flex-1 rounded-md" />
        <USkeleton class="h-5 w-24 rounded-md" />
        <USkeleton class="h-5 w-24 rounded-md" />
      </div>
      <USkeleton class="h-80 w-full rounded-lg" />
      <p class="text-center text-xs text-muted">
        Grafiek laden…
      </p>
    </div>
  </div>
</template>
