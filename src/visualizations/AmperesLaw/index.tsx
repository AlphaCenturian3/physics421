import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

type Geometry = 'wire' | 'solenoid' | 'toroid'

export default function AmperesLaw({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [geometry, setGeometry] = useState<Geometry>('wire')
  const [loopRadius, setLoopRadius] = useState(100)
  const [current, setCurrent] = useState(2)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2
    const phase = t * 0.008 * speed

    if (geometry === 'wire') {
      // Wire cross-section
      const wireR = 20
      ctx.fillStyle = '#f7a94f'
      ctx.beginPath()
      ctx.arc(cx, cy, wireR, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f0f14'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('·', cx, cy) // current out of page
      ctx.textBaseline = 'alphabetic'

      ctx.fillStyle = '#f7a94f'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`I = ${current} A (out)`, cx, cy + 36)

      // Amperian loop
      ctx.save()
      ctx.setLineDash([7, 5])
      ctx.strokeStyle = '#60c8ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, loopRadius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // Animated B arrows along loop
      const numArrows = 12
      for (let i = 0; i < numArrows; i++) {
        const ang = ((i / numArrows) + phase * 0.5) % 1 * Math.PI * 2
        const ax = cx + loopRadius * Math.cos(ang)
        const ay = cy + loopRadius * Math.sin(ang)
        // Tangent direction (CCW for current out of page)
        const tx = -Math.sin(ang), ty = Math.cos(ang)
        ctx.fillStyle = 'rgba(100,180,255,0.85)'
        ctx.beginPath()
        ctx.moveTo(ax + tx * 7, ay + ty * 7)
        ctx.lineTo(ax - tx * 7 + ty * 4, ay - ty * 7 - tx * 4)
        ctx.lineTo(ax - tx * 7 - ty * 4, ay - ty * 7 + tx * 4)
        ctx.closePath()
        ctx.fill()
      }

      const B = (4e-7 * Math.PI * current) / (2 * Math.PI * loopRadius / 100)
      ctx.fillStyle = '#60c8ff'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`Amperian loop r = ${(loopRadius / 100).toFixed(2)} m`, cx, cy - loopRadius - 14)

      ctx.fillStyle = '#e8e8f0'
      ctx.font = '13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`∮ B·dl = μ₀·I_enc = μ₀·${current}A`, cx, H - 38)
      ctx.fillText(`B·2πr = μ₀I  →  B = ${(B * 1e6).toFixed(2)} μT`, cx, H - 14)

    } else if (geometry === 'solenoid') {
      const sL = cx - 160, sR = cx + 160, sT = cy - 55, sB = cy + 55
      const nTurns = 14

      // Coil
      for (let i = 0; i < nTurns; i++) {
        const x = sL + (i + 0.5) * ((sR - sL) / nTurns)
        ctx.strokeStyle = '#f7a94f'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(x, cy, 5, 55, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Ideal Amperian rectangle inside
      ctx.save()
      ctx.setLineDash([7, 5])
      ctx.strokeStyle = '#60c8ff'
      ctx.lineWidth = 2
      const rw = 180, rh = 36
      ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh)
      ctx.restore()

      // Uniform B inside (arrows)
      const nB = 6
      for (let i = 0; i < nB; i++) {
        const bx = sL + 20 + ((i / nB + phase * 0.3) % 1) * (sR - sL - 40)
        ctx.fillStyle = '#60c8ff'
        ctx.beginPath()
        ctx.moveTo(bx + 10, cy)
        ctx.lineTo(bx - 4, cy - 5)
        ctx.lineTo(bx - 4, cy + 5)
        ctx.closePath()
        ctx.fill()
      }

      ctx.fillStyle = '#60c8ff'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Amperian rectangle', cx, cy - rh / 2 - 8)
      ctx.fillText('B ≈ 0 outside', cx, sT - 14)

      const n = nTurns / ((sR - sL) / 100)
      const B = 4e-7 * Math.PI * n * current
      ctx.fillStyle = '#e8e8f0'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`B·L = μ₀·n·L·I  →  B = μ₀nI = ${(B * 1e6).toFixed(1)} μT`, cx, H - 14)

    } else {
      // Toroid
      const toroidR = 100, toroidr = 30
      const nTurns = 20

      // Draw toroid cross-section (two circles)
      ctx.strokeStyle = '#f7a94faa'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, toroidR + toroidr, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, toroidR - toroidr, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#f7a94f11'
      ctx.beginPath()
      ctx.arc(cx, cy, toroidR + toroidr, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f0f14'
      ctx.beginPath()
      ctx.arc(cx, cy, toroidR - toroidr, 0, Math.PI * 2)
      ctx.fill()

      // Coil turns around toroid
      for (let i = 0; i < nTurns; i++) {
        const ang = (i / nTurns) * Math.PI * 2
        const tx = cx + toroidR * Math.cos(ang), ty2 = cy + toroidR * Math.sin(ang)
        ctx.strokeStyle = '#f7a94f'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(tx, ty2, toroidr * 0.7, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Amperian loops
      // Inside (captures current)
      ctx.save()
      ctx.setLineDash([6, 5])
      ctx.strokeStyle = '#60c8ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, toroidR, 0, Math.PI * 2)
      ctx.stroke()
      // Outside (no current enclosed)
      ctx.strokeStyle = '#333355'
      ctx.beginPath()
      ctx.arc(cx, cy, toroidR + toroidr + 20, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // B arrows circling inside toroid
      const numBArrows = 10
      for (let i = 0; i < numBArrows; i++) {
        const ang = ((i / numBArrows) + phase * 0.4) % 1 * Math.PI * 2
        const bx = cx + toroidR * Math.cos(ang), by2 = cy + toroidR * Math.sin(ang)
        const tx = -Math.sin(ang), ty3 = Math.cos(ang)
        ctx.fillStyle = 'rgba(100,180,255,0.9)'
        ctx.beginPath()
        ctx.moveTo(bx + tx * 7, by2 + ty3 * 7)
        ctx.lineTo(bx - tx * 7 + ty3 * 4, by2 - ty3 * 7 - tx * 4)
        ctx.lineTo(bx - tx * 7 - ty3 * 4, by2 - ty3 * 7 + tx * 4)
        ctx.closePath()
        ctx.fill()
      }

      ctx.fillStyle = '#60c8ff'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Amperian loop (inside)', cx, cy - toroidR + 12)
      ctx.fillStyle = '#333355'
      ctx.fillText('B = 0 outside', cx, cy - toroidR - toroidr - 24)

      const B = (4e-7 * Math.PI * nTurns * current) / (2 * Math.PI * toroidR / 100)
      ctx.fillStyle = '#e8e8f0'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`B = μ₀NI/(2πR) = ${(B * 1e6).toFixed(2)} μT  (inside only)`, cx, H - 14)
    }

    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('∮ B·dl = μ₀ I_enc', 12, 20)
  }, [geometry, loopRadius, current, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth || 600
    canvas.height = canvas.offsetHeight || 430
    const resizer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth || 600
      canvas.height = canvas.offsetHeight || 430
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
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[68vh]' : 'h-[410px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      {!isFocusMode && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {(['wire', 'solenoid', 'toroid'] as Geometry[]).map(g => (
              <button key={g} onClick={() => { setGeometry(g); onConceptInteract?.('amperes-law') }}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${geometry === g ? 'bg-[#60c8ff] text-[#0f0f14]' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}>
                {g === 'wire' ? 'Long Wire' : g === 'solenoid' ? 'Solenoid' : 'Toroid'}
              </button>
            ))}
          </div>
          <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[#8888aa] text-sm block mb-1">I_enc: <span className="text-white font-mono">{current} A</span></label>
              <input type="range" min="1" max="10" step="1" value={current}
                onChange={e => setCurrent(Number(e.target.value))} className="w-full accent-[#f7a94f]" />
            </div>
            {geometry === 'wire' && (
              <div>
                <label className="text-[#8888aa] text-sm block mb-1">Loop r: <span className="text-white font-mono">{(loopRadius / 100).toFixed(2)} m</span></label>
                <input type="range" min="30" max="160" step="5" value={loopRadius}
                  onChange={e => setLoopRadius(Number(e.target.value))} className="w-full accent-[#60c8ff]" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
