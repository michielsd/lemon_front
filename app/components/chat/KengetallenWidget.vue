<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { KengetallenRow, KengetallenWidgetSpec } from '~/types/kengetallen-widget'
import {
  defaultSelectedBegrotingen,
  filterRowsForTable,
  filterVisibleSeries,
  formatWaarde,
  listSelectableBegrotingen
} from '~/utils/kengetallenChart'

const props = defineProps<{
  initialSpec: KengetallenWidgetSpec
}>()

const { spec, pending, error, loadChart } = useKengetallenChart(props.initialSpec)

const flipped = ref(false)
const selectedBegrotingen = ref<string[]>([])
const selectionKengetal = ref<string | null>(null)

const kengetalItems = computed(() =>
  spec.value.options.kengetallen.map(value => ({ label: value, value }))
)

const availableBegrotingen = computed(() =>
  listSelectableBegrotingen(spec.value.series, spec.value.options.begrotingen)
)

const begrotingItems = computed(() =>
  availableBegrotingen.value.map(value => ({ label: value, value }))
)

watch(
  () => [spec.value.kengetal, availableBegrotingen.value] as const,
  ([kengetal, available]) => {
    const allowed = new Set(available)
    const kept = selectedBegrotingen.value.filter(value => allowed.has(value))
    if (selectionKengetal.value !== kengetal) {
      selectedBegrotingen.value = kept.length > 0
        ? kept
        : defaultSelectedBegrotingen(available)
      selectionKengetal.value = kengetal
      return
    }
    selectedBegrotingen.value = kept
  },
  { immediate: true }
)

const visibleSeries = computed(() =>
  filterVisibleSeries(spec.value.series, selectedBegrotingen.value)
)

const visibleRows = computed(() =>
  filterRowsForTable(spec.value.rows, selectedBegrotingen.value)
)

const tableColumns = computed<TableColumn<KengetallenRow>[]>(() => [
  { accessorKey: 'begroting', header: 'Begroting' },
  { accessorKey: 'jaar', header: 'Jaar' },
  { accessorKey: 'type_raming', header: 'Type raming' },
  {
    accessorKey: 'waarde',
    header: 'Waarde',
    cell: ({ row }) => formatWaarde(row.getValue('waarde') as string | null)
  }
])

async function onKengetalChange(value: string | undefined) {
  if (!value || value === spec.value.kengetal) {
    return
  }
  await loadChart(value)
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-default bg-elevated/40">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-default px-4 py-3">
      <div>
        <p class="font-medium text-highlighted">
          {{ spec.kengetal }}
        </p>
        <p class="text-sm text-muted">
          {{ spec.gemeente_naam }}
        </p>
      </div>

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :icon="flipped ? 'i-lucide-bar-chart-3' : 'i-lucide-table'"
        :label="flipped ? 'Toon grafiek' : 'Toon tabel'"
        @click="flipped = !flipped"
      />
    </div>

    <div class="space-y-4 px-4 py-4">
      <div class="flex flex-wrap items-end gap-3">
        <UFormField
          label="Kengetal"
          class="min-w-64 flex-1"
        >
          <USelect
            :model-value="spec.kengetal"
            :items="kengetalItems"
            :loading="pending"
            class="w-full"
            @update:model-value="onKengetalChange"
          />
        </UFormField>

        <UFormField
          label="Begrotingen"
          class="min-w-64 flex-1"
        >
          <USelect
            v-model="selectedBegrotingen"
            multiple
            :items="begrotingItems"
            :loading="pending"
            placeholder="Selecteer begrotingen"
            class="w-full"
          />
        </UFormField>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        :title="error"
      />

      <div
        class="flip-panel"
        :class="{ 'is-flipped': flipped }"
      >
        <div class="flip-panel-front">
          <ChatKengetallenChart
            v-if="visibleSeries.length > 0"
            :series="visibleSeries"
          />
          <p
            v-else
            class="py-8 text-center text-sm text-muted"
          >
            Selecteer minimaal één begroting om data te tonen.
          </p>
        </div>

        <div class="flip-panel-back">
          <UTable
            v-if="visibleRows.length > 0"
            :data="visibleRows"
            :columns="tableColumns"
            class="max-h-80 overflow-auto"
          />
          <p
            v-else
            class="py-8 text-center text-sm text-muted"
          >
            Selecteer minimaal één begroting om data te tonen.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flip-panel {
  display: grid;
  perspective: 1200px;
}

.flip-panel-front,
.flip-panel-back {
  grid-area: 1 / 1;
  backface-visibility: hidden;
  transition: transform 0.45s ease;
}

.flip-panel-back {
  transform: rotateY(180deg);
}

.flip-panel.is-flipped .flip-panel-front {
  transform: rotateY(-180deg);
}

.flip-panel.is-flipped .flip-panel-back {
  transform: rotateY(0deg);
}
</style>
