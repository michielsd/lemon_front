<script setup lang="ts">
import type { FinancialPositionKengetal, FinancialPositionWidgetSpec } from '~/types/financial-position-widget'
import { financialPositionDiscussion } from '~/utils/financialPosition'

const props = defineProps<{
  spec: FinancialPositionWidgetSpec
}>()

const sections = computed(() => {
  const groups = [
    { id: 'weerbaar', title: 'Weerbaarheid' },
    { id: 'wendbaar', title: 'Wendbaarheid' }
  ]
  return groups
    .map(group => ({
      ...group,
      items: props.spec.kengetallen.filter(item => item.pillar === group.id && hasContent(item))
    }))
    .filter(group => group.items.length > 0)
})

const summary = computed(() => {
  const parts: string[] = []
  const rekeningLabel = props.spec.overall?.rekening_label
  const begrotingLabel = props.spec.overall?.begroting_label
  const rekeningJaar = props.spec.rekening?.jaar
  const begroting = props.spec.begroting?.begroting
  if (rekeningLabel) {
    parts.push(`Jaarrekening${rekeningJaar ? ` (${rekeningJaar})` : ''}: ${rekeningLabel}`)
  }
  if (begrotingLabel) {
    parts.push(`Begroting${begroting ? ` (${begroting})` : ''}: ${begrotingLabel}`)
  }
  return parts.join('. ')
})

function hasContent(item: FinancialPositionKengetal) {
  return Boolean(item.rekening || item.begroting || item.series?.length)
}

function discussion(item: FinancialPositionKengetal) {
  return financialPositionDiscussion(item.rekening, item.begroting)
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-default bg-elevated/40">
    <div class="border-b border-default px-4 py-3">
      <p class="font-medium text-highlighted">
        Financiële positie
      </p>
      <p class="text-sm text-muted">
        {{ spec.gemeente_naam }}
      </p>
      <p
        v-if="summary"
        class="mt-1 text-sm"
      >
        {{ summary }}
      </p>
    </div>

    <div class="space-y-6 px-4 py-4">
      <section
        v-for="section in sections"
        :key="section.id"
        class="space-y-4"
      >
        <h3 class="text-sm font-semibold text-highlighted">
          {{ section.title }}
        </h3>
        <article
          v-for="item in section.items"
          :key="item.kengetal"
          class="grid items-center gap-4 border-t border-default pt-4 md:grid-cols-2"
        >
          <div class="space-y-1 text-sm">
            <p class="font-medium text-highlighted">
              {{ item.kengetal }}
            </p>
            <p v-if="discussion(item).jaarrekening">
              {{ discussion(item).jaarrekening }}
            </p>
            <p v-if="discussion(item).begroting">
              {{ discussion(item).begroting }}
            </p>
          </div>
          <ChatKengetallenChart
            v-if="item.series?.length"
            :series="item.series"
            compact
          />
        </article>
      </section>
    </div>
  </div>
</template>
