import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { VisualizationMeta } from '../services/visualizationMapper'

interface Props {
  viz: VisualizationMeta
  index: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty config
// ─────────────────────────────────────────────────────────────────────────────

const DIFFICULTY: Record<
  1 | 2 | 3,
  { label: string; color: string; bg: string; icon: string }
> = {
  1: { label: 'Intro',     color: '#4fde98', bg: '#4fde9820', icon: '○' },
  2: { label: 'Mid',       color: '#f7a94f', bg: '#f7a94f20', icon: '◑' },
  3: { label: 'Advanced',  color: '#f75f5f', bg: '#f75f5f20', icon: '●' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Topic icon — maps broad topic categories to a simple SVG glyph
// ─────────────────────────────────────────────────────────────────────────────

function TopicIcon({ topicId }: { topicId: string }): React.ReactElement {
  const size = 28

  if (topicId.includes('charge') || topicId.includes('coulomb')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="8" cy="12" r="4" />
        <circle cx="16" cy="12" r="4" />
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="14" y1="12" x2="18" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
      </svg>
    )
  }
  if (topicId.includes('field') && !topicId.includes('magnetic')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 12h14M15 7l5 5-5 5" />
        <circle cx="5" cy="12" r="2" fill="currentColor" fillOpacity="0.3" />
      </svg>
    )
  }
  if (topicId.includes('flux') || topicId.includes('gauss')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <ellipse cx="12" cy="12" rx="8" ry="5" />
        <line x1="8" y1="8" x2="10" y2="16" />
        <line x1="12" y1="7" x2="12" y2="17" />
        <line x1="16" y1="8" x2="14" y2="16" />
      </svg>
    )
  }
  if (topicId.includes('potential')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 17 Q7 7 12 12 Q17 17 21 7" />
        <line x1="3" y1="20" x2="21" y2="20" />
      </svg>
    )
  }
  if (topicId.includes('capacitor')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="3" y1="12" x2="10" y2="12" />
        <line x1="14" y1="12" x2="21" y2="12" />
        <line x1="10" y1="6" x2="10" y2="18" />
        <line x1="14" y1="6" x2="14" y2="18" />
      </svg>
    )
  }
  if (topicId.includes('current') || topicId.includes('resistance') || topicId.includes('circuit')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,12 7,12 9,6 11,18 13,10 15,14 17,12 21,12" />
      </svg>
    )
  }
  if (topicId.includes('magnetic-force') || topicId.includes('lorentz')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 4v10" />
        <path d="M8 18l4-4 4 4" />
        <line x1="4" y1="10" x2="20" y2="10" />
        <circle cx="12" cy="10" r="2" fill="currentColor" fillOpacity="0.25" />
      </svg>
    )
  }
  if (topicId.includes('magnetic') || topicId.includes('biot') || topicId.includes('ampere')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 5C8.1 5 5 8.1 5 12s3.1 7 7 7 7-3.1 7-7" />
        <path d="M12 5l3 3-3 3" />
      </svg>
    )
  }
  if (topicId.includes('faraday') || topicId.includes('induct')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 12 Q7 8 9 12 Q11 16 13 12 Q15 8 17 12 Q19 16 21 12" />
        <path d="M3 18l2-2-2-2" />
      </svg>
    )
  }
  if (topicId.includes('rlc')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 12 Q7 4 12 12 Q17 20 21 12" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    )
  }
  if (topicId.includes('em-wave') || topicId.includes('wave')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M2 12 Q5 6 8 12 Q11 18 14 12 Q17 6 20 12" />
        <path d="M2 12 Q5 18 8 12 Q11 6 14 12 Q17 18 20 12" opacity="0.4" />
        <line x1="21" y1="12" x2="23" y2="12" />
      </svg>
    )
  }
  // Generic default
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16" r="0.8" fill="currentColor" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Card component
// ─────────────────────────────────────────────────────────────────────────────

export const VisualizationCard: React.FC<Props> = ({ viz, index }) => {
  const navigate = useNavigate()
  const diff = DIFFICULTY[viz.difficultyLevel]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.3 }}
      whileHover={{ y: -5, scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/visualize/${viz.id}`)}
      style={{
        backgroundColor: 'var(--bg-surface, #1a1a24)',
        border: '1px solid #2a2a40',
        borderRadius: '18px',
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      className="group"
    >
      {/* Header row: difficulty badge + topic icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Difficulty badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 9px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            backgroundColor: diff.bg,
            color: diff.color,
          }}
        >
          {diff.icon} {diff.label}
        </span>

        {/* Topic icon */}
        <span style={{ color: '#2a2a50', transition: 'color 0.2s' }} className="group-hover:!text-[#4f8ef7]">
          <TopicIcon topicId={viz.id} />
        </span>
      </div>

      {/* Title + caption */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            color: 'var(--text-primary, #e8e8f0)',
            fontWeight: 600,
            fontSize: '15px',
            marginBottom: '5px',
            transition: 'color 0.2s',
          }}
          className="group-hover:!text-[#4f8ef7]"
        >
          {viz.topic}
        </h3>
        <p
          style={{
            color: 'var(--text-secondary, #8888aa)',
            fontSize: '13px',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {viz.caption.what}
        </p>
      </div>

      {/* Concept tags (first 2) */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {viz.conceptTags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: '#222232',
              color: 'var(--text-muted, #555577)',
              fontSize: '11px',
              fontWeight: 500,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={(e) => { e.stopPropagation(); navigate(`/visualize/${viz.id}`) }}
        style={{
          width: '100%',
          padding: '9px 0',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: 'var(--accent-blue, #4f8ef7)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.15s',
          letterSpacing: '0.01em',
        }}
      >
        Visualize It →
      </motion.button>
    </motion.div>
  )
}

export default VisualizationCard
