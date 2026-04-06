import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

export default function RLCCircuits({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [R, setR] = useState(20)
  const [L_uH, setL_uH] = useState(100)
  const [C_nF, setC_nF] = useState(100)
  const [showPhase, setShowPhase] = useState(false)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const L = L_uH * 1e-6
    const C = C_nF * 1e-9
    const omega0 = 1 / Math.sqrt(L * C)
    const f0 = omega0 / (2 * Math.PI)
    const Q = omega0 * L / R

    // Sweep frequencies for impedance plot
    const gX = 14, gY = 30, gW = W * 0.55 - 20, gH = H - gY - 90

    ctx.strokeStyle = '#2a2a40'
    ctx.lineWidth = 1
    ctx.strokeRect(gX, gY, gW, gH)

    // Axes labels
    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Frequency →', gX + gW / 2, gY + gH + 16)
    ctx.save()
    ctx.translate(gX - 18, gY + gH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(showPhase ? 'Phase (deg)' : '|Z| or I', 0, 0)
    ctx.restore()

    const fMin = f0 * 0.1, fMax = f0 * 10

    // Plot |Z(f)|
    if (!showPhase) {
      ctx.strokeStyle = '#f7a94f'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let px = 0; px <= gW; px++) {
        const f = fMin * Math.pow(fMax / fMin, px / gW)
        const omega = 2 * Math.PI * f
        const Z = Math.sqrt(R * R + (omega * L - 1 / (omega * C)) ** 2)
        const Znorm = Math.min(Z / (R * 20), 1)
        const py = gY + gH - (1 - Znorm) * gH * 0.9 - gH * 0.05
        px === 0 ? ctx.moveTo(gX + px, py) : ctx.lineTo(gX + px, py)
      }
      ctx.stroke()

      // I(f) = V/Z
      ctx.strokeStyle = '#4fde98'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let px = 0; px <= gW; px++) {
        const f = fMin * Math.pow(fMax / fMin, px / gW)
        const omega = 2 * Math.PI * f
        const Z = Math.sqrt(R * R + (omega * L - 1 / (omega * C)) ** 2)
        const Inorm = Math.min(R / Z, 1)
        const py = gY + gH - Inorm * gH * 0.9 - gH * 0.05
        px === 0 ? ctx.moveTo(gX + px, py) : ctx.lineTo(gX + px, py)
      }
      ctx.stroke()

      ctx.fillStyle = '#f7a94f'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('|Z|', gX + 4, gY + 14)
      ctx.fillStyle = '#4fde98'
      ctx.fillText('I = V/|Z|', gX + 4, gY + 28)
    } else {
      // Phase angle
      ctx.strokeStyle = '#60c8ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let px = 0; px <= gW; px++) {
        const f = fMin * Math.pow(fMax / fMin, px / gW)
        const omega = 2 * Math.PI * f
        const phase = Math.atan2(omega * L - 1 / (omega * C), R) * 180 / Math.PI
        const py = gY + gH / 2 - (phase / 90) * gH * 0.45
        px === 0 ? ctx.moveTo(gX + px, py) : ctx.lineTo(gX + px, py)
      }
      ctx.stroke()
      // Zero phase line
      ctx.strokeStyle = '#333355'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(gX, gY + gH / 2)
      ctx.lineTo(gX + gW, gY + gH / 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#444466'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText('0°', gX - 2, gY + gH / 2 + 4)
    }

    // Resonance marker
    const resX = gX + Math.log(f0 / fMin) / Math.log(fMax / fMin) * gW
    ctx.strokeStyle = '#f75f5f'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(resX, gY)
    ctx.lineTo(resX, gY + gH)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#f75f5f'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('f₀', resX, gY + gH + 14)

    // Animated time domain signal
    const sigGY = H - 78
    const sigH = 60
    const animOmega = omega0 * (0.7 + 0.3 * Math.sin(t * 0.005 * speed))
    ctx.strokeStyle = '#2a2a40'
    ctx.lineWidth = 1
    ctx.strokeRect(gX, sigGY, gW, sigH)
    ctx.strokeStyle = '#4fde98'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let px = 0; px < gW; px++) {
      const tau = (px / gW) * 5
      const sig = Math.exp(-R / (2 * L) * tau / (omega0 * 50)) * Math.cos(omega0 * tau / (omega0 * 50))
      const py = sigGY + sigH / 2 - sig * sigH * 0.45
      px === 0 ? ctx.moveTo(gX + px, py) : ctx.lineTo(gX + px, py)
    }
    ctx.stroke()
    ctx.fillStyle = '#8888aa'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Transient oscillation (step response)', gX + 4, sigGY - 4)

    // Info panel (right side)
    const infoX = gX + gW + 24
    const infoY = gY + 16
    const lineH = 22

    const items: [string, string, string][] = [
      ['ω₀', `${(omega0 / 1000).toFixed(1)} krad/s`, '#f7a94f'],
      ['f₀', `${(f0 / 1000).toFixed(2)} kHz`, '#f7a94f'],
      ['Q', `${Q.toFixed(2)}`, '#4fde98'],
      ['BW', `${(f0 / Q / 1000).toFixed(2)} kHz`, '#60c8ff'],
      ['Z_min', `${R} Ω`, '#f75f5f'],
      ['L', `${L_uH} μH`, '#60c8ff'],
      ['C', `${C_nF} nF`, '#60c8ff'],
      ['R', `${R} Ω`, '#f7a94f'],
    ]

    items.forEach(([label, val, color], i) => {
      ctx.fillStyle = '#8888aa'
      ctx.font = '11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(label + ':', infoX, infoY + i * lineH)
      ctx.fillStyle = color
      ctx.fillText(val, infoX + 54, infoY + i * lineH)
    })

    // Resonance explanation
    ctx.fillStyle = '#555577'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('At f₀: X_L = X_C → Z = R (minimum)', infoX, H - 40)
    ctx.fillText(`ω₀ = 1/√(LC)`, infoX, H - 20)
  }, [R, L_uH, C_nF, showPhase, speed])

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
            <button onClick={() => setShowPhase(false)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!showPhase ? 'bg-[#4f8ef7] text-white' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa]'}`}>
              Impedance / Current
            </button>
            <button onClick={() => setShowPhase(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showPhase ? 'bg-[#60c8ff] text-[#0f0f14]' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa]'}`}>
              Phase Angle
            </button>
          </div>
          <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4 grid grid-cols-3 gap-4">
            <div>
              <label className="text-[#8888aa] text-sm block mb-1">R: <span className="text-white font-mono">{R} Ω</span></label>
              <input type="range" min="5" max="100" step="5" value={R}
                onChange={e => { setR(Number(e.target.value)); onConceptInteract?.('rlc-resonance') }}
                className="w-full accent-[#f7a94f]" />
            </div>
            <div>
              <label className="text-[#8888aa] text-sm block mb-1">L: <span className="text-white font-mono">{L_uH} μH</span></label>
              <input type="range" min="10" max="500" step="10" value={L_uH}
                onChange={e => setL_uH(Number(e.target.value))}
                className="w-full accent-[#60c8ff]" />
            </div>
            <div>
              <label className="text-[#8888aa] text-sm block mb-1">C: <span className="text-white font-mono">{C_nF} nF</span></label>
              <input type="range" min="10" max="500" step="10" value={C_nF}
                onChange={e => setC_nF(Number(e.target.value))}
                className="w-full accent-[#60c8ff]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
