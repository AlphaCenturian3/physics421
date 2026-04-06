import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

type Source = 'dipole' | 'wire' | 'loop'

export default function MagneticFields({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [source, setSource] = useState<Source>('dipole')

  // Returns B-field vector at point (px,py) for dipole centered at (cx,cy)
  const getDipoleField = (px: number, py: number, cx: number, cy: number) => {
    const dx = px - cx, dy = py - cy
    const r2 = dx * dx + dy * dy
    if (r2 < 100) return { bx: 0, by: 0 }
    const r = Math.sqrt(r2)
    const r5 = r2 * r2 * r
    // Dipole moment along y-axis (m_y = 1)
    const my = 1
    const bx = 3 * dy * my * dx / r5
    const by = (3 * dy * my * dy / r5) - my / (r2 * r)
    return { bx: bx * 1e4, by: by * 1e4 }
  }

  const getWireField = (px: number, py: number, cx: number, cy: number) => {
    const dx = px - cx, dy = py - cy
    const r2 = dx * dx + dy * dy
    if (r2 < 100) return { bx: 0, by: 0 }
    const r = Math.sqrt(r2)
    // B circles around wire (z-axis current → B = μ₀I/(2πr) in phi direction)
    // phi direction: (-dy/r, dx/r)
    const mag = 200 / r
    return { bx: -dy / r * mag, by: dx / r * mag }
  }

  const getLoopField = (px: number, py: number, cx: number, cy: number) => {
    // Approximate on-axis + off-axis as dipole for simplicity
    return getDipoleField(px, py, cx, cy)
  }

  const drawFieldLines = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => {
    const cx = W / 2, cy = H / 2
    const getField = source === 'dipole' ? getDipoleField : source === 'wire' ? getWireField : getLoopField

    if (source === 'dipole' || source === 'loop') {
      // Field line seeds (starting near north pole)
      const seeds = 14
      for (let i = 0; i < seeds; i++) {
        const startAngle = (i / seeds) * Math.PI * 2
        const r0 = source === 'loop' ? 35 : 20
        let x = cx + r0 * Math.cos(startAngle)
        let y = cy + r0 * Math.sin(startAngle)

        ctx.beginPath()
        ctx.moveTo(x, y)
        for (let step = 0; step < 400; step++) {
          const { bx, by } = getField(x, y, cx, cy)
          const mag = Math.hypot(bx, by)
          if (mag < 0.01) break
          const nx = bx / mag, ny = by / mag
          x += nx * 3
          y += ny * 3
          if (x < 0 || x > W || y < 0 || y > H) break
          ctx.lineTo(x, y)
        }
        const hue = 200 + (i / seeds) * 60
        ctx.strokeStyle = `hsla(${hue},80%,65%,0.55)`
        ctx.lineWidth = 1.2
        ctx.stroke()
      }
    } else {
      // Wire: concentric rings with animation
      const numRings = 6
      for (let ri = 1; ri <= numRings; ri++) {
        const r = ri * 40
        const segments = 60
        ctx.beginPath()
        for (let si = 0; si <= segments; si++) {
          const angle = (si / segments) * Math.PI * 2
          ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
        }
        ctx.strokeStyle = `rgba(100,160,255,${0.6 - ri * 0.08})`
        ctx.lineWidth = 1.5
        ctx.stroke()
        // Animated arrows along ring
        const numArrows = 4
        for (let ai = 0; ai < numArrows; ai++) {
          const ang = ((ai / numArrows) + t * 0.0008 * speed) % 1 * Math.PI * 2
          const ax = cx + r * Math.cos(ang)
          const ay = cy + r * Math.sin(ang)
          const tx = -Math.sin(ang), ty = Math.cos(ang) // tangent (CCW)
          ctx.fillStyle = `rgba(100,160,255,0.8)`
          ctx.beginPath()
          ctx.moveTo(ax + tx * 6, ay + ty * 6)
          ctx.lineTo(ax - tx * 6 + ty * 4, ay - ty * 6 - tx * 4)
          ctx.lineTo(ax - tx * 6 - ty * 4, ay - ty * 6 + tx * 4)
          ctx.closePath()
          ctx.fill()
        }
      }
    }
  }, [source])

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2

    drawFieldLines(ctx, W, H, t)

    // Draw source
    if (source === 'dipole') {
      // Bar magnet
      ctx.fillStyle = '#4f8ef7'
      ctx.fillRect(cx - 10, cy - 50, 20, 50) // N pole (blue)
      ctx.fillStyle = '#f75f5f'
      ctx.fillRect(cx - 10, cy, 20, 50)       // S pole (red)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N', cx, cy - 25)
      ctx.fillText('S', cx, cy + 25)
      ctx.textBaseline = 'alphabetic'
    } else if (source === 'wire') {
      // Wire cross-section (dot = current out of page)
      ctx.fillStyle = '#f7a94f'
      ctx.beginPath()
      ctx.arc(cx, cy, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f0f14'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('·', cx, cy)
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = '#f7a94f'
      ctx.font = '11px sans-serif'
      ctx.fillText('I (out)', cx, cy + 28)
    } else {
      // Current loop (circle)
      ctx.strokeStyle = '#f7a94f'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(cx, cy, 32, 0, Math.PI * 2)
      ctx.stroke()
      // Arrow on loop
      const ang = t * 0.02 * speed % (Math.PI * 2)
      const lx = cx + 32 * Math.cos(ang), ly = cy + 32 * Math.sin(ang)
      const tx = -Math.sin(ang), ty = Math.cos(ang)
      ctx.fillStyle = '#f7a94f'
      ctx.beginPath()
      ctx.moveTo(lx + tx * 7, ly + ty * 7)
      ctx.lineTo(lx - tx * 7 + ty * 5, ly - ty * 7 - tx * 5)
      ctx.lineTo(lx - tx * 7 - ty * 5, ly - ty * 7 + tx * 5)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#f7a94f'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Current Loop', cx, cy + 52)
    }

    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('B-field lines form closed loops (∇·B = 0)', 14, H - 12)
  }, [source, drawFieldLines, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth || 600
    canvas.height = canvas.offsetHeight || 420
    const resizer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth || 600
      canvas.height = canvas.offsetHeight || 420
    })
    resizer.observe(canvas)
    const loop = () => {
      if (isPlaying) timeRef.current += speed
      draw(timeRef.current)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(animRef.current); resizer.disconnect() }
  }, [isPlaying, speed, draw])

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[70vh]' : 'h-[400px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      {!isFocusMode && (
        <div className="flex gap-3">
          {(['dipole', 'wire', 'loop'] as Source[]).map(s => (
            <button key={s} onClick={() => { setSource(s); onConceptInteract?.('magnetic-fields') }}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${source === s ? 'bg-[#4f8ef7] text-white' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}>
              {s === 'dipole' ? 'Bar Magnet' : s === 'wire' ? 'Infinite Wire' : 'Current Loop'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
