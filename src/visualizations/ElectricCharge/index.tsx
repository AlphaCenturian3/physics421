import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

const K = 8.99e9

export default function ElectricCharge({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [q1, setQ1] = useState(2)
  const [q2, setQ2] = useState(-2)
  const [dist, setDist] = useState(200)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2
    const cy = H / 2
    const x1 = cx - dist / 2
    const x2 = cx + dist / 2

    const r = Math.max(dist / 100, 0.1)
    const F = Math.abs(K * q1 * q2) / (r * r)
    const Fnorm = Math.min(F / 1e9, 100)
    const arrowLen = 20 + Fnorm * 0.8
    const attractive = q1 * q2 < 0

    // Distance dashed line
    ctx.strokeStyle = '#2a2a40'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(x1, cy)
    ctx.lineTo(x2, cy)
    ctx.stroke()
    ctx.setLineDash([])

    // Labels
    ctx.fillStyle = '#555577'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`r = ${(dist / 100).toFixed(2)} m`, cx, cy - 20)

    const arrowColor = attractive ? '#f7a94f' : '#4fde98'
    const label = attractive ? 'attraction' : 'repulsion'

    const drawArrow = (fromX: number, toX: number) => {
      ctx.strokeStyle = arrowColor
      ctx.fillStyle = arrowColor
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(fromX, cy)
      ctx.lineTo(toX, cy)
      ctx.stroke()
      const dir = toX > fromX ? 1 : -1
      ctx.beginPath()
      ctx.moveTo(toX, cy)
      ctx.lineTo(toX - dir * 10, cy - 5)
      ctx.lineTo(toX - dir * 10, cy + 5)
      ctx.closePath()
      ctx.fill()
    }

    if (attractive) {
      drawArrow(x1 - 24, x1 + arrowLen)
      drawArrow(x2 + 24, x2 - arrowLen)
    } else {
      drawArrow(x1 + 24, x1 - arrowLen)
      drawArrow(x2 - 24, x2 + arrowLen)
    }

    ctx.fillStyle = arrowColor
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, cx, cy + 48)

    ctx.fillStyle = '#8888aa'
    ctx.font = '13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`F = ${Fnorm.toFixed(2)} N`, cx, cy + 70)

    const drawCharge = (x: number, q: number) => {
      const color = q > 0 ? '#4f8ef7' : '#f75f5f'
      const pulse = 1 + 0.06 * Math.sin(t * 0.05)
      const radius = 22 * pulse

      const glow = ctx.createRadialGradient(x, cy, 0, x, cy, radius * 2.2)
      glow.addColorStop(0, color + 'aa')
      glow.addColorStop(1, color + '00')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(x, cy, radius * 2.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(q > 0 ? '+' : '−', x, cy)
      ctx.textBaseline = 'alphabetic'

      ctx.fillStyle = '#ccccdd'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${q > 0 ? '+' : ''}${q.toFixed(1)} C`, x, cy + 40)
    }

    drawCharge(x1, q1)
    drawCharge(x2, q2)
  }, [q1, q2, dist])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth || 600
    canvas.height = canvas.offsetHeight || 400

    const resizer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth || 600
      canvas.height = canvas.offsetHeight || 400
    })
    resizer.observe(canvas)

    const loop = () => {
      if (isPlaying) timeRef.current += speed
      draw(timeRef.current)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      resizer.disconnect()
    }
  }, [isPlaying, speed, draw])

  const handleQ1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setQ1(v)
    onConceptInteract?.('coulombs-law')
  }

  const handleQ2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setQ2(v)
    onConceptInteract?.('coulombs-law')
  }

  const handleDistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDist(Number(e.target.value))
    onConceptInteract?.('inverse-square-law')
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[70vh]' : 'h-[400px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {!isFocusMode && (
        <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4 space-y-4">
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Charge q₁: {q1 >= 0 ? '+' : ''}{q1.toFixed(1)} C
              <span className="ml-2 text-xs" style={{ color: q1 >= 0 ? '#4f8ef7' : '#f75f5f' }}>
                {q1 >= 0 ? '(positive)' : '(negative)'}
              </span>
            </label>
            <input
              type="range" min="-5" max="5" step="0.5" value={q1}
              onChange={handleQ1Change}
              className="w-full accent-[#4f8ef7]"
            />
          </div>
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Charge q₂: {q2 >= 0 ? '+' : ''}{q2.toFixed(1)} C
              <span className="ml-2 text-xs" style={{ color: q2 >= 0 ? '#4f8ef7' : '#f75f5f' }}>
                {q2 >= 0 ? '(positive)' : '(negative)'}
              </span>
            </label>
            <input
              type="range" min="-5" max="5" step="0.5" value={q2}
              onChange={handleQ2Change}
              className="w-full accent-[#4f8ef7]"
            />
          </div>
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Separation: {(dist / 100).toFixed(2)} m
            </label>
            <input
              type="range" min="50" max="300" step="5" value={dist}
              onChange={handleDistChange}
              className="w-full accent-[#f7a94f]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
