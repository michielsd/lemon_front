/** Display label → value stored in the database / used for filtering. */
export type SelectorOptions = Record<string, string>

export interface SelectorDefinition {
  /** Human-readable name for the dropdown (e.g. "Indicator name"). */
  label?: string
  options: SelectorOptions
}
