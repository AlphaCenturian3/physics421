import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FocusModeProps {
  isFocusMode: boolean
  onExit?: () => void
  children: React.ReactNode
}

/**
 * FocusMode — wraps any visualization in a fullscreen overlay when
 * isFocusMode is true, and renders normally (inline) when false.
 *
 * Press Escape or click the subtle exit button in the top-right corner
 * to leave focus mode.
 */
export const FocusMode: React.FC<FocusModeProps> = ({
  isFocusMode,
  onExit,
  children,
}) => {
  // Keyboard shortcut: Escape exits focus mode
  useEffect(() => {
    if (!isFocusMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFocusMode, onExit])

  // Prevent body scroll while in focus mode
  useEffect(() => {
    document.body.style.overflow = isFocusMode ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isFocusMode])

  // ── Normal (inline) mode ──────────────────────────────────────────────────
  if (!isFocusMode) {
    return <>{children}</>
  }

  // ── Focus (fullscreen) mode ───────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="focus-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          backgroundColor: 'var(--bg-primary, #0f0f14)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Content fills the screen */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {children}
        </div>

        {/* Minimal exit affordance — fades in after 600ms so it doesn't distract */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
          }}
        >
          <button
            onClick={onExit}
            title="Exit focus mode (Esc)"
            aria-label="Exit focus mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #2a2a40',
              backgroundColor: 'rgba(26,26,36,0.8)',
              backdropFilter: 'blur(8px)',
              color: 'var(--text-muted, #555577)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#4a4a60'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = '#555577'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a40'
            }}
          >
            {/* X icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
            Exit Focus
          </button>
        </motion.div>

        {/* Keyboard hint toast — visible briefly at start */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.5, times: [0, 0.15, 0.7, 1], delay: 0.3 }}
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(26,26,36,0.85)',
            border: '1px solid #2a2a40',
            color: 'var(--text-muted, #555577)',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          Press <kbd style={{ fontFamily: 'monospace', color: '#8888aa' }}>Esc</kbd> to exit focus mode
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FocusMode
