import React from 'react'
import { motion } from 'framer-motion'
import type { AnimationControlsProps } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG icons
// ─────────────────────────────────────────────────────────────────────────────

const PlayIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="currentColor">
    <path d="M2.5 1.5L11.5 7L2.5 12.5V1.5Z" />
  </svg>
)

const PauseIcon = () => (
  <svg width="13" height="14" viewBox="0 0 13 14" fill="currentColor">
    <rect x="2" y="1.5" width="3.5" height="11" rx="1" />
    <rect x="7.5" y="1.5" width="3.5" height="11" rx="1" />
  </svg>
)

const ReplayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 7A5.5 5.5 0 1 0 3 3.2" />
    <path d="M1.5 1.5V4H4" />
  </svg>
)

const StepForwardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M1.5 1.5L8.5 7L1.5 12.5V1.5Z" />
    <rect x="9.5" y="1.5" width="3" height="11" rx="1" />
  </svg>
)

const FocusOnIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 4V2a1 1 0 0 1 1-1h2M10 1h2a1 1 0 0 1 1 1v2M1 10v2a1 1 0 0 0 1 1h2M10 13h2a1 1 0 0 0 1-1v-2" />
    <circle cx="7" cy="7" r="2" />
  </svg>
)

const FocusOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M4 1H2a1 1 0 0 0-1 1v2M10 1h2a1 1 0 0 1 1 1v2M4 13H2a1 1 0 0 1-1-1v-2M10 13h2a1 1 0 0 0 1-1v-2" />
    <path d="M5 5l4 4M9 5L5 9" strokeWidth="1.4" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// Speed presets
// ─────────────────────────────────────────────────────────────────────────────

const SPEED_PRESETS = [0.25, 0.5, 1, 1.5, 2] as const

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AnimationControls — reusable control bar for all visualization pages.
 *
 * Accepts either the canonical AnimationControlsProps interface (speed / onSpeedChange)
 * or the legacy prop names (isSlowMode / onToggleSlow) so existing visualizations
 * can continue to work without modification.
 */
type LegacyCompatProps = AnimationControlsProps & {
  // Legacy prop aliases kept for backwards compat with existing visualizations
  isSlowMode?: boolean
  onToggleSlow?: () => void
  onStep?: () => void
  onToggleFocus?: () => void
}

export const AnimationControls: React.FC<LegacyCompatProps> = ({
  isPlaying,
  speed,
  onPlay,
  onPause,
  onReplay,
  onSpeedChange,
  onStepForward,
  isFocusMode,
  onToggleFocusMode,
  // Legacy aliases
  isSlowMode,
  onToggleSlow,
  onStep,
  onToggleFocus,
}) => {
  // Resolve legacy props transparently
  const resolvedSpeed = speed ?? (isSlowMode ? 0.25 : 1)
  const resolvedFocusToggle = onToggleFocusMode ?? onToggleFocus ?? (() => {})
  const resolvedStepForward = onStepForward ?? onStep

  const handleSpeedToggle = () => {
    if (onSpeedChange) {
      // Cycle through presets
      const idx = SPEED_PRESETS.indexOf(resolvedSpeed as typeof SPEED_PRESETS[number])
      const next = SPEED_PRESETS[(idx + 1) % SPEED_PRESETS.length]
      onSpeedChange(next)
    } else if (onToggleSlow) {
      onToggleSlow()
    }
  }

  const isSlowActive = resolvedSpeed <= 0.5 || isSlowMode

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: 'var(--bg-surface, #1a1a24)',
      border: '1px solid #2a2a40',
      borderRadius: '14px',
      padding: '6px 12px',
    },
    btnBase: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s, color 0.15s',
      flexShrink: 0,
    },
    primaryBtn: {
      backgroundColor: 'var(--accent-blue, #4f8ef7)',
      color: '#ffffff',
    },
    secondaryBtn: {
      backgroundColor: '#222232',
      color: 'var(--text-secondary, #8888aa)',
    },
    activeTagBtn: {
      backgroundColor: 'var(--accent-amber, #f7a94f)',
      color: '#0f0f14',
    },
    activeFocusBtn: {
      backgroundColor: 'var(--accent-green, #4fde98)',
      color: '#0f0f14',
    },
    tagBtn: {
      height: '36px',
      padding: '0 12px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.02em',
      transition: 'background 0.15s, color 0.15s',
    },
    divider: {
      width: '1px',
      height: '22px',
      backgroundColor: '#2a2a40',
      margin: '0 2px',
      flexShrink: 0,
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={styles.container}
    >
      {/* Play / Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        style={{ ...styles.btnBase, ...styles.primaryBtn }}
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      {/* Replay */}
      <button
        onClick={onReplay}
        style={{ ...styles.btnBase, ...styles.secondaryBtn }}
        title="Replay from start"
        aria-label="Replay animation"
      >
        <ReplayIcon />
      </button>

      {/* Step Forward (optional) */}
      {resolvedStepForward && (
        <button
          onClick={resolvedStepForward}
          style={{ ...styles.btnBase, ...styles.secondaryBtn }}
          title="Step one frame forward"
          aria-label="Step forward"
        >
          <StepForwardIcon />
        </button>
      )}

      <div style={styles.divider} />

      {/* Slow Mode / Speed toggle */}
      <button
        onClick={handleSpeedToggle}
        style={{
          ...styles.tagBtn,
          ...(isSlowActive ? styles.activeTagBtn : { backgroundColor: '#222232', color: 'var(--text-secondary, #8888aa)' }),
        }}
        title={`Current speed: ${resolvedSpeed}×. Click to cycle.`}
        aria-label="Toggle speed"
      >
        {resolvedSpeed === 1 ? '1×' : `${resolvedSpeed}×`}
      </button>

      {/* Focus Mode */}
      <button
        onClick={resolvedFocusToggle}
        style={{
          ...styles.tagBtn,
          ...(isFocusMode ? styles.activeFocusBtn : { backgroundColor: '#222232', color: 'var(--text-secondary, #8888aa)' }),
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
        title={isFocusMode ? 'Exit focus mode' : 'Enter focus mode (fullscreen)'}
        aria-label="Toggle focus mode"
      >
        {isFocusMode ? <FocusOffIcon /> : <FocusOnIcon />}
        <span>{isFocusMode ? 'Exit' : 'Focus'}</span>
      </button>
    </motion.div>
  )
}

export default AnimationControls
