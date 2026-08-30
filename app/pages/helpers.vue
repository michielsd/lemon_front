<script setup lang="ts">
import type { SelectorOptions } from '~/types/selectors'
import type { HelperFilters, HelperPayload } from '~/composables/useHelpers'

const selectorValues = ref<HelperFilters>({})
const selectorsInitialized = ref(false)

const { helpers, pending, error, refresh } = useHelpers(selectorValues)

const selectedHelperId = ref<string>()

const selectedHelper = computed<HelperPayload | null>(() => {
  const list = helpers.value
  if (list.length === 0) {
    return null
  }
  const match = list.find(helper => helper.id === selectedHelperId.value)
  return match ?? list[0] ?? null
})

const selectorEntries = computed(() => {
  const selectors = selectedHelper.value?.selectors
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
  helpers,
  (list) => {
    if (list.length === 0) {
      selectedHelperId.value = undefined
      return
    }

    if (!list.some(helper => helper.id === selectedHelperId.value)) {
      selectedHelperId.value = list[0]?.id ?? '0'
    }

    const helper = list[0]
    if (!helper?.selectors) {
      return
    }

    if (!selectorsInitialized.value) {
      const defaults: HelperFilters = {}
      for (const [field, definition] of Object.entries(helper.selectors)) {
        const entries = Object.entries(definition.options)
        if (entries.length === 0) {
          continue
        }
        const firstValue = entries[0]?.[1]
        if (firstValue) {
          defaults[field as keyof HelperFilters] = firstValue
        }
      }
      selectorValues.value = defaults
      selectorsInitialized.value = true
      return
    }

    // Keep current selections if still valid; otherwise reset to first option.
    const next = { ...selectorValues.value }
    let changed = false
    const selectors = helper.selectors ?? {}
    for (const [field, definition] of Object.entries(selectors)) {
      const key = field as keyof HelperFilters
      const current = next[key]
      const validValues = Object.values(definition.options)
      if (validValues.length === 0) {
        continue
      }
      if (!current || !validValues.includes(current)) {
        next[key] = validValues[0]
        changed = true
      }
    }
    if (changed) {
      selectorValues.value = next
    }
  },
  { immediate: true }
)

const helperOptions = computed(() =>
  helpers.value.map(helper => ({
    label: helper.name ?? helper.id,
    value: helper.id
  }))
)

function buildSelectorItems(options: SelectorOptions, field?: string) {
  const items = Object.entries(options).map(([label, value]) => ({ label, value }))
  if (field === 'gemeente') {
    return items.sort((a, b) => a.label.localeCompare(b.label, 'nl'))
  }
  return items
}

const formattedResult = computed(() => {
  const result = selectedHelper.value?.result
  if (result === undefined) {
    return ''
  }
  try {
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
})

useSeoMeta({
  title: 'Helpers',
  description: 'Explore the output of service helper functions.'
})
</script>

<template>
  <UPage>
    <UPageHeader
      title="Helpers"
      description="Explore results of backend service functions (via /api/helpers/)."
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
      <div class="mx-auto w-full max-w-4xl space-y-6">
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          title="Failed to load helpers"
          :description="error.message"
        />

        <div
          v-if="pending && helpers.length === 0"
          class="flex items-center justify-center py-16 text-muted"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-6 animate-spin"
          />
        </div>

        <UEmpty
          v-else-if="!pending && helpers.length === 0"
          icon="i-lucide-wrench"
          title="No helpers yet"
          description="The API has not returned any helper data."
        />

        <div
          v-else-if="selectedHelper"
          class="space-y-4"
        >
          <USelect
            v-model="selectedHelperId"
            :items="helperOptions"
            value-key="value"
            label-key="label"
            class="max-w-xl"
          />

          <div
            v-if="selectorEntries.length > 0"
            class="flex flex-wrap gap-4"
          >
            <UFormField
              v-for="selector in selectorEntries"
              :key="selector.field"
              :label="selector.label"
              :class="selector.field === 'gemeente' ? 'min-w-72 max-w-lg flex-1' : 'min-w-48 max-w-xs flex-1'"
            >
              <USelect
                v-model="selectorValues[selector.field as keyof HelperFilters]"
                :items="buildSelectorItems(selector.options, selector.field)"
                value-key="value"
                label-key="label"
                :class="selector.field === 'gemeente' ? 'w-full min-w-72' : undefined"
                :ui="selector.field === 'gemeente' ? { content: 'min-w-fit' } : undefined"
              />
            </UFormField>
          </div>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="truncate font-medium">
                    {{ selectedHelper.name ?? selectedHelper.id }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ selectedHelper.id }}
                  </p>
                </div>

                <UPopover :content="{ align: 'end', side: 'bottom' }">
                  <UButton
                    label="Result"
                    color="neutral"
                    variant="outline"
                    trailing-icon="i-lucide-chevron-down"
                  />
                  <template #content>
                    <div class="max-h-[60vh] overflow-auto p-3 min-w-[24rem] max-w-[70vw]">
                      <pre class="text-xs whitespace-pre-wrap">{{ formattedResult }}</pre>
                    </div>
                  </template>
                </UPopover>
              </div>
            </template>

            <div class="text-sm text-muted">
              Use the dropdown above to view the raw JSON result.
            </div>
          </UCard>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>
