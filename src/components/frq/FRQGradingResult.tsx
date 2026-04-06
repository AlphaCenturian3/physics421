import React from 'react'
import { MathText } from '../math/MathRenderer'

export interface RubricScore {
  category: string
  points: number
  maxPoints: number
  feedback: string
}

export interface GradingResult {
  transcription: string
  parsedFinalAnswer: string
  confidence: number  // 0-1
  correctness: 'correct' | 'correct_equivalent_form' | 'partially_correct' | 'incorrect' | 'unclear_handwriting' | 'correct_setup_arithmetic_error' | 'correct_magnitude_wrong_direction' | 'incorrect_units'
  rubricScores: RubricScore[]
  totalScore: number
  maxScore: number
  feedback: string
  missingSteps: string[]
  detectedEquivalentForm?: string
  unclearRegions?: string[]
}

interface FRQGradingResultProps {
  result: GradingResult
  showDebug?: boolean
}

const CORRECTNESS_STYLE: Record<GradingResult['correctness'], { color: string; bg: string; label: string }> = {
  correct:                       { color: '#4fde98', bg: 'rgba(79,222,152,0.1)', label: '✓ Correct' },
  correct_equivalent_form:       { color: '#4fde98', bg: 'rgba(79,222,152,0.1)', label: '✓ Correct (equivalent form)' },
  partially_correct:             { color: '#f7a94f', bg: 'rgba(247,169,79,0.1)', label: '◐ Partially Correct' },
  correct_setup_arithmetic_error:{ color: '#f7a94f', bg: 'rgba(247,169,79,0.1)', label: '◐ Correct setup, arithmetic error' },
  correct_magnitude_wrong_direction: { color: '#f7a94f', bg: 'rgba(247,169,79,0.1)', label: '◐ Correct magnitude, wrong direction' },
  incorrect_units:               { color: '#f7a94f', bg: 'rgba(247,169,79,0.1)', label: '⚠ Correct answer, missing/wrong units' },
  unclear_handwriting:           { color: '#8888aa', bg: 'rgba(136,136,170,0.1)', label: '? Unclear — could not grade' },
  incorrect:                     { color: '#f77f7f', bg: 'rgba(247,127,127,0.1)', label: '✗ Incorrect' },
}

export function FRQGradingResult({ result, showDebug = false }: FRQGradingResultProps) {
  const style = CORRECTNESS_STYLE[result.correctness]
  const pct = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Score header */}
      <div style={{ background: style.bg, border: `1px solid ${style.color}40`, borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ color: style.color, fontWeight: 700, fontSize: '1rem', marginBottom: '0.125rem' }}>{style.label}</p>
          {result.parsedFinalAnswer && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              We read your answer as: <strong style={{ color: 'var(--text-primary)' }}><MathText>{result.parsedFinalAnswer}</MathText></strong>
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: style.color }}>{result.totalScore}</span>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/{result.maxScore}</span>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{pct}%</p>
        </div>
      </div>

      {/* Confidence warning */}
      {result.confidence < 0.7 && (
        <div style={{ background: 'rgba(247,169,79,0.08)', border: '1px solid rgba(247,169,79,0.3)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <p style={{ color: '#f7a94f', fontSize: '0.8125rem', fontWeight: 600 }}>Low confidence ({Math.round(result.confidence * 100)}%)</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {result.unclearRegions && result.unclearRegions.length > 0
              ? `Unclear regions: ${result.unclearRegions.join(', ')}`
              : 'Some parts of your submission were difficult to parse.'}
          </p>
        </div>
      )}

      {/* Feedback */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Feedback</p>
        <p style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{result.feedback}</p>
        {result.missingSteps.length > 0 && (
          <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {result.missingSteps.map((s, i) => (
              <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{s}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Rubric breakdown */}
      {result.rubricScores.length > 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Rubric Breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {result.rubricScores.map((rs, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: rs.points === rs.maxPoints ? '#4fde98' : rs.points > 0 ? '#f7a94f' : '#f77f7f', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{rs.category}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{rs.points}/{rs.maxPoints}</span>
                {rs.feedback && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', flexShrink: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rs.feedback}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug view */}
      {showDebug && (
        <details style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>Debug / Teacher View</summary>
          <pre style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
