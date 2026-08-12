<script setup lang="ts">
import { isTextUIPart } from 'ai'

definePageMeta({
  layout: 'chat'
})

const input = ref('')

const {
  uiMessages,
  status,
  chatError,
  isStreaming,
  widgetsForMessage,
  sendMessage,
  stopStreaming,
  clearMessages,
  regenerateLastResponse
} = useChatStream()

const hasMessages = computed(() => uiMessages.value.length > 0)

const greeting = computed(() => {
  const hour = new Date().getHours()
  let timeGreeting = 'Good evening'
  if (hour < 12) {
    timeGreeting = 'Good morning'
  } else if (hour < 18) {
    timeGreeting = 'Good afternoon'
  }
  return timeGreeting
})

const quickChats = [
  {
    label: 'What is the structurele exploitatieruimte for Amsterdam in 2025?',
    icon: 'i-lucide-building-2'
  },
  {
    label: 'Which kengetallen are available for Utrecht?',
    icon: 'i-lucide-list'
  },
  {
    label: 'Compare budget figures for Rotterdam and Den Haag',
    icon: 'i-lucide-git-compare'
  },
  {
    label: 'Explain the difference between begroting and jaar',
    icon: 'i-lucide-help-circle'
  },
  {
    label: 'Show rekenmodel totals for Eindhoven',
    icon: 'i-lucide-calculator'
  },
  {
    label: 'What data sources can you query?',
    icon: 'i-lucide-database'
  }
]

async function submitPrompt(prompt?: string) {
  const message = (prompt ?? input.value).trim()
  if (!message || isStreaming.value) {
    return
  }

  input.value = ''
  await sendMessage({ message })
}

function onSubmit() {
  submitPrompt()
}

function startNewChat() {
  stopStreaming()
  clearMessages()
  input.value = ''
}

defineShortcuts({
  meta_o: startNewChat
})

useSeoMeta({
  title: 'Chat',
  description: 'Ask questions about municipal kengetallen data.'
})
</script>

<template>
  <UDashboardPanel
    id="chat"
    class="relative min-h-0 flex flex-col"
    :ui="{ body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0 overscroll-none' }"
  >
    <template #header>
      <ChatNavbar @new-chat="startNewChat">
        <template
          v-if="hasMessages"
          #title
        >
          <h1 class="truncate text-sm font-medium text-highlighted">
            Kengetallen chat
          </h1>
        </template>
      </ChatNavbar>
    </template>

    <template #body>
      <UContainer
        v-if="!hasMessages"
        class="flex flex-1 flex-col justify-center gap-4 py-8 sm:gap-6"
      >
        <h1 class="text-3xl font-bold text-highlighted sm:text-4xl">
          {{ greeting }}
        </h1>

        <p class="max-w-2xl text-muted">
          Ask questions about Dutch municipal budget data, kengetallen, and rekenmodel figures.
        </p>

        <UChatPrompt
          v-model="input"
          :status="status"
          :error="chatError"
          color="neutral"
          variant="subtle"
          placeholder="Ask a question about kengetallen..."
          class="[view-transition-name:chat-prompt]"
          :ui="{ base: 'px-1.5' }"
          @submit="onSubmit"
        >
          <template #footer>
            <UChatPromptSubmit
              :status="status"
              color="neutral"
              size="sm"
              @stop="stopStreaming()"
              @reload="regenerateLastResponse()"
            />
          </template>
        </UChatPrompt>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="quickChat in quickChats"
            :key="quickChat.label"
            :icon="quickChat.icon"
            :label="quickChat.label"
            size="sm"
            color="neutral"
            variant="outline"
            class="rounded-full"
            @click="submitPrompt(quickChat.label)"
          />
        </div>
      </UContainer>

      <UContainer
        v-else
        class="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6"
      >
        <UChatMessages
          should-auto-scroll
          :messages="uiMessages"
          :status="status"
          :spacing-offset="200"
          class="min-h-0 flex-1 overflow-y-auto pt-(--ui-header-height) pb-4 sm:pb-6"
        >
          <template #indicator>
            <div class="flex items-center gap-1.5">
              <ChatIndicator />

              <UChatShimmer
                text="Thinking..."
                class="text-sm"
              />
            </div>
          </template>

          <template #content="{ message }">
            <div class="space-y-4">
              <Suspense
                v-for="(widget, widgetIndex) in widgetsForMessage(message.id)"
                :key="`${message.id}-widget-${widgetIndex}`"
              >
                <LazyChatKengetallenWidget :initial-spec="widget" />
                <template #fallback>
                  <KengetallenWidgetSkeleton
                    :kengetal="widget.kengetal"
                    :gemeente-naam="widget.gemeente_naam"
                  />
                </template>
              </Suspense>

              <template
                v-for="(part, index) in message.parts"
                :key="`${message.id}-${part.type}-${index}`"
              >
                <p
                  v-if="isTextUIPart(part) && part.text"
                  class="whitespace-pre-wrap"
                >
                  {{ part.text }}
                </p>
              </template>
            </div>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          :status="status"
          :error="chatError"
          color="neutral"
          variant="subtle"
          placeholder="Ask a follow-up question..."
          class="sticky bottom-0 z-10 [view-transition-name:chat-prompt] rounded-b-none"
          :ui="{ base: 'px-1.5' }"
          @submit="onSubmit"
        >
          <template #footer>
            <UChatPromptSubmit
              :status="status"
              color="neutral"
              size="sm"
              @stop="stopStreaming()"
              @reload="regenerateLastResponse()"
            />
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
