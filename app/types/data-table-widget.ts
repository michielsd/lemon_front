import type { SelectorDefinition } from '~/types/selectors'
import type { TableFilters } from '~/composables/useTables'

export interface DataTableWidgetSpec {
  kind: 'data_table'
  id: string
  name: string
  rows: Record<string, unknown>[]
  selectors?: Record<string, SelectorDefinition>
  filters?: TableFilters
}
