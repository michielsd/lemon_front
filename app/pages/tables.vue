<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { SelectorOptions } from '~/types/selectors'
import type { TableFilters } from '~/composables/useTables'

const selectorValues = ref<TableFilters>({})
const selectorsInitialized = ref(false)

const filters = computed<TableFilters>(() => ({
  gemeente: selectorValues.value.gemeente,
  circulaire: selectorValues.value.circulaire,
  jaar: selectorValues.value.jaar,
  prijzen_type: selectorValues.value.prijzen_type
}))

const filtersComplete = computed(() =>
  Boolean(
    filters.value.gemeente
    && filters.value.circulaire
    && filters.value.jaar
    && filters.value.prijzen_type
  )
)

const { tables, pending, error, refresh } = useTables(filters)

const selectedTableId = ref<string>()

const selectedTable = computed(() => {
  const list = tables.value
  if (list.length === 0) {
    return null
  }

  const match = list.find(table => table.id === selectedTableId.value)
  return match ?? list[0]
})

const selectorEntries = computed(() => {
  const selectors = selectedTable.value?.selectors
  if (!selectors) {
    return []
  }

  return Object.entries(selectors).map(([field, definition]) => ({
    field,
    label: definition.label ?? field,
    options: definition.options
  }))
})

watch(
  tables,
  (list) => {
    if (list.length === 0) {
      selectedTableId.value = undefined
      return
    }

    if (!list.some(table => table.id === selectedTableId.value)) {
      selectedTableId.value = list[0]?.id ?? '0'
    }

    const table = list[0]
    if (!table?.selectors) {
      return
    }

    if (!selectorsInitialized.value) {
      const defaults: TableFilters = {}
      for (const [field, definition] of Object.entries(table.selectors)) {
        const key = field as keyof TableFilters
        const entries = Object.entries(definition.options)
        if (entries.length === 0) {
          continue
        }

        if (field === 'prijzen_type') {
          const match = entries.find(([label, value]) => {
            const haystack = `${label} ${value}`.toLowerCase()
            return haystack.includes('lopende')
          })
          if (match?.[1]) {
            defaults[key] = match[1]
            continue
          }
        }

        const firstValue = entries[0]?.[1]
        if (firstValue) {
          defaults[key] = firstValue
        }
      }
      selectorValues.value = defaults
      selectorsInitialized.value = true
      return
    }

    const next = { ...selectorValues.value }
    let changed = false
    for (const [field, definition] of Object.entries(table.selectors)) {
      const key = field as keyof TableFilters
      const current = next[key]
      const entries = Object.entries(definition.options)
      const validValues = entries.map(([, value]) => value)
      if (validValues.length === 0) {
        continue
      }

      const preferredValue = (() => {
        if (field !== 'prijzen_type') {
          return validValues[0]
        }

        const match = entries.find(([label, value]) => {
          const haystack = `${label} ${value}`.toLowerCase()
          return haystack.includes('lopende')
        })

        return match?.[1] ?? validValues[0]
      })()

      // If current is empty or no longer valid, move to preferred default.
      if (!current || !validValues.includes(current)) {
        next[key] = preferredValue
        changed = true
      }
    }
    if (changed) {
      selectorValues.value = next
    }
  },
  { immediate: true }
)

function buildSelectorItems(options: SelectorOptions, field?: string) {
  const items = Object.entries(options).map(([label, value]) => ({ label, value }))

  if (field === 'gemeente') {
    return items.sort((a, b) => a.label.localeCompare(b.label, 'nl'))
  }

  return items
}

function buildColumns(
  rows: Record<string, unknown>[],
  selectorFields: Set<string>
): TableColumn<Record<string, unknown>>[] {
  if (rows.length === 0) {
    return []
  }

  const keys = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!selectorFields.has(key)) {
        keys.add(key)
      }
    }
  }

  return [...keys].map(key => ({
    accessorKey: key,
    header: () => {
      const isActive = sortState.value?.key === key
      const direction = isActive ? sortState.value?.direction : undefined
      return h(
        'button',
        {
          type: 'button',
          class: 'inline-flex items-center gap-1 font-medium hover:underline',
          onClick: () => { sortState.value = nextSortState(sortState.value, key) }
        },
        [key, direction ? ` ${formatSortDirection(direction)}` : '']
      )
    },
    cell: ({ row }) => formatCellValue(row.getValue(key))
  }))
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.round(value))
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed !== '' && Number.isFinite(Number(trimmed))) {
      return String(Math.round(Number(trimmed)))
    }
  }

  return String(value)
}

