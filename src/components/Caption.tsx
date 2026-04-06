import React from 'react'
import { motion } from 'framer-motion'

interface CaptionData {
  what: string
  why: string
  notice: string
}

interface CaptionProps {
  caption: CaptionData
  /**
   * Delay before the caption fades in (seconds). Defaults to 1s so
   * the animation has time to start playing before the text appears.
   */
  delay?: number
  /** Render a compact single-line variant (useful inside focus mode HUD). */
  compact?: boolean
}

interface CaptionLineProps {
  label: string
  labelColor: string
  text: string
  delay: number
}

const CaptionLine: React.FC<CaptionLineProps> = ({ label, labelColor, text, delay }) => (
  <motion.p
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    style={{
      fontSize: '13.5px',
      lineHeight: 1.6,
      color: 'var(--text-primary, #e8e8f0)',
      margin: 0,
    }}
  >
    <span style={{ color: labelColor, fontWeight: 700 }}>{label}: </span>
    {text}
  </motion.p>
)

/**
 * Caption — displays the three-line what / why / notice caption for a
 * visualization. The whole block fades in after `delay` seconds (default 1s)
 * so it doesn't compete with the animation starting up.
 */
export const Caption: React.FC<CaptionProps> = ({
  caption,
  delay = 1,
  compact = false,
}) => {
  if (compact) {
    // Single-line ticker for focus-mode HUD
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay, duration: 0.5 }}
        style={{
          display: 'inline-flex',
          gap: '16px',
          padding: '6px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(26,26,36,0.75)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #2a2a40',
          fontSize: '12px',
          color: 'var(--text-secondary, #8888aa)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <span><span style={{ color: '#4f8ef7', fontWeight: 700 }}>What: </span>{caption.what}</span>
        <span style={{ color: '#2a2a40' }}>|</span>
        <span><span style={{ color: '#f7a94f', fontWeight: 700 }}>Why: </span>{caption.why}</span>
        <span style={{ color: '#2a2a40' }}>|</span>
        <span><span style={{ color: '#4fde98', fontWeight: 700 }}>Notice: </span>{caption.notice}</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        backgroundColor: 'var(--bg-surface, #1a1a24)',
        border: '1px solid #2a2a40',
        borderRadius: '14px',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <CaptionLine
        label="What"
        labelColor="var(--accent-blue, #4f8ef7)"
        text={caption.what}
        delay={delay + 0.05}
      />
      <CaptionLine
        label="Why"
        labelColor="var(--accent-amber, #f7a94f)"
        text={caption.why}
        delay={delay + 0.15}
      />
      <CaptionLine
        label="Notice"
        labelColor="var(--accent-green, #4fde98)"
        text={caption.notice}
        delay={delay + 0.25}
      />
    </motion.div>
  )
}

export default Caption
