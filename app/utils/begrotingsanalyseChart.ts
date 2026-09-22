import type { BegrotingsanalyseChartSpec } from '~/types/begrotingsanalyse-widget'
import { toRaw } from 'vue'

export function isBegrotingsanalyseChartSpec(value: unknown): value is BegrotingsanalyseChartSpec {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as BegrotingsanalyseChartSpec
  return candidate.kind === 'begrotingsanalyse_chart' && Array.isArray(candidate.series)
}

export function cloneBegrotingsanalyseChartSpec(
  spec: BegrotingsanalyseChartSpec
): BegrotingsanalyseChartSpec {
  return JSON.parse(JSON.stringify(toRaw(spec))) as BegrotingsanalyseChartSpec
}

export function formatMillion(value: number): string {
  return value.toLocaleString('nl-NL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  })
}
