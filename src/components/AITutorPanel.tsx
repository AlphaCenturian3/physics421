import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import type { Message } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG icons
// ─────────────────────────────────────────────────────────────────────────────

const ChatBubbleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Typing indicator — three bouncing dots */
const TypingDots: React.FC = () => (
  <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'var(--text-secondary, #8888aa)',
          display: 'inline-block',
          animation: `bounce 0.9s ${delay}ms infinite`,
        }}
      />
    ))}
    <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>
  </span>
)

/** Parses **[Visualize It: topic-id]** markers into clickable buttons */
function renderContent(
  content: string,
  onNavigate: (id: string) => void,
): React.ReactNode {
  const vizRegex = /\*\*\[Visualize It: ([a-z-]+)\]\*\*/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = vizRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>,
      )
    }
    const topicId = match[1]
    parts.push(
      <button
        key={`v-${match.index}`}
        onClick={() => onNavigate(topicId)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 9px',
          margin: '0 3px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'rgba(79,142,247,0.18)',
          color: 'var(--accent-blue, #4f8ef7)',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(79,142,247,0.3)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(79,142,247,0.18)')
        }
      >
        ⚡ Visualize It
      </button>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(<span key={`t-end`}>{content.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : content
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick-start prompts
// ─────────────────────────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  "How does Gauss's Law work?",
  'Explain magnetic force',
  'What is electric potential?',
  'Walk me through Faraday\'s Law',
]

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const AITutorPanel: React.FC = () => {
  const navigate = useNavigate()
  const {
    tutorOpen,
    setTutorOpen,
    currentTopic,
    currentTopicTitle,
  } = useAppStore()

  // Local message state — keeps the panel fully self-contained
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [input, setInput] = useState('')
  const [tutorReady, setTutorReady] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isTutorOpen = tutorOpen

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus the input whenever the panel opens
  useEffect(() => {
    if (isTutorOpen) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isTutorOpen])

  const handleOpen = useCallback(() => {
    setTutorOpen(true)
  }, [setTutorOpen])

  const handleClose = useCallback(() => {
    setTutorOpen(false)
  }, [setTutorOpen])

  // Navigate to a visualization and close the panel
  const handleNavigateToViz = useCallback(
    (topicId: string) => {
      navigate(`/visualize/${topicId}`)
      handleClose()
    },
    [navigate, handleClose],
  )

  const handleSend = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim()
      if (!text || isTyping) return
      setInput('')

      // If backend not configured, show a static helpful message
      if (!tutorReady) {
        const userMsg: Message = { id: generateId(), role: 'user', content: text, timestamp: new Date() }
        const helpMsg: Message = {
          id: generateId(), role: 'assistant', timestamp: new Date(),
          content: 'The AI tutor requires a backend API key. Contact your administrator or set ANTHROPIC_API_KEY in your Netlify environment variables.',
        }
        setMessages(prev => [...prev, userMsg, helpMsg])
        return
      }

      // Add user message
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      }

      // Add empty assistant placeholder
      const assistantId = generateId()
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsTyping(true)

      // Build history (exclude the empty assistant placeholder we just added)
      const history = [...messages, userMsg].slice(-12).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + reply } : m,
          ),
        )
      } catch (err) {
        clearTimeout(timer)
        const msg = err instanceof Error ? err.message : ''
        if (msg === 'not_configured') setTutorReady(false)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: msg === 'not_configured' ? 'The AI tutor requires a backend API key. Contact your administrator or set ANTHROPIC_API_KEY in your Netlify environment variables.' : msg.includes('abort') ? 'Request timed out. Please try again.' : 'Error connecting to AI tutor. Please try again.' }
              : m,
          ),
        )
      } finally {
        setIsTyping(false)
      }
    },
    [input, isTyping, messages, currentTopic, currentTopicTitle, tutorReady],
  )

  const handleTellMeMore = useCallback(
    (assistantContent: string) => {
      const prompt = `Tell me more about what you just said: "${assistantContent.slice(0, 120)}${assistantContent.length > 120 ? '...' : ''}"`
      handleSend(prompt)
    },
    [handleSend],
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating chat bubble button ─────────────────────────────────── */}
      <AnimatePresence>
        {!isTutorOpen && (
          <motion.button
            key="chat-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleOpen}
            aria-label="Open AI Tutor"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 50,
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'var(--accent-blue, #4f8ef7)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(79,142,247,0.35)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6aa0ff')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-blue, #4f8ef7)')
            }
          >
            <ChatBubbleIcon />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Sliding panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTutorOpen && (
          <motion.div
            key="tutor-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 50,
              width: '384px',
              height: '560px',
              backgroundColor: 'var(--bg-surface, #1a1a24)',
              border: '1px solid #2a2a40',
              borderRadius: '20px',
              boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #2a2a40',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: tutorReady ? 'var(--accent-green, #4fde98)' : '#f7a94f',
                      animation: tutorReady ? 'pulse 2s infinite' : 'none',
                    }}
                  />
                  <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
                  <span style={{ color: '#e8e8f0', fontWeight: 700, fontSize: '14px' }}>
                    AI Physics Tutor
                  </span>
                </div>
                {(currentTopicTitle ?? currentTopic) && (
                  <div style={{ color: '#555577', fontSize: '11px', marginTop: '2px' }}>
                    Context: {currentTopicTitle ?? currentTopic}
                  </div>
                )}
                {!tutorReady && (
                  <div style={{ color: 'var(--accent-amber, #f7a94f)', fontSize: '11px', marginTop: '2px' }}>
                    API key not configured
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Clear chat */}
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    title="Clear conversation"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#555577',
                      fontSize: '11px',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#8888aa')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#555577')}
                  >
                    Clear
                  </button>
                )}

                {/* Close */}
                <button
                  onClick={handleClose}
                  title="Close tutor"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#555577',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#555577')}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Message list */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* Empty state */}
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: '24px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚡</div>
                  {!tutorReady ? (
                    <div style={{ background: 'rgba(247,169,79,0.08)', border: '1px solid rgba(247,169,79,0.3)', borderRadius: '10px', padding: '12px', marginBottom: '12px', textAlign: 'left' }}>
                      <p style={{ color: 'var(--accent-amber)', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>AI Tutor not configured</p>
                      <p style={{ color: '#8888aa', fontSize: '12px', lineHeight: 1.5 }}>
                        The AI tutor requires a backend API key. Contact your administrator or set <code style={{ color: '#4fde98', fontSize: '11px' }}>ANTHROPIC_API_KEY</code> in your Netlify environment variables.
                      </p>
                      <p style={{ color: '#555577', fontSize: '11px', marginTop: '6px' }}>All visualizations work without it.</p>
                    </div>
                  ) : (
                    <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '16px' }}>
                      Ask me anything about E&amp;M!
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {STARTER_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #2a2a40',
                          backgroundColor: '#222232',
                          color: '#8888aa',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2a2a40'
                          ;(e.currentTarget as HTMLButtonElement).style.color = '#e8e8f0'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#222232'
                          ;(e.currentTarget as HTMLButtonElement).style.color = '#8888aa'
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                const isLastAssistant =
                  !isUser &&
                  idx === messages.length - 1 &&
                  !isTyping &&
                  msg.content.length > 0

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '86%',
                        padding: '8px 12px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isUser ? 'var(--accent-blue, #4f8ef7)' : '#222232',
                        color: isUser ? '#fff' : 'var(--text-primary, #e8e8f0)',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.content ? (
                        renderContent(msg.content, handleNavigateToViz)
                      ) : (
                        <TypingDots />
                      )}
                    </div>

                    {/* "Tell me more" button on last completed assistant message */}
                    {isLastAssistant && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => handleTellMeMore(msg.content)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '8px',
                          border: '1px solid #2a2a40',
                          backgroundColor: 'transparent',
                          color: '#555577',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'color 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.color = '#8888aa'
                          ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#4a4a60'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.color = '#555577'
                          ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a40'
                        }}
                      >
                        Tell me more →
                      </motion.button>
                    )}
                  </motion.div>
                )
              })}

              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div
              style={{
                padding: '10px 14px 14px',
                borderTop: '1px solid #2a2a40',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask about any E&M concept..."
                  disabled={isTyping}
                  style={{
                    flex: 1,
                    backgroundColor: '#222232',
                    color: 'var(--text-primary, #e8e8f0)',
                    border: '1px solid transparent',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) =>
                    ((e.currentTarget as HTMLInputElement).style.borderColor = 'var(--accent-blue, #4f8ef7)')
                  }
                  onBlur={(e) =>
                    ((e.currentTarget as HTMLInputElement).style.borderColor = 'transparent')
                  }
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isTyping || !input.trim()}
                  title="Send (Enter)"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    border: 'none',
                    backgroundColor: 'var(--accent-blue, #4f8ef7)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: isTyping || !input.trim() ? 0.4 : 1,
                    flexShrink: 0,
                    transition: 'opacity 0.15s, background 0.15s',
                  }}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AITutorPanel
