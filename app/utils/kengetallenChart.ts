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

export interface KengetallenVisibility {
  rekening: boolean
  begroting: boolean
  meerjarenraming: boolean
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

export function filterVisibleSeries(
  series: KengetallenChartSeries[],
  visibility: KengetallenVisibility
): KengetallenChartSeries[] {
  return series.filter((entry) => {
    if (entry.type_raming === 'Rekening') {
      return visibility.rekening
    }
    if (entry.type_raming === 'Begroting') {
      return visibility.begroting
    }
    if (entry.type_raming === 'Meerjarenraming') {
      return visibility.meerjarenraming
    }
    return true
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
  visibility: KengetallenVisibility
): KengetallenRow[] {
  return rows.filter((row) => {
    if (row.type_raming === 'Rekening') {
      return visibility.rekening
    }
    if (row.type_raming === 'Begroting') {
      return visibility.begroting
    }
    if (row.type_raming === 'Meerjarenraming') {
      return visibility.meerjarenraming
    }
    return true
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
