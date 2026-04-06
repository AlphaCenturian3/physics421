// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id))
}

// ─────────────────────────────────────────────────────────────────────────────
// streamMessage — posts to the Netlify serverless function, calls onChunk once
// with the full reply, and returns it.
//
// streamMessage(messages, currentTopic, onChunk): Promise<string>
// ─────────────────────────────────────────────────────────────────────────────

export async function streamMessage(
  messages: ChatMessage[],
  currentTopic: string | null,
  onChunk: (text: string) => void,
): Promise<string> {
  const response = await fetchWithTimeout(
    '/.netlify/functions/tutor',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, currentTopic }),
    },
    20000,
  )

  const data: { reply?: string; error?: string; notConfigured?: boolean } = await response.json()

  if (data.notConfigured) {
    throw new Error('not_configured')
  }

  if (data.error) {
    throw new Error(data.error)
  }

  const reply = data.reply ?? ''
  onChunk(reply)
  return reply
}

// ─────────────────────────────────────────────────────────────────────────────
// sendMessage — canonical and legacy overloads, both route through the
// Netlify function (no Anthropic SDK in the browser).
//
// Canonical:   sendMessage(messages, currentTopic)
// Legacy:      sendMessage(userText, history, currentTopic, topicTitle, onChunk)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendMessage(
  messagesOrText: ChatMessage[] | string,
  currentTopicOrHistory: string | null | ChatMessage[],
  currentTopicLegacy?: string | null,
  currentTopicTitleLegacy?: string | null,
  onChunkLegacy?: (text: string) => void,
): Promise<string> {
  if (typeof messagesOrText === 'string') {
    // ── Legacy signature ──
    const userText = messagesOrText
    const history = (currentTopicOrHistory as ChatMessage[]) ?? []
    const topic = currentTopicLegacy ?? null
    const topicTitle = currentTopicTitleLegacy ?? null
    const onChunk = onChunkLegacy ?? (() => {})

    const contextPrefix = topic
      ? `[Student is currently viewing: ${topicTitle ?? topic}]\n\n`
      : ''

    const apiMessages: ChatMessage[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: contextPrefix + userText },
    ]

    return streamMessage(apiMessages, topic, onChunk)
  }

  // ── Canonical signature ──
  const messages = messagesOrText
  const currentTopic = currentTopicOrHistory as string | null

  return streamMessage(messages, currentTopic, () => {})
}

// ─────────────────────────────────────────────────────────────────────────────
// isTutorConfigured — checks whether the backend has ANTHROPIC_API_KEY set.
// Times out after 5 s so it never blocks the UI.
// ─────────────────────────────────────────────────────────────────────────────

export async function isTutorConfigured(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      '/.netlify/functions/tutor',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          currentTopic: null,
          checkOnly: true,
        }),
      },
      5000,
    )
    const data: { notConfigured?: boolean } = await response.json()
    return !data.notConfigured
  } catch {
    return false
  }
}
