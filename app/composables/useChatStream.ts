import type { ChatStatus, UIMessage } from 'ai'
import type { KengetallenWidgetSpec } from '~/types/kengetallen-widget'
import { isKengetallenWidgetSpec, cloneKengetallenWidgetSpec } from '~/utils/kengetallenChart'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  widgets: KengetallenWidgetSpec[]
}

export interface ChatRequest {
  message: string
}

interface StreamEvent {
  type: 'status' | 'token' | 'widget' | 'done' | 'error'
  content?: string
  message?: string
  row_count?: number
  tools_used?: string[]
  has_widget?: boolean
  widget?: KengetallenWidgetSpec
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function toUIMessage(message: ChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: 'text', text: message.content }]
  }
}

function parseSseLine(line: string): StreamEvent | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data: ')) {
    return null
  }
  try {
    return JSON.parse(trimmed.slice(6)) as StreamEvent
  } catch {
    return null
  }
}

function parseSseEvents(buffer: string, flush = false): { events: StreamEvent[], remainder: string } {
  const events: StreamEvent[] = []
  const parts = buffer.split('\n\n')
  let remainder = parts.pop() ?? ''

  for (const part of parts) {
    const event = parseSseLine(part)
    if (event) {
      events.push(event)
    }
  }

  if (flush && remainder.trim()) {
    const event = parseSseLine(remainder)
    if (event) {
      events.push(event)
    }
    remainder = ''
  }

  return { events, remainder }
}

function ensureAssistantMessage(messages: ChatMessage[]): number {
  const last = messages.at(-1)
  if (last?.role === 'assistant') {
    return messages.length - 1
  }

  messages.push({
    id: createMessageId(),
    role: 'assistant',
    content: '',
    widgets: []
  })
  return messages.length - 1
}

function cloneMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(message => ({
    ...message,
    widgets: [...message.widgets]
  }))
}

function applyStreamEvents(
  messages: ChatMessage[],
  events: StreamEvent[],
  assistantIndexRef: { value: number }
) {
  // Apply tokens before widgets so text can render while the chart bundle loads.
  const ordered = [
    ...events.filter(event => event.type === 'token'),
    ...events.filter(event => event.type !== 'token')
  ]

  for (const event of ordered) {
    if (event.type === 'status' || event.type === 'done') {
      continue
    }

    if (event.type === 'token' && event.content) {
      assistantIndexRef.value = ensureAssistantMessage(messages)
      const assistant = messages[assistantIndexRef.value]
      if (assistant) {
        assistant.content += event.content
      }
      continue
    }

    if (event.type === 'widget' && event.widget && isKengetallenWidgetSpec(event.widget)) {
      assistantIndexRef.value = ensureAssistantMessage(messages)
      const assistant = messages[assistantIndexRef.value]
      if (assistant) {
        assistant.widgets = [...assistant.widgets, cloneKengetallenWidgetSpec(event.widget)]
      }
      continue
    }

    if (event.type === 'error') {
      throw new Error(event.message ?? 'Stream failed')
    }
  }
}

async function consumeSseResponse(
  response: Response,
  onEvents: (events: StreamEvent[]) => void
) {
  if (!response.body) {
    onEvents(parseSseEvents(await response.text(), true).events)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (value) {
      buffer += decoder.decode(value, { stream: !done })
    }

    const parsed = parseSseEvents(buffer, done)
    buffer = parsed.remainder

    if (parsed.events.length > 0) {
      onEvents(parsed.events)
    }

    if (done) {
      break
    }
  }
}

export function useChatStream() {
  const config = useRuntimeConfig()
  const messages = useState<ChatMessage[]>('chat-stream-messages', () => [])
  const isStreaming = useState('chat-stream-is-streaming', () => false)
  const error = useState<string | null>('chat-stream-error', () => null)

  let abortController: AbortController | null = null

  const uiMessages = computed(() => messages.value.map(toUIMessage))

  const widgetsByMessageId = computed(() => {
    const map = new Map<string, KengetallenWidgetSpec[]>()
    for (const message of messages.value) {
      map.set(message.id, message.widgets)
    }
    return map
  })

  const status = computed<ChatStatus>(() => {
    if (error.value) {
      return 'error'
    }
    if (isStreaming.value) {
      const lastAssistant = [...messages.value].reverse().find(message => message.role === 'assistant')
      if (!lastAssistant || (!lastAssistant.content && lastAssistant.widgets.length === 0)) {
        return 'submitted'
      }
      return 'streaming'
    }
    return 'ready'
  })

  const chatError = computed(() => (error.value ? new Error(error.value) : undefined))

  function widgetsForMessage(messageId: string) {
    return widgetsByMessageId.value.get(messageId) ?? []
  }

  function commitStreamEvents(events: StreamEvent[], assistantIndexRef: { value: number }) {
    if (events.length === 0) {
      return
    }
    const nextMessages = cloneMessages(messages.value)
    applyStreamEvents(nextMessages, events, assistantIndexRef)
    messages.value = nextMessages
  }

  async function sendMessage(request: ChatRequest) {
    if (isStreaming.value || !request.message.trim()) {
      return
    }

    error.value = null
    isStreaming.value = true
    abortController = new AbortController()

    messages.value = [
      ...messages.value,
      {
        id: createMessageId(),
        role: 'user',
        content: request.message.trim(),
        widgets: []
      }
    ]

    const assistantIndexRef = { value: -1 }

    try {
      const response = await fetch(`${config.public.apiBase}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: abortController.signal
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? `Request failed (${response.status})`)
      }

      await consumeSseResponse(response, events => {
        commitStreamEvents(events, assistantIndexRef)
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      const message = err instanceof Error ? err.message : 'Something went wrong'
      error.value = message
      if (assistantIndexRef.value === -1) {
        messages.value = [
          ...messages.value,
          {
            id: createMessageId(),
            role: 'assistant',
            content: message,
            widgets: []
          }
        ]
      } else {
        const nextMessages = cloneMessages(messages.value)
        const assistant = nextMessages[assistantIndexRef.value]
        if (assistant && !assistant.content) {
          assistant.content = message
        }
        messages.value = nextMessages
      }
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  function stopStreaming() {
    abortController?.abort()
    isStreaming.value = false
  }

  function clearMessages() {
    messages.value = []
    error.value = null
  }

  async function regenerateLastResponse() {
    const lastUserMessage = [...messages.value].reverse().find(message => message.role === 'user')
    if (!lastUserMessage || isStreaming.value) {
      return
    }

    const lastUserIndex = messages.value.findLastIndex(message => message.id === lastUserMessage.id)
    if (lastUserIndex === -1) {
      return
    }

    let nextMessages = messages.value.slice(0, lastUserIndex + 1)
    const trailingAssistant = nextMessages.at(-1)
    if (trailingAssistant?.role === 'assistant') {
      nextMessages = nextMessages.slice(0, -1)
    }
    messages.value = nextMessages

    await sendMessage({ message: lastUserMessage.content })
  }

  return {
    messages,
    uiMessages,
    widgetsByMessageId,
    status,
    chatError,
    isStreaming,
    error,
    widgetsForMessage,
    sendMessage,
    stopStreaming,
    clearMessages,
    regenerateLastResponse
  }
}
