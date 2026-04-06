import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

type Config = 'straight' | 'loop' | 'solenoid'

export default function BiotSavart({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [config, setConfig] = useState<Config>('straight')
  const [current, setCurrent] = useState(1)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2
    const phase = (t * 0.012 * speed) % 1

    if (config === 'straight') {
      // Infinite straight wire (horizontal, current to right)
      ctx.strokeStyle = '#f7a94f'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(0, cy)
      ctx.lineTo(W, cy)
      ctx.stroke()

      // Animated current arrows
      for (let i = 0; i < 5; i++) {
        const x = ((i / 5 + phase) % 1) * W
        ctx.fillStyle = '#f7a94f'
        ctx.beginPath()
        ctx.moveTo(x + 10, cy)
        ctx.lineTo(x - 4, cy - 6)
        ctx.lineTo(x - 4, cy + 6)
        ctx.closePath()
        ctx.fill()
      }

      ctx.fillStyle = '#f7a94f'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`I = ${current.toFixed(1)} A →`, cx, cy - 16)

      // Concentric B-field circles at discrete distances
      const distances = [50, 100, 160]
      distances.forEach((d, di) => {
        const B = (2e-7 * current) / (d / 100)
        const alpha = 0.7 - di * 0.18
        // Circle above (B coming out of page above → dot)
        ctx.strokeStyle = `rgba(100,160,255,${alpha})`
        ctx.lineWidth = 1.5 + (3 - di) * 0.4
        ctx.setLineDash([6, 5])
        ctx.beginPath()
        ctx.arc(cx, cy, d, Math.PI, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = `rgba(100,160,255,${alpha})`
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`B=${(B * 1e6).toFixed(1)}μT`, cx + d, cy - 12)

        // Below
        ctx.setLineDash([6, 5])
        ctx.beginPath()
        ctx.arc(cx, cy, d, 0, Math.PI)
        ctx.stroke()
        ctx.setLineDash([])
      })

      // Arrows showing B direction (right-hand rule)
      ctx.fillStyle = '#60c8ff'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⊙ B (out)', cx - 120, cy - 60)
      ctx.fillText('⊗ B (in)', cx - 120, cy + 70)

      ctx.fillStyle = '#e8e8f0'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('B = μ₀I / (2πr)', cx, H - 14)

    } else if (config === 'loop') {
      const R = 80 // loop radius in px

      // Draw loop ellipse (viewed at angle)
      ctx.strokeStyle = '#f7a94f'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(cx, cy, R, R * 0.35, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Current direction arrow
      const ang = phase * Math.PI * 2
      const lx = cx + R * Math.cos(ang), ly = cy + R * 0.35 * Math.sin(ang)
      const tx = -Math.sin(ang), ty = 0.35 * Math.cos(ang)
      const tmag = Math.hypot(tx, ty)
      ctx.fillStyle = '#f7a94f'
      ctx.beginPath()
      ctx.moveTo(lx + tx / tmag * 8, ly + ty / tmag * 8)
      ctx.lineTo(lx - tx / tmag * 8 + ty / tmag * 5, ly - ty / tmag * 8 - tx / tmag * 5)
      ctx.lineTo(lx - tx / tmag * 8 - ty / tmag * 5, ly - ty / tmag * 8 + tx / tmag * 5)
      ctx.closePath()
      ctx.fill()

      // Axis of loop
      ctx.strokeStyle = '#333355'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(cx - W / 2.5, cy)
      ctx.lineTo(cx + W / 2.5, cy)
      ctx.stroke()
      ctx.setLineDash([])

      // Magnetic field through loop center (B on axis)
      const numArrows = 8
      for (let i = 0; i < numArrows; i++) {
        const x = cx - 160 + i * 45
        const alpha = i === 3 || i === 4 ? 1 : 0.4 + Math.exp(-Math.abs(i - 3.5) * 0.6) * 0.4
        ctx.fillStyle = `rgba(100,160,255,${alpha})`
        ctx.strokeStyle = `rgba(100,160,255,${alpha})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, cy)
        ctx.lineTo(x + 20, cy)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x + 20, cy)
        ctx.lineTo(x + 10, cy - 5)
        ctx.lineTo(x + 10, cy + 5)
        ctx.closePath()
        ctx.fill()
      }

      const B_center = (4e-7 * Math.PI * current) / (2 * R / 100)
      ctx.fillStyle = '#e8e8f0'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`B_center = μ₀I/(2R) = ${(B_center * 1e6).toFixed(1)} μT`, cx, H - 34)
      ctx.fillText('B falls off rapidly away from center', cx, H - 14)

    } else {
      // Solenoid (N turns, uniform field inside)
      const solenoidLeft = cx - 140, solenoidRight = cx + 140
      const solenoidTop = cy - 50, solenoidBot = cy + 50
      const numTurns = 10

      // Draw coil turns
      for (let i = 0; i < numTurns; i++) {
        const x = solenoidLeft + (i + 0.5) * ((solenoidRight - solenoidLeft) / numTurns)
        ctx.strokeStyle = '#f7a94f'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(x, cy, 6, 50, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Horizontal connecting wire (top)
      ctx.strokeStyle = '#f7a94faa'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(solenoidLeft, solenoidTop - 2)
      ctx.lineTo(solenoidRight, solenoidTop - 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(solenoidLeft, solenoidBot + 2)
      ctx.lineTo(solenoidRight, solenoidBot + 2)
      ctx.stroke()

      // Uniform B inside (horizontal arrows)
      const numB = 5
      const bSpacing = (solenoidBot - solenoidTop) / (numB + 1)
      for (let bi = 1; bi <= numB; bi++) {
        const by2 = solenoidTop + bi * bSpacing
        // Animated field lines
        for (let xi = 0; xi < 4; xi++) {
          const bx2 = solenoidLeft + 20 + ((xi / 4 + phase) % 1) * (solenoidRight - solenoidLeft - 40)
          ctx.fillStyle = '#60c8ff'
          ctx.beginPath()
          ctx.moveTo(bx2 + 10, by2)
          ctx.lineTo(bx2 - 4, by2 - 4)
          ctx.lineTo(bx2 - 4, by2 + 4)
          ctx.closePath()
          ctx.fill()
        }
      }

      // Field outside is near zero
      ctx.fillStyle = '#333355'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('B ≈ 0 outside', cx, solenoidTop - 16)

      const n = numTurns / ((solenoidRight - solenoidLeft) / 100) // turns/m
      const B_sol = 4e-7 * Math.PI * n * current
      ctx.fillStyle = '#e8e8f0'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`B = μ₀nI = ${(B_sol * 1e6).toFixed(1)} μT  (n = ${n.toFixed(0)} turns/m)`, cx, H - 14)
    }
  }, [config, current, speed])

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
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[68vh]' : 'h-[400px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      {!isFocusMode && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {(['straight', 'loop', 'solenoid'] as Config[]).map(c => (
              <button key={c} onClick={() => { setConfig(c); onConceptInteract?.('biot-savart') }}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${config === c ? 'bg-[#4f8ef7] text-white' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}>
                {c === 'straight' ? 'Infinite Wire' : c === 'loop' ? 'Current Loop' : 'Solenoid'}
              </button>
            ))}
          </div>
          <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4">
            <label className="text-[#8888aa] text-sm block mb-1">Current I: <span className="text-white font-mono">{current.toFixed(1)} A</span></label>
            <input type="range" min="0.5" max="5" step="0.5" value={current}
              onChange={e => setCurrent(Number(e.target.value))} className="w-full accent-[#f7a94f]" />
          </div>
        </div>
      )}
    </div>
  )
}