const selectorFieldNames = computed(
  () => new Set(Object.keys(selectedTable.value?.selectors ?? {}))
)

type SortDirection = 'asc' | 'desc'
type SortState = { key: string, direction: SortDirection } | null

const sortState = ref<SortState>(null)

function nextSortState(current: SortState, key: string): SortState {
  if (!current || current.key !== key) {
    return { key, direction: 'asc' }
  }
  if (current.direction === 'asc') {
    return { key, direction: 'desc' }
  }
  return null
}

function formatSortDirection(direction?: SortDirection) {
  if (direction === 'asc') {
    return '↑'
  }
  if (direction === 'desc') {
    return '↓'
  }
  return ''
}

const DEFAULT_VOLUMEN_ORDER = [
  'bedrijven',
  'bewoonde oorden 1930',
  'historische woningen in bewoonde oorden 1930',
  'bijstandsontvangers',
  'doelgroepenregister gemeentelijke doelgroep',
  'éénpersoonshuishoudens',
  'extra groei jongeren',
  'extra groei leerlingen voortgezet onderwijs',
  'grote woonkernen',
  'huishoudens met een laag inkomen met drempel',
  'inwoners',
  'inwoners 75+ met drempel',
  'inwoners waddengemeenten (<2500 inwoners)',
  'inwoners waddengemeenten (>7500 inwoners)',
  'inwoners waddengemeenten (2500 tot 7500 inwoners)',
  'jongeren',
  'kernen',
  'laag opleidingsniveau met drempel',
  'leerlingen (voortgezet) speciaal onderwijs',
  'leerlingen voortgezet onderwijs',
  'loonkostensubsidie',
  'migratieachtergrond',
  'landelijke centrumfunctie',
  'lokale centrumfunctie',
  'regionale centrumfunctie',
  '(oeverlengte+2*veen/kleiveengebied)*bf.gemeente*dh.factor',
  'oeverlengte*bodemfactor gemeente',
  'omgevingsadressendichtheid',
  'onderwijsachterstand',
  'oppervlak bebouwing buitengebied',
  'oppervlak bebouwing buitengebied * bodemfactor buitengebied',
  'oppervlak bebouwing woonkern',
  'oppervlak bebouwing woonkern * bodemfactor woonkern',
  'oppervlak binnenwater',
  'oppervlak buitenwater',
  'oppervlak historische kern < 40 ha',
  'oppervlak historische kern > 65 ha',
  'oppervlak historische kern 40 tot 65 ha',
  'oppervlak land * bodemfactor gemeente',
  'oppervlak land',
  'ozb niet-woningen eigenaren',
  'ozb niet-woningen gebruikers',
  'ozb woningen eigenaren',
  'vast bedrag',
  'vast bedrag Amsterdam',
  'verkiezingen Den Haag',
  'vast bedrag Rotterdam',
  'woonruimten',
  'woonruimten * bodemfactor woonkern'
] as const

function normalizeVolumenLabel(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .replaceAll('∗', '*')
    .replace(/\s+/g, ' ')
    .trim()
}

const DEFAULT_VOLUMEN_RANK = new Map(
  DEFAULT_VOLUMEN_ORDER.map((label, index) => [normalizeVolumenLabel(label), index])
)

function compareMaybeNumber(a: unknown, b: unknown, direction: SortDirection): number {
  const aNum = typeof a === 'number'
    ? a
    : (typeof a === 'string' && a.trim() !== '' ? Number(a) : Number.NaN)
  const bNum = typeof b === 'number'
    ? b
    : (typeof b === 'string' && b.trim() !== '' ? Number(b) : Number.NaN)

  const aHas = Number.isFinite(aNum)
  const bHas = Number.isFinite(bNum)

  if (aHas && bHas) {
    return direction === 'asc' ? aNum - bNum : bNum - aNum
  }

  const aStr = a === null || a === undefined ? '' : String(a)
  const bStr = b === null || b === undefined ? '' : String(b)
  const cmp = aStr.localeCompare(bStr, 'nl')
  return direction === 'asc' ? cmp : -cmp
}

function stableSort<T>(items: T[], compare: (a: T, b: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const result = compare(a.item, b.item)
      return result !== 0 ? result : a.index - b.index
    })
    .map(({ item }) => item)
}

