import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

type Geometry = 'sphere' | 'cylinder' | 'plane'

export default function GaussLaw({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [geometry, setGeometry] = useState<Geometry>('sphere')
  const [surfaceRadius, setSurfaceRadius] = useState(80)

  const drawSphere = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number, t: number, radius: number) => {
    const cx = W / 2, cy = H / 2 - 20
    const numLines = 12
    const chargeQ = 3.0 // μC

    // Pulsing charge at center
    const pulse = 1 + 0.08 * Math.sin(t * 0.06)
    const chargeR = 14 * pulse
    const cglow = ctx.createRadialGradient(cx, cy, 0, cx, cy, chargeR * 2.5)
    cglow.addColorStop(0, '#4f8ef7aa')
    cglow.addColorStop(1, '#4f8ef700')
    ctx.fillStyle = cglow
    ctx.beginPath()
    ctx.arc(cx, cy, chargeR * 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#4f8ef7'
    ctx.beginPath()
    ctx.arc(cx, cy, chargeR, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('+', cx, cy)
    ctx.textBaseline = 'alphabetic'

    // Field lines from charge
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2
      const startR = chargeR + 4
      const endR = Math.min(radius - 4, 180)
      if (endR <= startR) continue
      ctx.strokeStyle = 'rgba(100,160,255,0.6)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(cx + startR * Math.cos(angle), cy + startR * Math.sin(angle))
      ctx.lineTo(cx + endR * Math.cos(angle), cy + endR * Math.sin(angle))
      ctx.stroke()
      // arrowhead at end
      const ax = cx + endR * Math.cos(angle)
      const ay = cy + endR * Math.sin(angle)
      ctx.fillStyle = 'rgba(100,160,255,0.8)'
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(ax - 8 * Math.cos(angle - 0.35), ay - 8 * Math.sin(angle - 0.35))
      ctx.lineTo(ax - 8 * Math.cos(angle + 0.35), ay - 8 * Math.sin(angle + 0.35))
      ctx.closePath()
      ctx.fill()
    }

    // Gaussian surface (dashed circle)
    ctx.save()
    ctx.setLineDash([6, 5])
    ctx.strokeStyle = '#60c8ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // Label radius
    ctx.fillStyle = '#60c8ff'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    const labelAngle = Math.PI / 4
    ctx.fillText(`r = ${(radius / 80).toFixed(2)} m`, cx + radius * Math.cos(labelAngle) + 6, cy + radius * Math.sin(labelAngle) - 4)

    // Info panel
    const enclosedQ = chargeQ // all charge inside
    const flux = enclosedQ / 8.85e-12 * 1e-6 // Q/ε₀ in SI, shown normalized
    ctx.fillStyle = '#e8e8f0'
    ctx.font = '13px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`Q_enc = ${enclosedQ.toFixed(1)} μC`, 20, H - 55)
    ctx.fillText(`Φ = Q_enc / ε₀ = ${(enclosedQ * 0.113).toFixed(2)} × 10⁶ N·m²/C`, 20, H - 33)
    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.fillText('(Gaussian surface: dashed circle)', 20, H - 12)
  }, [])

  const drawCylinder = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number, t: number, radius: number) => {
    const cx = W / 2, cy = H / 2 - 10
    const wireY1 = 60, wireY2 = H - 80
    const numRings = 5

    // Infinite wire (central line)
    ctx.strokeStyle = '#f7a94f'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx, wireY1)
    ctx.lineTo(cx, wireY2)
    ctx.stroke()

    // + symbols along wire
    for (let i = 0; i < 6; i++) {
      const y = wireY1 + (wireY2 - wireY1) * (i / 5)
      ctx.fillStyle = '#f7a94f'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', cx, y)
      ctx.textBaseline = 'alphabetic'
    }

    // Radial field lines at a few heights
    const fieldHeights = [wireY1 + 60, cy, wireY2 - 60]
    for (const fy of fieldHeights) {
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2
        ctx.strokeStyle = 'rgba(100,160,255,0.5)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(cx + 8 * Math.cos(angle), fy + 8 * Math.sin(angle))
        ctx.lineTo(cx + (radius - 4) * Math.cos(angle), fy + (radius - 4) * Math.sin(angle))
        ctx.stroke()
        const ax = cx + (radius - 4) * Math.cos(angle)
        const ay = fy + (radius - 4) * Math.sin(angle)
        ctx.fillStyle = 'rgba(100,160,255,0.7)'
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax - 7 * Math.cos(angle - 0.4), ay - 7 * Math.sin(angle - 0.4))
        ctx.lineTo(ax - 7 * Math.cos(angle + 0.4), ay - 7 * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fill()
      }
    }

    // Gaussian cylinder outline (dashed ellipse for top/bottom caps)
    ctx.save()
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = '#60c8ff'
    ctx.lineWidth = 2
    // Left and right sides of cylinder
    ctx.beginPath()
    ctx.moveTo(cx - radius, wireY1 + 30)
    ctx.lineTo(cx - radius, wireY2 - 30)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + radius, wireY1 + 30)
    ctx.lineTo(cx + radius, wireY2 - 30)
    ctx.stroke()
    // Top ellipse
    ctx.beginPath()
    ctx.ellipse(cx, wireY1 + 30, radius, 18, 0, 0, Math.PI * 2)
    ctx.stroke()
    // Bottom ellipse
    ctx.beginPath()
    ctx.ellipse(cx, wireY2 - 30, radius, 18, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#e8e8f0'
    ctx.font = '13px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`r = ${(radius / 80).toFixed(2)} m`, 20, H - 55)
    ctx.fillText('B·2πr·L = μ₀·I_enc  (Ampère analog)', 20, H - 33)
    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.fillText('Cylindrical symmetry → field is purely radial', 20, H - 12)
  }, [])

  const drawPlane = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => {
    const cy = H / 2

    // Infinite plane (horizontal band)
    const grad = ctx.createLinearGradient(0, cy - 12, 0, cy + 12)
    grad.addColorStop(0, '#f7a94f55')
    grad.addColorStop(0.5, '#f7a94fcc')
    grad.addColorStop(1, '#f7a94f55')
    ctx.fillStyle = grad
    ctx.fillRect(0, cy - 10, W, 20)

    ctx.strokeStyle = '#f7a94f'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, cy - 10)
    ctx.lineTo(W, cy - 10)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, cy + 10)
    ctx.lineTo(W, cy + 10)
    ctx.stroke()

    // + charge symbols
    for (let x = 40; x < W; x += 60) {
      ctx.fillStyle = '#f7a94f'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', x, cy)
      ctx.textBaseline = 'alphabetic'
    }

    // Field lines going up and down
    const numLines = 8
    const spacing = W / (numLines + 1)
    for (let i = 1; i <= numLines; i++) {
      const x = i * spacing
      // Upward arrows
      ctx.strokeStyle = 'rgba(100,160,255,0.7)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x, cy - 12)
      ctx.lineTo(x, 30)
      ctx.stroke()
      ctx.fillStyle = 'rgba(100,160,255,0.8)'
      ctx.beginPath()
      ctx.moveTo(x, 30)
      ctx.lineTo(x - 5, 44)
      ctx.lineTo(x + 5, 44)
      ctx.closePath()
      ctx.fill()

      // Downward arrows
      ctx.strokeStyle = 'rgba(100,160,255,0.7)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x, cy + 12)
      ctx.lineTo(x, H - 80)
      ctx.stroke()
      ctx.fillStyle = 'rgba(100,160,255,0.8)'
      ctx.beginPath()
      ctx.moveTo(x, H - 80)
      ctx.lineTo(x - 5, H - 94)
      ctx.lineTo(x + 5, H - 94)
      ctx.closePath()
      ctx.fill()
    }

    // Gaussian pillbox (dashed rectangle)
    const bw = 100, bh = 80
    const bx = W / 2 - bw / 2, by = cy - bh / 2
    ctx.save()
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = '#60c8ff'
    ctx.lineWidth = 2
    ctx.strokeRect(bx, by, bw, bh)
    ctx.restore()

    ctx.fillStyle = '#60c8ff'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Gaussian pillbox', W / 2, cy - bh / 2 - 8)

    ctx.fillStyle = '#e8e8f0'
    ctx.font = '13px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('E = σ / (2ε₀)  (perpendicular to plane)', 20, H - 33)
    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.fillText('Flux only through top & bottom caps; sides contribute zero.', 20, H - 12)
  }, [])

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    // Title
    ctx.fillStyle = '#8888aa'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Geometry: ${geometry}`, W / 2, 22)

    if (geometry === 'sphere') drawSphere(ctx, W, H, t, surfaceRadius)
    else if (geometry === 'cylinder') drawCylinder(ctx, W, H, t, surfaceRadius)
    else drawPlane(ctx, W, H, t)
  }, [geometry, surfaceRadius, drawSphere, drawCylinder, drawPlane])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth || 600
    canvas.height = canvas.offsetHeight || 450
    const resizer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth || 600
      canvas.height = canvas.offsetHeight || 450
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

  const geometries: Geometry[] = ['sphere', 'cylinder', 'plane']

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[70vh]' : 'h-[420px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {!isFocusMode && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {geometries.map(g => (
              <button
                key={g}
                onClick={() => { setGeometry(g); onConceptInteract?.('gauss-law') }}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${geometry === g ? 'bg-[#4f8ef7] text-white' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}
              >
                {g}
              </button>
            ))}
          </div>
          {geometry !== 'plane' && (
            <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4">
              <label className="text-[#8888aa] text-sm block mb-2">
                Gaussian Surface Radius: <span className="text-white font-mono">{(surfaceRadius / 80).toFixed(2)} m</span>
              </label>
              <input
                type="range" min="40" max="160" step="4" value={surfaceRadius}
                onChange={e => setSurfaceRadius(Number(e.target.value))}
                className="w-full accent-[#60c8ff]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
