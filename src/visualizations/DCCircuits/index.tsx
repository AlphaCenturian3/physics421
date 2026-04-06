import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

type Mode = 'series' | 'parallel'

export default function DCCircuits({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [mode, setMode] = useState<Mode>('series')
  const [r1, setR1] = useState(30)
  const [r2, setR2] = useState(60)
  const V_SOURCE = 12

  const drawResistor = (ctx: CanvasRenderingContext2D, x: number, y: number, vertical = false) => {
    const w = 38, h = 16
    ctx.fillStyle = '#1a1a2a'
    ctx.strokeStyle = '#f7a94f'
    ctx.lineWidth = 1.5
    if (vertical) {
      ctx.fillRect(x - h / 2, y - w / 2, h, w)
      ctx.strokeRect(x - h / 2, y - w / 2, h, w)
    } else {
      ctx.fillRect(x - w / 2, y - h / 2, w, h)
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
    }
  }

  const drawVoltageSource = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#4fde98'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#4fde98'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('V', x, y)
    ctx.textBaseline = 'alphabetic'
  }

  const animateDot = (ctx: CanvasRenderingContext2D, path: [number, number][], t: number, speed2: number, color: string) => {
    const total = path.length
    const idx = Math.floor((t * speed2 * 0.015) % total)
    const [dx, dy] = path[idx]
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(dx, dy, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2

    if (mode === 'series') {
      // Series circuit: V -- R1 -- R2 -- back
      const rTotal = r1 + r2
      const I = V_SOURCE / rTotal
      const V1 = I * r1, V2 = I * r2

      // Wire path: left side going down, bottom going right, right going up, top going left
      const left = cx - 180, right = cx + 180, top = cy - 90, bot = cy + 90

      // Draw wires
      ctx.strokeStyle = '#3a4060'
      ctx.lineWidth = 2
      // Top wire
      ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(right, top); ctx.stroke()
      // Bottom wire
      ctx.beginPath(); ctx.moveTo(left, bot); ctx.lineTo(right, bot); ctx.stroke()
      // Left wire
      ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.stroke()
      // Right wire
      ctx.beginPath(); ctx.moveTo(right, top); ctx.lineTo(right, bot); ctx.stroke()

      // Components
      drawVoltageSource(ctx, left, cy)
      drawResistor(ctx, cx - 60, top)
      drawResistor(ctx, cx + 60, top)

      // Labels
      ctx.fillStyle = '#f7a94f'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`R₁=${r1}Ω`, cx - 60, top - 22)
      ctx.fillText(`V₁=${V1.toFixed(1)}V`, cx - 60, top + 24)
      ctx.fillText(`R₂=${r2}Ω`, cx + 60, top - 22)
      ctx.fillText(`V₂=${V2.toFixed(1)}V`, cx + 60, top + 24)

      ctx.fillStyle = '#4fde98'
      ctx.textAlign = 'left'
      ctx.fillText(`${V_SOURCE}V`, left + 26, cy - 8)

      // Current along path
      const path: [number, number][] = []
      for (let x = left; x <= right; x += 4) path.push([x, top])
      for (let y = top; y <= bot; y += 4) path.push([right, y])
      for (let x = right; x >= left; x -= 4) path.push([x, bot])
      for (let y = bot; y >= top; y -= 4) path.push([left, y])

      if (isPlaying) animateDot(ctx, path, t, speed, '#4fde98')

      // KVL label
      ctx.fillStyle = '#8888aa'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`KVL: V = V₁+V₂  |  I = V/R_total = ${I.toFixed(2)} A`, cx, H - 14)
      ctx.fillText(`R_total = R₁+R₂ = ${rTotal} Ω`, cx, H - 34)

    } else {
      // Parallel circuit
      const Req = (r1 * r2) / (r1 + r2)
      const I_total = V_SOURCE / Req
      const I1 = V_SOURCE / r1, I2 = V_SOURCE / r2

      const left = cx - 180, right = cx + 180, top = cy - 100, bot = cy + 100
      const mid1 = cy - 40, mid2 = cy + 40

      ctx.strokeStyle = '#3a4060'
      ctx.lineWidth = 2
      // Main top/bottom rails
      ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(right, top); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(left, bot); ctx.lineTo(right, bot); ctx.stroke()
      // Left wire
      ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.stroke()
      // Junctions
      ctx.beginPath(); ctx.moveTo(cx - 60, top); ctx.lineTo(cx - 60, bot); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 80, top); ctx.lineTo(cx + 80, bot); ctx.stroke()

      drawVoltageSource(ctx, left, cy)
      drawResistor(ctx, cx + 10, mid1, true)
      drawResistor(ctx, cx + 10, mid2, true)

      ctx.fillStyle = '#f7a94f'
      ctx.font = '11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`R₁=${r1}Ω, I₁=${I1.toFixed(2)}A`, cx + 22, mid1 + 4)
      ctx.fillText(`R₂=${r2}Ω, I₂=${I2.toFixed(2)}A`, cx + 22, mid2 + 4)

      ctx.fillStyle = '#4fde98'
      ctx.textAlign = 'left'
      ctx.fillText(`${V_SOURCE}V`, left + 26, cy - 8)

      ctx.fillStyle = '#8888aa'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`KCL: I_total = I₁+I₂ = ${I_total.toFixed(2)} A`, cx, H - 34)
      ctx.fillText(`R_eq = R₁R₂/(R₁+R₂) = ${Req.toFixed(1)} Ω`, cx, H - 14)
    }

    // Mode label
    ctx.fillStyle = '#444466'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(mode === 'series' ? 'Series: same current, voltages add' : 'Parallel: same voltage, currents add', 14, 20)
  }, [mode, r1, r2, isPlaying, speed])

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
        <div className="space-y-4">
          <div className="flex gap-3">
            {(['series', 'parallel'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); onConceptInteract?.('kirchhoff') }}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-[#4f8ef7] text-white' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[#8888aa] text-sm block mb-1">R₁: <span className="text-white font-mono">{r1} Ω</span></label>
              <input type="range" min="5" max="100" step="5" value={r1}
                onChange={e => setR1(Number(e.target.value))} className="w-full accent-[#f7a94f]" />
            </div>
            <div>
              <label className="text-[#8888aa] text-sm block mb-1">R₂: <span className="text-white font-mono">{r2} Ω</span></label>
              <input type="range" min="5" max="100" step="5" value={r2}
                onChange={e => setR2(Number(e.target.value))} className="w-full accent-[#f7a94f]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
