import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

const EPS0 = 8.854e-12

export default function Capacitors({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [separation, setSeparation] = useState(80) // px
  const [plateArea, setPlateArea] = useState(200)  // px (half-width of plate)
  const [dielectric, setDielectric] = useState(false)
  const kappa = dielectric ? 4.5 : 1.0

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2
    const cy = H / 2
    const plateW = plateArea
    const plateH = 12
    const topY = cy - separation / 2
    const botY = cy + separation / 2

    // Dielectric fill (between plates)
    if (dielectric) {
      ctx.fillStyle = 'rgba(180,120,255,0.18)'
      ctx.strokeStyle = 'rgba(180,120,255,0.45)'
      ctx.lineWidth = 1
      ctx.fillRect(cx - plateW / 2, topY + plateH, plateW, separation - plateH * 2)
      ctx.strokeRect(cx - plateW / 2, topY + plateH, plateW, separation - plateH * 2)
      ctx.fillStyle = 'rgba(180,120,255,0.6)'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('dielectric  κ = 4.5', cx, cy)
    }

    // Top plate (+)
    ctx.fillStyle = '#4f8ef7'
    ctx.fillRect(cx - plateW / 2, topY, plateW, plateH)
    // Bottom plate (-)
    ctx.fillStyle = '#f75f5f'
    ctx.fillRect(cx - plateW / 2, botY - plateH, plateW, plateH)

    // Animated charge symbols appearing from edges
    const numCharges = Math.floor(plateW / 28)
    const phase = (t * 0.03 * speed) % 1
    for (let i = 0; i < numCharges; i++) {
      const progress = (i / numCharges + phase) % 1
      const cx2 = cx - plateW / 2 + progress * plateW

      // Top plate + symbols
      ctx.fillStyle = `rgba(200,230,255,${0.5 + 0.5 * Math.sin(t * 0.04 + i * 0.8)})`
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', cx2, topY + plateH / 2)

      // Bottom plate − symbols
      ctx.fillStyle = `rgba(255,180,180,${0.5 + 0.5 * Math.sin(t * 0.04 + i * 0.8)})`
      ctx.fillText('−', cx2, botY - plateH / 2)
      ctx.textBaseline = 'alphabetic'
    }

    // E-field lines between plates (vertical arrows, fewer when dielectric)
    const fieldAlpha = dielectric ? 0.4 : 0.8
    const numField = dielectric ? 4 : 7
    const fieldSpacing = plateW / (numField + 1)
    for (let i = 1; i <= numField; i++) {
      const fx = cx - plateW / 2 + i * fieldSpacing
      const fieldLen = separation - plateH * 2 - 8
      const startY = topY + plateH + 4
      const endY = startY + fieldLen

      ctx.strokeStyle = `rgba(100,160,255,${fieldAlpha})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(fx, startY)
      ctx.lineTo(fx, endY)
      ctx.stroke()

      // arrowhead
      ctx.fillStyle = `rgba(100,160,255,${fieldAlpha})`
      ctx.beginPath()
      ctx.moveTo(fx, endY)
      ctx.lineTo(fx - 5, endY - 8)
      ctx.lineTo(fx + 5, endY - 8)
      ctx.closePath()
      ctx.fill()
    }

    // Capacitance values
    const A = (plateArea / 200) * 0.04 // ~0.04 m² at max slider
    const d = separation / 100 // m
    const C = kappa * EPS0 * A / d
    const V0 = 12 // assumed voltage in volts
    const Q = C * V0
    const E = V0 / d

    ctx.fillStyle = '#e8e8f0'
    ctx.font = '13px monospace'
    ctx.textAlign = 'left'
    const infoX = cx + plateW / 2 + 20
    ctx.fillText(`C = ${dielectric ? 'κ·' : ''}ε₀A/d`, infoX, cy - 50)
    ctx.fillStyle = '#4f8ef7'
    ctx.fillText(`  = ${(C * 1e12).toFixed(2)} pF`, infoX, cy - 30)
    ctx.fillStyle = '#8888aa'
    ctx.font = '12px monospace'
    ctx.fillText(`Q = ${(Q * 1e12).toFixed(2)} pC`, infoX, cy - 6)
    ctx.fillText(`E = ${(E).toFixed(1)} V/m`, infoX, cy + 16)
    if (dielectric) {
      ctx.fillStyle = '#bb88ff'
      ctx.fillText(`κ = 4.5`, infoX, cy + 40)
    }

    // Plate labels
    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('+V', cx - plateW / 2 - 8, topY + plateH / 2 + 4)
    ctx.fillText('−V', cx - plateW / 2 - 8, botY - plateH / 2 + 4)
    ctx.textAlign = 'left'
  }, [separation, plateArea, dielectric, kappa])

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
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[65vh]' : 'h-[380px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {!isFocusMode && (
        <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4 space-y-4">
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Plate Separation d: <span className="text-white font-mono">{(separation / 100).toFixed(2)} m</span>
            </label>
            <input
              type="range" min="40" max="160" step="4" value={separation}
              onChange={e => { setSeparation(Number(e.target.value)); onConceptInteract?.('capacitance') }}
              className="w-full accent-[#4f8ef7]"
            />
          </div>
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Plate Area A: <span className="text-white font-mono">{((plateArea / 200) * 0.04 * 1e4).toFixed(1)} cm²</span>
            </label>
            <input
              type="range" min="80" max="260" step="10" value={plateArea}
              onChange={e => { setPlateArea(Number(e.target.value)); onConceptInteract?.('capacitance') }}
              className="w-full accent-[#4f8ef7]"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setDielectric(v => !v); onConceptInteract?.('dielectric') }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${dielectric ? 'bg-[#bb88ff] text-[#0f0f14]' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}
            >
              Dielectric {dielectric ? 'ON (κ=4.5)' : 'OFF'}
            </button>
            <span className="text-[#8888aa] text-xs">
              {dielectric ? 'Field weakens, capacitance increases' : 'Vacuum between plates'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
