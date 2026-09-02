<script setup lang="ts">
import { isTextUIPart } from 'ai'

definePageMeta({
  layout: 'chat'
})

const route = useRoute()
const router = useRouter()
const input = ref('')
const loadingConversation = ref(false)

const {
  messages,
  conversationId,
  uiMessages,
  status,
  chatError,
  isStreaming,
  widgetsForMessage,
  hydrateConversation,
  sendMessage,
  stopStreaming,
  clearMessages
} = useChatStream()

const { fetchConversation } = useConversations()

const hasMessages = computed(() => uiMessages.value.length > 0)

const greeting = computed(() => {
  const hour = new Date().getHours()
  let timeGreeting = 'Goedenavond'
  if (hour < 12) {
    timeGreeting = 'Goedemorgen'
  } else if (hour < 18) {
    timeGreeting = 'Goedemiddag'
  }
  return timeGreeting
})

const quickChats = [
  {
    label: 'Wat is de structurele exploitatieruimte van Amsterdam in 2025?',
    icon: 'i-lucide-building-2'
  },
  {
    label: 'Welke kengetallen zijn beschikbaar voor Utrecht?',
    icon: 'i-lucide-list'
  },
  {
    label: 'Vergelijk begrotingscijfers van Rotterdam en Den Haag',
    icon: 'i-lucide-git-compare'
  },
  {
    label: 'Leg het verschil uit tussen begroting en jaar',
    icon: 'i-lucide-help-circle'
  },
  {
    label: 'Toon rekenmodeltotalen voor Eindhoven',
    icon: 'i-lucide-calculator'
  },
  {
    label: 'Welke databronnen kun je raadplegen?',
    icon: 'i-lucide-database'
  }
]

const pageTitle = computed(() => {
  if (!hasMessages.value) {
    return 'Chat'
  }
  return 'Kengetallen chat'
})

watch(
  () => route.params.id,
  async (id) => {
    if (!import.meta.client) {
      return
    }
    const nextId = typeof id === 'string' ? id : ''
    if (!nextId) {
      if (!isStreaming.value) {
        clearMessages()
      }
      return
    }
    if (nextId === conversationId.value && (isStreaming.value || messages.value.length > 0)) {
      return
    }
    if (isStreaming.value) {
      stopStreaming()
    }
    loadingConversation.value = true
    try {
      const detail = await fetchConversation(nextId)
      hydrateConversation(detail)
    } catch {
      clearMessages()
      await router.replace('/chat')
    } finally {
      loadingConversation.value = false
    }
  },
  { immediate: true }
)

watch(conversationId, (id) => {
  const currentId = typeof route.params.id === 'string' ? route.params.id : ''
  if (id && id !== currentId) {
    router.replace(`/chat/${id}`)
  }
})

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
  router.push('/chat')
}

defineShortcuts({
  meta_o: startNewChat
})

useSeoMeta({
  title: 'Chat',
  description: 'Stel vragen over gemeentelijke kengetallen.'
})
</script>

<template>
  <UDashboardPanel
    id="chat"
    class="relative min-h-0 flex flex-col"
    :ui="{ body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0 overscroll-none' }"
  >
    <template #header>
      <ChatNavbar
        :title="pageTitle"
        @new-chat="startNewChat"
      />
    </template>

    <template #body>
      <div
        v-if="loadingConversation"
        class="flex flex-1 items-center justify-center text-sm text-muted"
      >
        Gesprek laden...
      </div>

      <UContainer
        v-else-if="!hasMessages"
        class="flex flex-1 flex-col justify-center gap-4 py-8 sm:gap-6"
      >
        <h1 class="text-3xl font-bold text-highlighted sm:text-4xl">
          {{ greeting }}
        </h1>

        <p class="max-w-2xl text-muted">
          Stel vragen over Nederlandse gemeentelijke begrotingsgegevens, kengetallen en rekenmodelcijfers.
        </p>

        <UChatPrompt
          v-model="input"
          :status="status"
          :error="chatError"
          color="neutral"
          variant="subtle"
          placeholder="Stel een vraag over kengetallen..."
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
                text="Aan het nadenken..."
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
                  <ChatKengetallenWidgetSkeleton
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
          placeholder="Stel een vervolgvraag..."
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
            />
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
