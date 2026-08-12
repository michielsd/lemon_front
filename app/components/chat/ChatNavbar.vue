<script setup lang="ts">
defineProps<{
  title?: string
}>()

const emit = defineEmits<{
  newChat: []
}>()
</script>

<template>
  <UDashboardNavbar
    class="absolute inset-x-0 top-0 z-10 border-b-0 px-4 backdrop-blur sm:px-4"
    :ui="{ left: 'min-w-0' }"
  >
    <template #left>
      <slot name="title">
        <h1 class="truncate text-sm font-medium text-highlighted">
          {{ title ?? 'Chat' }}
        </h1>
      </slot>
    </template>

    <template #right>
      <slot />

      <UColorModeButton />

      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-circle-plus"
        aria-label="New chat"
        @click="emit('newChat')"
      />
    </template>
  </UDashboardNavbar>
</template>
