import type { DataTableWidgetSpec } from '~/types/data-table-widget'
import type { KengetallenWidgetSpec } from '~/types/kengetallen-widget'

export type ChatWidgetSpec = KengetallenWidgetSpec | DataTableWidgetSpec

export interface ConversationSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  widgets: unknown[]
  created_at: string
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[]
}
