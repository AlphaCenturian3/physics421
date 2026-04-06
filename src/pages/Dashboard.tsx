import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import { VISUALIZATIONS } from '../services/visualizationMapper'
import type { VisualizationMeta } from '../services/visualizationMapper'

const DIFF = {
  1: { label: 'Intro',    color: '#4fde98', bg: 'rgba(79,222,152,0.1)'  },
  2: { label: 'Mid',      color: '#f7a94f', bg: 'rgba(247,169,79,0.1)'  },
  3: { label: 'Advanced', color: '#f77f7f', bg: 'rgba(247,127,127,0.1)' },
} as const

const FILTERS = [
  { val: 0 as const, label: 'All'      },
  { val: 1 as const, label: 'Intro'    },
  { val: 2 as const, label: 'Mid'      },
  { val: 3 as const, label: 'Advanced' },
]

// Group topics into sections for better structure
const SECTIONS = [
  { label: 'Electrostatics',   ids: ['electric-charge','electric-field','electric-flux','gauss-law','electric-potential','potential-energy','capacitors'] },
  { label: 'Current & Circuits', ids: ['current-resistance','dc-circuits'] },
  { label: 'Magnetism',        ids: ['magnetic-fields','magnetic-force','biot-savart','amperes-law'] },
  { label: 'Induction & Waves',ids: ['faradays-law','inductance','rlc-circuits','em-waves'] },
]

function TopicCard({ viz, done }: { viz: VisualizationMeta; done: boolean }) {
  const navigate = useNavigate()
  const diff = DIFF[viz.difficultyLevel]

  return (
    <div
      style={{ position: 'relative', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, border-color 0.2s', cursor: 'default' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)'; el.style.borderColor = 'rgba(79,142,247,0.3)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.borderColor = 'var(--border)' }}
    >
      {/* Difficulty bar */}
      <div style={{ height: '3px', background: diff.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '0.875rem 1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Title + done */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1 }}>
            {viz.topic}
          </span>
          {done && (
            <span style={{ fontSize: '0.75rem', color: '#4fde98', background: 'rgba(79,222,152,0.1)', border: '1px solid rgba(79,222,152,0.2)', borderRadius: '9999px', padding: '1px 7px', fontWeight: 700, flexShrink: 0, lineHeight: 1.6 }}>
              ✓
            </span>
          )}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {viz.conceptTags.slice(0, 2).map(tag => (
            <span key={tag} style={{ padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Difficulty */}
        <div style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: diff.color, background: diff.bg, padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
            {diff.label}
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate(`/visualize/${viz.id}`)}
        style={{ margin: '0 0.75rem 0.75rem', padding: '0.5rem', borderRadius: '7px', border: 'none', background: 'var(--accent-blue)', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      >
        Open
      </button>
    </div>
  )
}

export default function Dashboard() {
  const [filter, setFilter] = useState<0|1|2|3>(0)
  const displayName = useAppStore(s => s.displayName)
  const progress    = useAppStore(s => s.progress)
  const navigate    = useNavigate()

  const completedCount = Object.values(progress).filter(Boolean).length
  const pct = Math.round((completedCount / VISUALIZATIONS.length) * 100)

  const filtered = filter === 0 ? VISUALIZATIONS : VISUALIZATIONS.filter(v => v.difficultyLevel === filter)

  // Build sections from filtered list
  const visibleSections = SECTIONS.map(s => ({
    ...s,
    items: filtered.filter(v => s.ids.includes(v.id)),
  })).filter(s => s.items.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {displayName ? `Hi, ${displayName} 👋` : 'Physics 421'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Electricity &amp; Magnetism — Interactive Study Platform
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/practice')}
            style={{ padding: '0.5rem 1.125rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent-blue)'; el.style.color = 'var(--accent-blue)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)' }}>
            Practice
          </button>
          <button onClick={() => navigate('/tutor')}
            style={{ padding: '0.5rem 1.125rem', borderRadius: '8px', border: 'none', background: 'var(--accent-blue)', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
            AI Tutor
          </button>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────────────── */}
      {completedCount > 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Study progress</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{completedCount} / {VISUALIZATIONS.length} topics</span>
            </div>
            <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '9999px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-blue), #4fde98)', borderRadius: '9999px', transition: 'width 0.6s ease' }} />
            </div>
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#4fde98', flexShrink: 0 }}>{pct}%</span>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {FILTERS.map(({ val, label }) => {
          const active = filter === val
          return (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500,
              border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border)'}`,
              background: active ? 'var(--accent-blue)' : 'transparent',
              color: active ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          )
        })}
        <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {filtered.length} topics
        </span>
      </div>

      {/* ── Sectioned topic grid ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {visibleSections.map(section => (
          <div key={section.label}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem' }}>
              {section.label}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
              {section.items.map(viz => (
                <TopicCard key={viz.id} viz={viz} done={!!progress[viz.id]} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
