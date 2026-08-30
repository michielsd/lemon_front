const STORAGE_KEY = 'lemon-chat-owner-key'

export function useOwnerKey() {
  const ownerKey = useState<string>('chat-owner-key', () => '')

  function ensureOwnerKey() {
    if (ownerKey.value) {
      return ownerKey.value
    }
    if (!import.meta.client) {
      return ''
    }
    let stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      stored = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, stored)
    }
    ownerKey.value = stored
    return stored
  }

  function ownerHeaders(): Record<string, string> {
    const key = ensureOwnerKey()
    return key ? { 'X-Chat-Owner-Key': key } : {}
  }

  return {
    ownerKey,
    ensureOwnerKey,
    ownerHeaders
  }
}
