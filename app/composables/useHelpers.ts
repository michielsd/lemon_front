import type { SelectorDefinition } from '~/types/selectors'

export interface HelperPayload {
  id: string
  name?: string
  selectors?: Record<string, SelectorDefinition>
  result: unknown
}

export interface HelpersResponse {
  helpers: HelperPayload[]
}

export interface HelperFilters {
  helper?: string

  // Shared selectors used by multiple helpers.
  gemeente?: string
  circulaire?: string
  jaar?: string
  prijzen_type?: string

  // Kengetallen-specific selectors.
  kengetal?: string
  type_raming?: string
}

function buildHelpersUrl(base: string, filters: HelperFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value)
    }
  }
  const query = params.toString()
  return query ? `${base}/api/helpers/?${query}` : `${base}/api/helpers/`
}

export function useHelpers(filters: Ref<HelperFilters> | ComputedRef<HelperFilters>) {
  const config = useRuntimeConfig()
  const url = computed(() => buildHelpersUrl(config.public.apiBase, unref(filters)))

  const { data, pending, error, refresh } = useFetch<HelpersResponse>(url, {
    key: () => `helpers:${url.value}`,
    watch: [url]
  })

  const helpers = computed(() => data.value?.helpers ?? [])

  return {
    helpers,
    pending,
    error,
    refresh
  }
}

