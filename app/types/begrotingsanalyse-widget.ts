export interface BegrotingsanalyseSeries {
  name: string
  values: number[]
}

export interface BegrotingsanalyseChartSpec {
  kind: 'begrotingsanalyse_chart'
  id: string
  name: string
  unit: string
  categories: string[]
  series: BegrotingsanalyseSeries[]
  legend?: string
  filters?: Record<string, string>
}
