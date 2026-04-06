const SYSTEM_PROMPT =
  'You are a warm, encouraging physics tutor helping an engineering student who is a visual learner with ADHD. Keep explanations short (3-5 sentences max unless asked for more). Always suggest a relevant visualization when explaining a concept. Reference the student\'s current topic context when answering. Use plain language first, equations second. When you mention a visualization, format it exactly like: **[Visualize It: topic-id]** where topic-id is one of: electric-charge, electric-field, electric-flux, gauss-law, electric-potential, potential-energy, capacitors, current-resistance, dc-circuits, magnetic-fields, magnetic-force, biot-savart, amperes-law, faradays-law, inductance, rlc-circuits, em-waves'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured', notConfigured: true }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  const { messages, currentTopic, checkOnly } = body

  // If this is just a configuration check, return success
  if (checkOnly) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true }),
    }
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'messages array is required' }),
    }
  }

  const contextNote = currentTopic ? `\n[Student's current topic: ${currentTopic}]` : ''

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + contextNote,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return {
        statusCode: response.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: `Anthropic API error: ${response.status} ${errText}` }),
      }
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text ?? ''

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reply }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    }
  }
}
