<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { TableFilters } from '~/composables/useTables'
import {
  buildSelectorItems,
  formatCellValue,
  formatSortDirection,
  nextSortState,
  preferredSelectorValue,
  sortTableRows,
  tableColumnKeys,
  type SortState
} from '~/utils/dataTable'

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
        const preferred = preferredSelectorValue(field, definition.options)
        if (preferred) {
          defaults[key] = preferred
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
      const validValues = Object.values(definition.options)
      if (validValues.length === 0) {
        continue
      }

      if (!current || !validValues.includes(current)) {
        next[key] = preferredSelectorValue(field, definition.options)
        changed = true
      }
    }
    if (changed) {
      selectorValues.value = next
    }
  },
  { immediate: true }
)

function buildColumns(
  rows: Record<string, unknown>[],
  selectorFields: Set<string>
): TableColumn<Record<string, unknown>>[] {
  if (rows.length === 0) {
    return []
  }

  return tableColumnKeys(rows, selectorFields).map(key => ({
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

const selectorFieldNames = computed(
  () => new Set(Object.keys(selectedTable.value?.selectors ?? {}))
)

const sortState = ref<SortState>(null)

const displayedRows = computed(() => {
  const table = selectedTable.value
  const rows = (table?.rows ?? []) as Record<string, unknown>[]
  if (!table || rows.length === 0) {
    return rows
  }
  return sortTableRows(table.id, rows, sortState.value)
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
