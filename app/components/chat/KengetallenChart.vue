<script setup lang="ts">
import '@unovis/ts/styles/index.js'
import { Scatter } from '@unovis/ts'
import { VisAxis, VisLine, VisScatter, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { KengetallenChartPoint, KengetallenChartSeries } from '~/types/kengetallen-widget'
import { formatKengetalPercent, isDashedSeries, seriesColor } from '~/utils/kengetallenChart'

const props = defineProps<{
  series: KengetallenChartSeries[]
}>()

const yDomain = computed(() => {
  const values = props.series.flatMap(entry => entry.points.map(point => point.waarde))
  if (values.length === 0) {
    return undefined
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.abs(max) * 0.1 || 0.01
  const pad = span * 0.15
  return [min - pad, max + pad] as [number, number]
})

interface ChartPoint extends KengetallenChartPoint {
  seriesLabel: string
}

function xAccessor(d: { jaar: number }) {
  return d.jaar
}

function yAccessor(d: { waarde: number }) {
  return d.waarde
}

function formatAxisPercent(value: number) {
  return formatKengetalPercent(value)
}

function pointsFor(entry: KengetallenChartSeries): ChartPoint[] {
  return entry.points.map(point => ({
    ...point,
    seriesLabel: entry.label
  }))
}

const tooltipTriggers = {
  [Scatter.selectors.point]: (d: ChartPoint) => (
    `<div>${d.seriesLabel} (${d.jaar}): ${formatKengetalPercent(d.waarde)}</div>`
  )
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
        :y-domain="yDomain"
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
        <VisScatter
          v-for="(entry, index) in series"
          :key="`${entry.id}-points`"
          :data="pointsFor(entry)"
          :x="xAccessor"
          :y="yAccessor"
          :color="seriesColor(index)"
          :size="8"
        />
        <VisAxis
          type="x"
          :tick-format="(value: number) => String(value)"
        />
        <VisAxis
          type="y"
          :tick-format="formatAxisPercent"
        />
        <VisTooltip :triggers="tooltipTriggers" />
      </VisXYContainer>
    </ClientOnly>
  </div>
</template>

<style scoped>
.kengetallen-chart {
  width: 100%;
}
</style>
