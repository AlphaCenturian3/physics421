import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

interface MathProps {
  children: string
  block?: boolean
  style?: React.CSSProperties
}

export function MathInline({ children, style }: { children: string; style?: React.CSSProperties }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, { throwOnError: false, displayMode: false })
    } catch {
      return children
    }
  }, [children])

  return (
    <span
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function MathBlock({ children, style }: { children: string; style?: React.CSSProperties }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, { throwOnError: false, displayMode: true })
    } catch {
      return children
    }
  }, [children])

  return (
    <div
      style={{ overflowX: 'auto', margin: '0.75rem 0', ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// Renders a string that may contain inline math delimited by $...$
// and display math delimited by $$...$$
export function MathText({ children }: { children: string }) {
  const parts = useMemo(() => {
    const result: Array<{ type: 'text' | 'inline' | 'block'; content: string }> = []
    let remaining = children

    // First split on $$...$$
    const blockPattern = /\$\$([\s\S]+?)\$\$/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    const segments: Array<{ start: number; end: number; content: string; isBlock: boolean }> = []

    while ((match = blockPattern.exec(remaining)) !== null) {
      segments.push({ start: match.index, end: match.index + match[0].length, content: match[1], isBlock: true })
    }

    // Then split on $...$
    const inlinePattern = /\$([^$\n]+?)\$/g
    while ((match = inlinePattern.exec(remaining)) !== null) {
      // Skip if overlaps with a block segment
      const overlaps = segments.some(s => match!.index >= s.start && match!.index < s.end)
      if (!overlaps) {
        segments.push({ start: match.index, end: match.index + match[0].length, content: match[1], isBlock: false })
      }
    }

    // Sort by start position
    segments.sort((a, b) => a.start - b.start)

    lastIndex = 0
    for (const seg of segments) {
      if (seg.start > lastIndex) {
        result.push({ type: 'text', content: remaining.slice(lastIndex, seg.start) })
      }
      result.push({ type: seg.isBlock ? 'block' : 'inline', content: seg.content })
      lastIndex = seg.end
    }
    if (lastIndex < remaining.length) {
      result.push({ type: 'text', content: remaining.slice(lastIndex) })
    }

    return result.length > 0 ? result : [{ type: 'text' as const, content: remaining }]
  }, [children])

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text') return <span key={i}>{part.content}</span>
        if (part.type === 'block') return <MathBlock key={i}>{part.content}</MathBlock>
        return <MathInline key={i}>{part.content}</MathInline>
      })}
    </>
  )
}

export default MathText
