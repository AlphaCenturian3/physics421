import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import { getVisualizationById } from '../services/visualizationMapper'
import AnimationControls from '../components/AnimationControls'
import type { VisualizationProps } from '../types'

// ─── Lazy visualization map ───────────────────────────────────────────────────
type VizMap = Record<string, React.LazyExoticComponent<React.ComponentType<VisualizationProps>>>

const vizComponents: VizMap = {
  'electric-charge':    lazy(() => import('../visualizations/ElectricCharge/index')),
  'electric-field':     lazy(() => import('../visualizations/ElectricField/index')),
  'electric-flux':      lazy(() => import('../visualizations/ElectricFlux/index')),
  'gauss-law':          lazy(() => import('../visualizations/GaussLaw/index')),
  'electric-potential': lazy(() => import('../visualizations/ElectricPotential/index')),
  'potential-energy':   lazy(() => import('../visualizations/PotentialEnergy/index')),
  'capacitors':         lazy(() => import('../visualizations/Capacitors/index')),
  'current-resistance': lazy(() => import('../visualizations/CurrentResistance/index')),
  'dc-circuits':        lazy(() => import('../visualizations/DCCircuits/index')),
  'magnetic-fields':    lazy(() => import('../visualizations/MagneticFields/index')),
  'magnetic-force':     lazy(() => import('../visualizations/MagneticForce/index')),
  'biot-savart':        lazy(() => import('../visualizations/BiotSavart/index')),
  'amperes-law':        lazy(() => import('../visualizations/AmperesLaw/index')),
  'faradays-law':       lazy(() => import('../visualizations/FaradaysLaw/index')),
  'inductance':         lazy(() => import('../visualizations/Inductance/index')),
  'rlc-circuits':       lazy(() => import('../visualizations/RLCCircuits/index')),
  'em-waves':           lazy(() => import('../visualizations/EMWaves/index')),
}

// ─── Difficulty config ────────────────────────────────────────────────────────
const DIFF_COLOR = { 1: '#4fde98', 2: '#f7a94f', 3: '#f75f5f' } as const
const DIFF_LABEL = { 1: 'Intro',   2: 'Mid',     3: 'Advanced' } as const

// ─── Canvas loading fallback ──────────────────────────────────────────────────
function CanvasLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: '2rem',
        height: '2rem',
        border: '2px solid rgba(79,142,247,0.25)',
        borderTopColor: 'var(--accent-blue, #4f8ef7)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

