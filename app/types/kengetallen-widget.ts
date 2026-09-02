export interface KengetallenChartPoint {
  jaar: number
  waarde: number
  begroting?: string | null
  type_raming?: string | null
}

export interface KengetallenChartSeries {
  id: string
  label: string
  type_raming: string
  begroting?: string
  dashed?: boolean
  points: KengetallenChartPoint[]
}

export interface KengetallenRow {
  begroting: string
  kengetal: string
  jaar: number
  type_raming: string
  waarde: string | null
}

export interface KengetallenWidgetSpec {
  kind: 'kengetallen_chart'
  gemeente: string
  gemeente_naam: string
  kengetal: string
  rows: KengetallenRow[]
  series: KengetallenChartSeries[]
  options: {
    kengetallen: string[]
    type_raming: string[]
  }
}
