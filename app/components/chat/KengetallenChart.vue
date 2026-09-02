<script setup lang="ts">
import '@unovis/ts/styles/index.js'
import { VisAxis, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { KengetallenChartSeries } from '~/types/kengetallen-widget'
import { isDashedSeries, seriesColor } from '~/utils/kengetallenChart'

defineProps<{
  series: KengetallenChartSeries[]
}>()

function xAccessor(d: { jaar: number }) {
  return d.jaar
}

function yAccessor(d: { waarde: number }) {
  return d.waarde
}

function lineDashArray(entry: KengetallenChartSeries) {
  return isDashedSeries(entry) ? [6, 4] : null
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-3 text-xs text-muted">
      <span
        v-for="(entry, index) in series"
        :key="entry.id"
        class="inline-flex items-center gap-1.5"
      >
        <span
          v-if="isDashedSeries(entry)"
          class="inline-block w-4 border-t-2 border-dashed"
          :style="{ borderColor: seriesColor(index) }"
        />
        <span
          v-else
          class="inline-block size-2.5 rounded-full"
          :style="{ backgroundColor: seriesColor(index) }"
        />
        {{ entry.label }}
      </span>
    </div>

    <ClientOnly>
      <VisXYContainer
        :height="320"
        class="kengetallen-chart"
      >
        <VisLine
          v-for="(entry, index) in series"
          :key="entry.id"
          :data="entry.points"
          :x="xAccessor"
          :y="yAccessor"
          :color="seriesColor(index)"
          :line-dash-array="lineDashArray(entry)"
        />
        <VisAxis
          type="x"
          :tick-format="(value: number) => String(value)"
        />
        <VisAxis type="y" />
        <VisTooltip />
      </VisXYContainer>
    </ClientOnly>
  </div>
</template>

<style scoped>
.kengetallen-chart {
  width: 100%;
}
</style>
