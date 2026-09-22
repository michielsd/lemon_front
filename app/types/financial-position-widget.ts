import type { KengetallenChartSeries } from '~/types/kengetallen-widget'

export interface FinancialPositionSnapshot {
  begroting?: string | null
  jaar?: number | null
  type_raming?: string | null
  waarde?: number | null
  waarde_pct?: string | null
  categorie?: string | null
  categorie_label?: string | null
  positie?: string | null
  pad_toelichting?: string | null
  grootteklasse?: string | null
  gemiddelde_pct?: string | null
  tov_gemiddelde?: string | null
}

export interface FinancialPositionKengetal {
  kengetal: string
  pillar?: string | null
  rekening: FinancialPositionSnapshot | null
  begroting: FinancialPositionSnapshot | null
  series: KengetallenChartSeries[]
}

export interface FinancialPositionLabels {
  rekening_label?: string | null
  begroting_label?: string | null
}

export interface FinancialPositionWidgetSpec {
  kind: 'financial_position'
  gemeente: string
  gemeente_naam: string
  rekening?: {
    jaar?: number | null
    begroting?: string | null
  }
  begroting?: {
    begroting?: string | null
    jaar?: number | null
  }
  kengetallen: FinancialPositionKengetal[]
  weerbaar?: FinancialPositionLabels
  wendbaar?: FinancialPositionLabels
  overall?: FinancialPositionLabels
}
