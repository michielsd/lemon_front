<script setup lang="ts">
definePageMeta({
  layout: 'chat'
})

const input = ref('')

const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } = useChatStream()

const messagesContainer = ref<HTMLElement | null>(null)

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(
  () => [messages.value.length, messages.value.at(-1)?.content],
  scrollToBottom
)

async function onSubmit() {
  const message = input.value.trim()
  if (!message || isStreaming.value) {
    return
  }

  input.value = ''
  await sendMessage({ message })
}

useSeoMeta({
  title: 'Chat',
  description: 'Ask questions about municipal kengetallen data.'
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div
      ref="messagesContainer"
      class="min-h-0 flex-1 overflow-y-auto"
    >
      <div class="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <p
          v-if="messages.length === 0"
          class="text-center text-sm text-muted"
        >
          Ask a question to get started.
        </p>

        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap"
            :class="message.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-elevated text-default'"
          >
            {{ message.content }}
            <span
              v-if="message.role === 'assistant' && isStreaming && message === messages.at(-1)"
              class="ml-0.5 inline-block animate-pulse"
            >
              |
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="shrink-0 border-t border-default bg-default/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-default/80"
    >
      <form
        class="mx-auto flex w-full max-w-3xl flex-col gap-3"
        @submit.prevent="onSubmit"
      >
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
        />

        <div class="flex items-end gap-2">
          <UTextarea
            v-model="input"
            :rows="1"
            :maxrows="6"
            autoresize
            placeholder="Ask a question..."
            class="flex-1"
            :disabled="isStreaming"
            @keydown.enter.exact.prevent="onSubmit"
          />
          <div class="flex shrink-0 gap-2">
            <UButton
              type="submit"
              icon="i-lucide-send"
              :loading="isStreaming"
              :disabled="!input.trim()"
              aria-label="Send"
            />
            <UButton
              v-if="isStreaming"
              color="neutral"
              variant="outline"
              icon="i-lucide-square"
              aria-label="Stop"
              @click="stopStreaming"
            />
            <UButton
              v-else
              color="neutral"
              variant="ghost"
              icon="i-lucide-trash-2"
              :disabled="messages.length === 0"
              aria-label="Clear chat"
              @click="clearMessages"
            />
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
