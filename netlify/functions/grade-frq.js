// Grade a handwritten FRQ submission using Claude's vision API
export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: 'AI grading not configured', notConfigured: true })
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { imageDataUrl, questionText, rubricPrompt } = body

  if (!imageDataUrl || !questionText) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing imageDataUrl or questionText' }) }
  }

  // Parse data URL: "data:image/jpeg;base64,..."
  const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid image data URL' }) }
  }
  const [, mediaType, base64Data] = matches

  const systemPrompt = `You are a physics grading assistant. When shown an image of a student's handwritten physics work, you:
1. Transcribe what is written (LaTeX for math if possible)
2. Identify the final answer
3. Grade according to the provided rubric
4. Return ONLY valid JSON as specified.
Be honest about uncertainty. If handwriting is unclear, reflect that in confidence scores.`

  const userPrompt = rubricPrompt || `Grade this student's work for the following question:

QUESTION: ${questionText}

Return JSON with:
{
  "transcription": "full transcription of student work",
  "parsedFinalAnswer": "the final answer given",
  "confidence": 0.85,
  "correctness": "correct|partially_correct|incorrect|unclear_handwriting",
  "rubricScores": [],
  "totalScore": 0,
  "maxScore": 0,
  "feedback": "educational feedback",
  "missingSteps": [],
  "unclearRegions": []
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              }
            },
            {
              type: 'text',
              text: userPrompt,
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: `Anthropic API error: ${response.status} ${errText}` })
      }
    }

    const data = await response.json()
    const content = data.content?.[0]?.text ?? ''

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: 'Could not parse grading response', rawContent: content })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ gradingJson: jsonMatch[0] })
    }
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: (err instanceof Error ? err.message : String(err)) || 'Grading failed' })
    }
  }
}
