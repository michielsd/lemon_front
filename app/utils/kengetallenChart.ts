import type {
  KengetallenChartPoint,
  KengetallenChartSeries,
  KengetallenRow,
  KengetallenWidgetSpec
} from '~/types/kengetallen-widget'
import { toRaw } from 'vue'

export function cloneKengetallenWidgetSpec(spec: KengetallenWidgetSpec): KengetallenWidgetSpec {
  return JSON.parse(JSON.stringify(toRaw(spec))) as KengetallenWidgetSpec
}

export interface KengetallenChartLinePoint extends KengetallenChartPoint {
  seriesId: string
  seriesLabel: string
}

export function listSelectableBegrotingen(
  series: KengetallenChartSeries[],
  optionBegrotingen: string[] = []
): string[] {
  const values = new Set<string>()
  for (const entry of series) {
    if (isBegrootSeries(entry) && entry.begroting) {
      values.add(entry.begroting)
    }
  }
  if (values.size === 0) {
    for (const value of optionBegrotingen) {
      if (value) {
        values.add(value)
      }
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'nl', { numeric: true }))
}

export function defaultSelectedBegrotingen(begrotingen: string[]): string[] {
  const latest = begrotingen[begrotingen.length - 1]
  return latest ? [latest] : []
}

const SERIES_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#be123c',
  '#4f46e5'
]

export function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length] ?? '#2563eb'
}

export function isGerealiseerdSeries(entry: KengetallenChartSeries): boolean {
  return entry.type_raming === 'Rekening' || entry.id === 'gerealiseerd'
}

export function isBegrootSeries(entry: KengetallenChartSeries): boolean {
  return (
    entry.type_raming === 'Begroot'
    || entry.type_raming === 'Begroting'
    || entry.type_raming === 'Meerjarenraming'
  )
}

export function isDashedSeries(entry: KengetallenChartSeries): boolean {
  return entry.dashed === true || isBegrootSeries(entry)
}

export function filterVisibleSeries(
  series: KengetallenChartSeries[],
  selectedBegrotingen: string[]
): KengetallenChartSeries[] {
  const selected = new Set(selectedBegrotingen)
  return series.filter((entry) => {
    if (isGerealiseerdSeries(entry)) {
      return true
    }
    if (isBegrootSeries(entry)) {
      return Boolean(entry.begroting && selected.has(entry.begroting))
    }
    return false
  })
}

export function flattenSeriesForChart(
  series: KengetallenChartSeries[]
): KengetallenChartLinePoint[] {
  const points: KengetallenChartLinePoint[] = []
  for (const entry of series) {
    for (const point of entry.points) {
      points.push({
        ...point,
        seriesId: entry.id,
        seriesLabel: entry.label
      })
    }
  }
  return points
}

export function filterRowsForTable(
  rows: KengetallenRow[],
  selectedBegrotingen: string[]
): KengetallenRow[] {
  const selected = new Set(selectedBegrotingen)
  return rows.filter((row) => {
    if (row.type_raming === 'Rekening') {
      return true
    }
    return selected.has(row.begroting)
  })
}

export function formatWaarde(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return String(value)
  }
  return numeric.toLocaleString('nl-NL', { maximumFractionDigits: 4 })
}

export function isKengetallenWidgetSpec(value: unknown): value is KengetallenWidgetSpec {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as KengetallenWidgetSpec
  return candidate.kind === 'kengetallen_chart' && Array.isArray(candidate.series)
}