const displayedRows = computed(() => {
  const table = selectedTable.value
  const rows = (table?.rows ?? []) as Record<string, unknown>[]

  if (!table || rows.length === 0) {
    return rows
  }

  const sort = sortState.value
  if (sort) {
    return stableSort(rows, (a, b) => compareMaybeNumber(a[sort.key], b[sort.key], sort.direction))
  }

  if (table.id === 'rekenmodel') {
    return stableSort(rows, (a, b) => {
      const aRank = DEFAULT_VOLUMEN_RANK.get(normalizeVolumenLabel(a.volumen))
      const bRank = DEFAULT_VOLUMEN_RANK.get(normalizeVolumenLabel(b.volumen))

      const aHas = typeof aRank === 'number'
      const bHas = typeof bRank === 'number'

      if (aHas && bHas) {
        return aRank - bRank
      }
      if (aHas) {
        return -1
      }
      if (bHas) {
        return 1
      }

      const aLabel = normalizeVolumenLabel(a.volumen)
      const bLabel = normalizeVolumenLabel(b.volumen)
      return aLabel.localeCompare(bLabel, 'nl')
    })
  }

  return rows
})

const columns = computed(() =>
  buildColumns(displayedRows.value ?? [], selectorFieldNames.value)
)

const tableOptions = computed(() =>
  tables.value.map((table, index) => ({
    label: table.name ?? table.id ?? `Table ${index + 1}`,
    value: table.id ?? String(index)
  }))
)

useSeoMeta({
  title: 'Tables',
  description: 'Browse tabular data from the Lemon API.'
})
</script>

<template>
  <UPage>
    <UPageHeader
      title="Tables"
      description="Data loaded from the Lemon API."
    >
      <template #links>
        <UButton
          icon="i-lucide-refresh-cw"
          label="Refresh"
          color="neutral"
          variant="outline"
          :loading="pending"
          @click="refresh()"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="mx-auto w-full max-w-6xl">
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        title="Failed to load tables"
        :description="error.message"
        class="mb-6"
      />

      <div
        v-if="pending && tables.length === 0"
        class="flex items-center justify-center py-16 text-muted"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-6 animate-spin"
        />
      </div>

      <UEmpty
        v-else-if="!pending && tables.length === 0"
        icon="i-lucide-table"
        title="No tables yet"
        description="The API has not returned any table data."
      />

      <div
        v-else-if="selectedTable"
        class="space-y-4"
      >
        <USelect
          v-if="tableOptions.length > 1"
          v-model="selectedTableId"
          :items="tableOptions"
          value-key="value"
          label-key="label"
          class="max-w-xs"
        />

        <div
          v-if="selectorEntries.length > 0"
          class="flex flex-wrap gap-4"
        >
          <UFormField
            v-for="selector in selectorEntries"
            :key="selector.field"
            :label="selector.label"
            :class="selector.field === 'gemeente' || selector.field === 'prijzen_type'
              ? 'min-w-72 max-w-lg flex-1'
              : 'min-w-48 max-w-xs flex-1'"
          >
            <USelect
              v-model="selectorValues[selector.field as keyof TableFilters]"
              :items="buildSelectorItems(selector.options, selector.field)"
              value-key="value"
              label-key="label"
              :class="selector.field === 'gemeente' || selector.field === 'prijzen_type' ? 'w-full min-w-72' : undefined"
              :ui="selector.field === 'gemeente' || selector.field === 'prijzen_type' ? { content: 'min-w-fit' } : undefined"
            />
          </UFormField>
        </div>

        <UEmpty
          v-if="!pending && !filtersComplete"
          icon="i-lucide-filter"
          title="Select filters"
          description="Choose a gemeente, circulaire, jaar, and prijzen type to load the table."
        />

        <UEmpty
          v-else-if="!pending && filtersComplete && (selectedTable.rows?.length ?? 0) === 0"
          icon="i-lucide-table"
          title="No rows"
          description="No au per maatstaf data found for the selected filters."
        />

        <div
          v-else
          class="overflow-x-auto"
        >
          <UTable
            :data="displayedRows"
            :columns="columns"
            :loading="pending"
            sticky
            class="max-h-[70vh]"
          />
        </div>
      </div>
      </div>
    </UPageBody>
  </UPage>
</template>
