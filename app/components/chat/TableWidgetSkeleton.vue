<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-default bg-elevated/40">
    <div class="border-b border-default px-4 py-3">
      <p class="font-medium text-highlighted">
        {{ name }}
      </p>
    </div>
    <div class="space-y-4 px-4 py-4">
      <div class="flex flex-wrap gap-3">
        <USkeleton class="h-9 min-w-40 flex-1 rounded-md" />
        <USkeleton class="h-9 min-w-40 flex-1 rounded-md" />
        <USkeleton class="h-9 min-w-40 flex-1 rounded-md" />
        <USkeleton class="h-9 min-w-40 flex-1 rounded-md" />
      </div>
      <USkeleton class="h-64 w-full rounded-lg" />
      <p class="text-center text-xs text-muted">
        Tabel laden…
      </p>
    </div>
  </div>
</template>