// ─── VisualizePage ────────────────────────────────────────────────────────────
export default function VisualizePage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate    = useNavigate()

  const { setCurrentTopic, isFocusMode, setFocusMode, markProgress, setTutorContext } = useAppStore()

  const meta         = topicId ? getVisualizationById(topicId) : null
  const VizComponent = topicId ? vizComponents[topicId] : null

  const [isPlaying,  setIsPlaying ] = useState(true)
  const [speed,      setSpeed     ] = useState(1)
  const [replayKey,  setReplayKey ] = useState(0)
  const [contextOpen, setContextOpen] = useState(false)

  // Register topic in store on mount; clear on unmount
  useEffect(() => {
    if (meta) {
      setCurrentTopic(meta.id, meta.topic)
      markProgress(meta.id)
    }
    return () => setCurrentTopic(null)
  }, [meta?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stable callback for visualization interactions — no store.getState() in JSX
  const handleConceptInteract = useCallback((concept: string) => {
    setTutorContext(`Student interacted with: ${concept}`)
  }, [setTutorContext])

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!meta || !VizComponent) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', gap: '1rem',
      }}>
        <p style={{ color: 'var(--text-secondary, #8888aa)' }}>Visualization not found.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--accent-blue, #4f8ef7)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const diffColor = DIFF_COLOR[meta.difficultyLevel]
  const diffLabel = DIFF_LABEL[meta.difficultyLevel]

  // ── Focus mode: canvas only + exit button ─────────────────────────────────
  if (isFocusMode) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-primary, #0f0f14)' }}>
        {/* Exit focus mode */}
        <button
          onClick={() => setFocusMode(false)}
          title="Exit focus mode"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            border: '1px solid var(--border, #2a2a3a)',
            backgroundColor: 'rgba(15,15,20,0.7)',
            color: 'var(--text-secondary, #8888aa)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          ✕ Exit Focus
        </button>

        <Suspense fallback={<CanvasLoader />}>
          <VizComponent
            key={replayKey}
            isPlaying={isPlaying}
            speed={speed}
            isFocusMode={true}
            onConceptInteract={handleConceptInteract}
          />
        </Suspense>
      </div>
    )
  }

  // ── Normal mode ───────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '1.5rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.25rem',
      }}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary, #8888aa)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary, #e8e8f0)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary, #8888aa)' }}
        >
          ← Back
        </button>

        <span style={{
          padding: '0.125rem 0.625rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          backgroundColor: diffColor + '22',
          color: diffColor,
        }}>
          {diffLabel}
        </span>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary, #e8e8f0)', lineHeight: 1.2 }}>
            {meta.topic}
          </h1>
          <p style={{ color: 'var(--text-secondary, #8888aa)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>
            {meta.title}
          </p>
        </div>
      </div>

      {/* ── Main content: canvas + optional side panel ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', alignItems: 'start' }}>
        {/* Canvas */}
        <div>
          <Suspense fallback={<CanvasLoader />}>
            <VizComponent
              key={replayKey}
              isPlaying={isPlaying}
              speed={speed}
              isFocusMode={false}
              onConceptInteract={handleConceptInteract}
            />
          </Suspense>

          {/* Animation controls below canvas */}
          <div style={{ marginTop: '1rem' }}>
            <AnimationControls
              isPlaying={isPlaying}
              speed={speed}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onReplay={() => { setReplayKey(k => k + 1); setIsPlaying(true) }}
              onSpeedChange={setSpeed}
              isFocusMode={false}
              onToggleFocusMode={() => setFocusMode(true)}
            />
          </div>

          {/* Collapsible context / caption */}
          <div style={{ marginTop: '0.875rem', border: '1px solid var(--border, #2a2a3a)', borderRadius: '10px', overflow: 'hidden' }}>
            <button
              onClick={() => setContextOpen(o => !o)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface, #1a1a24)',
                border: 'none',
                color: 'var(--text-secondary, #8888aa)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary, #e8e8f0)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary, #8888aa)' }}
            >
              <span>What to notice</span>
              <span style={{ fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block', transform: contextOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>

            {contextOpen && (
              <div style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-surface, #1a1a24)',
                borderTop: '1px solid var(--border, #2a2a3a)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                <p style={{ color: 'var(--text-primary, #e8e8f0)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--accent-blue, #4f8ef7)', fontWeight: 600 }}>What: </span>
                  {meta.caption.what}
                </p>
                <p style={{ color: 'var(--text-primary, #e8e8f0)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--accent-amber, #f7a94f)', fontWeight: 600 }}>Why: </span>
                  {meta.caption.why}
                </p>
                <p style={{ color: 'var(--text-primary, #e8e8f0)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--accent-green, #4fde98)', fontWeight: 600 }}>Notice: </span>
                  {meta.caption.notice}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Concept tags side panel (hidden on small screens via min-width) ── */}
        <aside style={{ width: '168px', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #444466)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
            Concepts
          </p>
          {meta.conceptTags.map(tag => (
            <span
              key={tag}
              style={{
                display: 'block',
                padding: '0.25rem 0.625rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: 'var(--bg-elevated, #22223a)',
                color: 'var(--text-secondary, #8888aa)',
                border: '1px solid var(--border, #2a2a3a)',
              }}
            >
              {tag}
            </span>
          ))}
        </aside>
      </div>
    </motion.div>
  )
}
