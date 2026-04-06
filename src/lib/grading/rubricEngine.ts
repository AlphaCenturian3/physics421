import type { GradingResult, RubricScore } from '../../components/frq/FRQGradingResult'

// ─── Normalization utilities ──────────────────────────────────────────────────

export function normalizeMathExpression(expr: string): string {
  return expr
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\^(\d)/g, '^($1)')
}

export function normalizeUnits(units: string): string {
  return units
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('n/c', 'v/m')   // N/C ≡ V/m for electric field
    .replace('newton/coulomb', 'v/m')
    .replace('ω·m', 'ohm*m')
    .replace('v/m', 'v/m')
}

export function compareNumericAnswers(
  studentAnswer: string,
  canonicalAnswer: string,
  tolerancePct = 2.0,
): 'correct' | 'close' | 'incorrect' {
  const parseNum = (s: string) => {
    // Handle scientific notation like 1.5e-3 or 1.5×10⁻³
    const normalized = s
      .replace(/×10\^?\(?([−-]?\d+)\)?/g, 'e$1')
      .replace(/×10([⁻-]?\d+)/g, (_, exp) => 'e' + exp.replace('⁻', '-'))
      .replace('−', '-')
    return parseFloat(normalized)
  }

  const sv = parseNum(studentAnswer)
  const cv = parseNum(canonicalAnswer)

  if (isNaN(sv) || isNaN(cv)) return 'incorrect'
  if (cv === 0) return Math.abs(sv) < 1e-12 ? 'correct' : 'incorrect'

  const pctDiff = Math.abs((sv - cv) / cv) * 100
  if (pctDiff <= tolerancePct) return 'correct'
  if (pctDiff <= 10) return 'close'
  return 'incorrect'
}

export function classifyEquivalence(
  studentAnswer: string,
  canonicalAnswer: string,
  equivalentForms: string[] = [],
): GradingResult['correctness'] {
  const sn = normalizeMathExpression(studentAnswer)
  const cn = normalizeMathExpression(canonicalAnswer)

  if (sn === cn) return 'correct'

  // Check equivalent forms
  for (const form of equivalentForms) {
    if (sn === normalizeMathExpression(form)) return 'correct_equivalent_form'
  }

  // Numeric comparison
  const numResult = compareNumericAnswers(studentAnswer, canonicalAnswer)
  if (numResult === 'correct') return 'correct'
  if (numResult === 'close') return 'partially_correct'

  return 'incorrect'
}

// ─── Rubric evaluation (AI-graded, returns structured result) ─────────────────

export interface FRQRubric {
  categories: Array<{
    name: string
    points: number
    description: string
  }>
  totalPoints: number
  canonicalAnswer: string
  equivalentForms?: string[]
  acceptedUnits?: string[]
  tolerancePct?: number
}

// This function builds the grading prompt for the AI
export function buildGradingPrompt(
  questionText: string,
  rubric: FRQRubric,
  studentTranscription: string,
): string {
  return `You are grading a physics free-response question. Return ONLY valid JSON.

QUESTION: ${questionText}

RUBRIC:
${rubric.categories.map((c, i) => `${i+1}. ${c.name} (${c.points} pts): ${c.description}`).join('\n')}
Total: ${rubric.totalPoints} points

CANONICAL ANSWER: ${rubric.canonicalAnswer}
${rubric.equivalentForms?.length ? `EQUIVALENT FORMS: ${rubric.equivalentForms.join(', ')}` : ''}
${rubric.acceptedUnits?.length ? `ACCEPTED UNITS: ${rubric.acceptedUnits.join(', ')}` : ''}

STUDENT WORK (transcribed): ${studentTranscription}

Return JSON with exactly this structure:
{
  "parsedFinalAnswer": "student's final answer as you understood it",
  "confidence": 0.85,
  "correctness": "correct|correct_equivalent_form|partially_correct|correct_setup_arithmetic_error|correct_magnitude_wrong_direction|incorrect_units|unclear_handwriting|incorrect",
  "rubricScores": [
    { "category": "category name", "points": 2, "maxPoints": 3, "feedback": "specific note" }
  ],
  "totalScore": 7,
  "maxScore": ${rubric.totalPoints},
  "feedback": "2-3 sentence educational feedback",
  "missingSteps": ["step that was missing"],
  "detectedEquivalentForm": "if applicable",
  "unclearRegions": ["any parts that were hard to read"]
}`
}

// Post-process the grading result from AI
export function parseGradingResponse(
  jsonStr: string,
  transcription: string,
): GradingResult {
  try {
    const parsed = JSON.parse(jsonStr)
    return {
      transcription,
      parsedFinalAnswer: parsed.parsedFinalAnswer ?? '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      correctness: parsed.correctness ?? 'unclear_handwriting',
      rubricScores: Array.isArray(parsed.rubricScores) ? parsed.rubricScores : [],
      totalScore: typeof parsed.totalScore === 'number' ? parsed.totalScore : 0,
      maxScore: typeof parsed.maxScore === 'number' ? parsed.maxScore : 0,
      feedback: parsed.feedback ?? 'Could not parse grading result.',
      missingSteps: Array.isArray(parsed.missingSteps) ? parsed.missingSteps : [],
      detectedEquivalentForm: parsed.detectedEquivalentForm,
      unclearRegions: Array.isArray(parsed.unclearRegions) ? parsed.unclearRegions : [],
    }
  } catch {
    return {
      transcription,
      parsedFinalAnswer: '',
      confidence: 0,
      correctness: 'unclear_handwriting',
      rubricScores: [],
      totalScore: 0,
      maxScore: 0,
      feedback: 'Failed to parse grading response. Please try again.',
      missingSteps: [],
      unclearRegions: ['entire response'],
    }
  }
}
