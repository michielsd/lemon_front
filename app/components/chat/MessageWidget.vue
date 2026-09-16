<script setup lang="ts">
import type { ChatWidgetSpec } from '~/types/chat'
import { isKengetallenWidgetSpec } from '~/utils/kengetallenChart'
import { isDataTableWidgetSpec } from '~/utils/dataTable'

defineProps<{
  widget: ChatWidgetSpec
}>()
</script>

<template>
  <Suspense v-if="isKengetallenWidgetSpec(widget)">
    <LazyChatKengetallenWidget :initial-spec="widget" />
    <template #fallback>
      <ChatKengetallenWidgetSkeleton
        :kengetal="widget.kengetal"
        :gemeente-naam="widget.gemeente_naam"
      />
    </template>
  </Suspense>
  <Suspense v-else-if="isDataTableWidgetSpec(widget)">
    <LazyChatTableWidget :initial-spec="widget" />
    <template #fallback>
      <ChatTableWidgetSkeleton :name="widget.name" />
    </template>
  </Suspense>
</template>
