export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

export interface ChatRequest {
  message: string
}

interface StreamEvent {
  type: 'token' | 'done' | 'error'
  content?: string
  message?: string
  row_count?: number
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function parseSseEvents(buffer: string): { events: StreamEvent[], remainder: string } {
  const events: StreamEvent[] = []
  const parts = buffer.split('\n\n')
  const remainder = parts.pop() ?? ''

  for (const part of parts) {
    const line = part.trim()
    if (!line.startsWith('data: ')) {
      continue
    }
    try {
      events.push(JSON.parse(line.slice(6)) as StreamEvent)
    } catch {
      // Ignore malformed chunks until the next event boundary.
    }
  }

  return { events, remainder }
}

export function useChatStream() {
  const config = useRuntimeConfig()
  const messages = ref<ChatMessage[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  let abortController: AbortController | null = null

  async function sendMessage(request: ChatRequest) {
    if (isStreaming.value || !request.message.trim()) {
      return
    }

    error.value = null
    isStreaming.value = true
    abortController = new AbortController()

    messages.value.push({
      id: createMessageId(),
      role: 'user',
      content: request.message.trim()
    })

    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: ''
    }
    messages.value.push(assistantMessage)

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

      if (!response.body) {
        throw new Error('Streaming is not supported in this browser')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const parsed = parseSseEvents(buffer)
        buffer = parsed.remainder

        for (const event of parsed.events) {
          if (event.type === 'token' && event.content) {
            assistantMessage.content += event.content
          } else if (event.type === 'error') {
            throw new Error(event.message ?? 'Stream failed')
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      const message = err instanceof Error ? err.message : 'Something went wrong'
      error.value = message
      if (!assistantMessage.content) {
        assistantMessage.content = message
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

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages
  }
}
