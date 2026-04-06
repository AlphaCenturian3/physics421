import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

const E_FIELD = 1.0 // normalized field strength
const PLATE_W = 120
const PLATE_H = 80

export default function ElectricFlux({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [angleDeg, setAngleDeg] = useState(0) // angle between surface normal and field (0=max flux)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const theta = (angleDeg * Math.PI) / 180
    const flux = E_FIELD * PLATE_W * PLATE_H * Math.cos(theta) / 4000 // normalized display

    const cx = W / 2, cy = H / 2

    // Draw horizontal field lines (left to right, blue arrows)
    const numLines = 9
    const lineSpacing = H / (numLines + 1)
    for (let i = 1; i <= numLines; i++) {
      const ly = i * lineSpacing
      ctx.strokeStyle = '#3a6fd8'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(30, ly)
      ctx.lineTo(W - 30, ly)
      ctx.stroke()
      // arrowhead every 100px
      for (let ax = 80; ax < W - 40; ax += 100) {
        ctx.fillStyle = '#3a6fd8'
        ctx.beginPath()
        ctx.moveTo(ax + 8, ly)
        ctx.lineTo(ax - 4, ly - 5)
        ctx.lineTo(ax - 4, ly + 5)
        ctx.closePath()
        ctx.fill()
      }
    }

    // Draw "E" label
    ctx.fillStyle = '#3a6fd8'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('E →', 32, 22)

    // Draw surface rectangle — rotated about vertical axis by theta
    // We project the plate: visible width = PLATE_W * cos(theta), height = PLATE_H
    const projW = PLATE_W * Math.abs(Math.cos(theta))
    const projH = PLATE_H

    ctx.save()
    ctx.translate(cx, cy)

    // Surface fill (semi-transparent)
    const alpha = 0.25 + 0.35 * Math.abs(Math.cos(theta))
    ctx.fillStyle = `rgba(120, 200, 255, ${alpha})`
    ctx.strokeStyle = '#7ecfff'
    ctx.lineWidth = 2
    ctx.fillRect(-projW / 2, -projH / 2, projW, projH)
    ctx.strokeRect(-projW / 2, -projH / 2, projW, projH)

    // Normal vector (green arrow)
    const normalAngle = theta // angle of normal from field direction → normal rotates
    // normal points perpendicular to surface; in 2D projection, normal goes "up" when theta=0
    const nLen = 55
    // normal direction in canvas coords: rotated by theta from vertical
    const nnx = Math.sin(theta) * nLen
    const nny = -Math.cos(theta) * nLen

    ctx.strokeStyle = '#4fde98'
    ctx.fillStyle = '#4fde98'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(nnx, nny)
    ctx.stroke()
    // arrowhead
    const headLen = 10
    const headAngle = Math.atan2(nny, nnx)
    ctx.beginPath()
    ctx.moveTo(nnx, nny)
    ctx.lineTo(nnx - headLen * Math.cos(headAngle - 0.4), nny - headLen * Math.sin(headAngle - 0.4))
    ctx.lineTo(nnx - headLen * Math.cos(headAngle + 0.4), nny - headLen * Math.sin(headAngle + 0.4))
    ctx.closePath()
    ctx.fill()

    // "n̂" label
    ctx.fillStyle = '#4fde98'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('n̂', nnx + Math.sign(nnx) * 14, nny - 6)

    ctx.restore()

    // Count field lines that cross the surface
    // Lines at y = i * lineSpacing; surface spans [cy - projH/2, cy + projH/2]
    const surfTop = cy - projH / 2
    const surfBot = cy + projH / 2
    let linesCrossed = 0
    for (let i = 1; i <= numLines; i++) {
      const ly = i * lineSpacing
      if (ly >= surfTop && ly <= surfBot) linesCrossed++
    }

    // Highlight crossing lines (brighter segment through surface)
    if (projW > 2) {
      for (let i = 1; i <= numLines; i++) {
        const ly = i * lineSpacing
        if (ly >= surfTop && ly <= surfBot) {
          ctx.strokeStyle = '#60aaff'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(cx - projW / 2, ly)
          ctx.lineTo(cx + projW / 2, ly)
          ctx.stroke()
        }
      }
    }

    // Theta angle arc indicator
    ctx.strokeStyle = '#f7a94f'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, 38, -Math.PI / 2, -Math.PI / 2 + theta, false)
    ctx.stroke()
    ctx.fillStyle = '#f7a94f'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`θ = ${angleDeg}°`, cx + 42, cy - 14)

    // Flux value
    const fluxDisplay = (Math.cos(theta)).toFixed(3)
    ctx.fillStyle = '#e8e8f0'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`Φ = E·A·cos(θ) = E·A·cos(${angleDeg}°) = ${fluxDisplay} E·A`, cx, H - 18)

    if (angleDeg === 90) {
      ctx.fillStyle = '#f75f5f'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Surface parallel to field — flux = 0', cx, H - 38)
    }
  }, [angleDeg])

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
    return () => { cancelAnimationFrame(animRef.current); resizer.disconnect() }
  }, [isPlaying, speed, draw])

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[65vh]' : 'h-[400px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {!isFocusMode && (
        <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4">
          <label className="text-[#8888aa] text-sm block mb-2">
            Surface Angle θ (from field direction): <span className="text-white font-mono">{angleDeg}°</span>
          </label>
          <input
            type="range" min="0" max="90" step="1" value={angleDeg}
            onChange={e => { setAngleDeg(Number(e.target.value)); onConceptInteract?.('electric-flux') }}
            className="w-full accent-[#4f8ef7]"
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-[#8888aa]">
            <div>
              <div className="text-white font-mono">θ = 0°</div>
              <div>Max flux (surface ⊥ field)</div>
            </div>
            <div>
              <div className="text-white font-mono">θ = 45°</div>
              <div>Half max flux</div>
            </div>
            <div>
              <div className="text-[#f75f5f] font-mono">θ = 90°</div>
              <div>Zero flux (surface ∥ field)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
