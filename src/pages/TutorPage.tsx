import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import type { Message } from '../types'

const TOPICS = [
  { id: 'electric-field',     label: 'Electric Field' },
  { id: 'gauss-law',          label: "Gauss's Law" },
  { id: 'electric-potential', label: 'Electric Potential' },
  { id: 'faradays-law',       label: "Faraday's Law" },
  { id: 'magnetic-force',     label: 'Magnetic Force' },
  { id: 'rlc-circuits',       label: 'RLC Circuits' },
  { id: 'em-waves',           label: 'EM Waves' },
  { id: 'capacitors',         label: 'Capacitors' },
]

const STARTERS = [
  "Why does Gauss's Law need symmetry?",
  "What's the difference between E field and electric potential?",
  "How does Faraday's Law generate electricity?",
  "Explain RLC resonance simply",
  "What is the right-hand rule?",
  "Why do field lines never cross?",
]

function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      {[0, 150, 300].map(d => (
        <span key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', animation: `tdots 0.9s ${d}ms infinite` }} />
      ))}
      <style>{`@keyframes tdots{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </span>
  )
}

export default function TutorPage() {
  const navigate  = useNavigate()
  const { currentTopic, currentTopicTitle, setTutorContext } = useAppStore()
  const [tutorReady, setTutorReady] = useState(true)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || isTyping) return
    setInput('')

    const userMsg: Message    = { id: genId(), role: 'user',      content: text, timestamp: new Date() }
    const assistantId         = genId()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsTyping(true)

    if (!tutorReady) {
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: 'The AI tutor requires a backend API key. Contact your administrator or set ANTHROPIC_API_KEY in your Netlify environment variables.' }
        : m))
      setIsTyping(false)
      return
    }

    const history = [...messages, userMsg].slice(-14).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), 30000)
    try {
      const response = await fetch('/.netlify/functions/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, currentTopic: currentTopic ?? currentTopicTitle ?? null }),
        signal: abort.signal,
      })
      clearTimeout(timer)
      if (!response.ok) {
        // Netlify functions not running (plain Vite dev or function missing)
        setTutorReady(false)
        throw new Error('not_configured')
      }
      const data = await response.json()
      if (data.notConfigured) {
        setTutorReady(false)
        throw new Error('not_configured')
      }
      if (data.error) throw new Error(data.error)
      const reply: string = data.reply ?? ''
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + reply } : m))
    } catch (err) {
      clearTimeout(timer)
      const msg = err instanceof Error ? err.message : ''
      const isUnavailable = msg === 'not_configured' || msg.includes('abort') || msg.includes('AbortError')
      if (isUnavailable) setTutorReady(false)
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: (msg === 'not_configured') ? 'The AI tutor requires a backend API key. Contact your administrator or set ANTHROPIC_API_KEY in your Netlify environment variables.' : msg.includes('abort') ? 'Request timed out. Please try again.' : 'Connection error. Please try again.' }
        : m))
    } finally {
      setIsTyping(false)
    }
  }, [input, isTyping, messages, currentTopic, currentTopicTitle, tutorReady])

  const handleTopicFocus = (id: string, label: string) => {
    setTutorContext(`Student is studying: ${label}`)
    handleSend(`I'm studying ${label}. Give me a short conceptual overview.`)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tutorReady ? '#4fde98' : '#f7a94f', flexShrink: 0 }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Physics Tutor</h1>
          {!tutorReady && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', background: 'rgba(247,169,79,0.1)', border: '1px solid rgba(247,169,79,0.25)', borderRadius: '9999px', padding: '0.125rem 0.625rem' }}>
              API key not set
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {currentTopicTitle ? `Context: ${currentTopicTitle}` : 'Ask about any E&M concept'}
        </p>
      </div>

      {/* Setup banner */}
      {!tutorReady && (
        <div style={{ background: 'rgba(247,169,79,0.07)', border: '1px solid rgba(247,169,79,0.25)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', flexShrink: 0 }}>
          <p style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.375rem' }}>Setup required</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            The AI tutor requires a backend API key. Contact your administrator or set{' '}
            <code style={{ color: '#4fde98', fontSize: '0.8125rem' }}>ANTHROPIC_API_KEY</code>{' '}
            in your Netlify environment variables.
          </p>
        </div>
      )}

      {/* Topic chips */}
      {messages.length === 0 && (
        <div style={{ marginBottom: '1.25rem', flexShrink: 0 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>Jump to topic</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => handleTopicFocus(t.id, t.label)}
                style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent-blue)'; el.style.color = 'var(--accent-blue)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
        {messages.length === 0 && (
          <div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Or try a starter question:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
              {STARTERS.map(s => (
                <button key={s} onClick={() => handleSend(s)}
                  style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.45, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-elevated)'; el.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--bg-surface)'; el.style.color = 'var(--text-secondary)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
              style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '72%', padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-surface)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
              }}>
                {msg.content || <TypingDots />}
                {msg.role === 'assistant' && msg.content && currentTopic && (
                  <button onClick={() => navigate(`/visualize/${currentTopic}`)}
                    style={{ display: 'block', marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.8125rem', cursor: 'pointer', padding: 0 }}>
                    → Open visualization
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '0.5rem', padding: 0 }}>
            Clear conversation
          </button>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ask anything about E&M... (Enter to send, Shift+Enter for newline)"
            rows={2} disabled={isTyping}
            style={{ flex: 1, resize: 'none', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit', lineHeight: 1.5 }}
            onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent-blue)' }}
            onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)' }}
          />
          <button onClick={() => handleSend()} disabled={isTyping || !input.trim()}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', border: 'none', background: 'var(--accent-blue)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer', opacity: isTyping || !input.trim() ? 0.4 : 1, transition: 'opacity 0.15s', flexShrink: 0 }}>
            Send
          </button>
        </div>
      </div>
    </motion.div>
  )
}
