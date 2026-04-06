import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

export default function Inductance({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [nTurns, setNTurns] = useState(10)
  const [switchOn, setSwitchOn] = useState(true)
  const currentRef = useRef(0) // actual current building up

  const L_henry = nTurns * nTurns * 2e-6 // L ∝ N²
  const R = 20 // ohms
  const V_source = 12

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2
    const tau = L_henry / R // time constant (scaled)
    const tauScaled = tau * 5000 / speed

    // Current buildup/decay (RL circuit)
    const I_final = V_source / R
    let I: number
    if (switchOn) {
      I = I_final * (1 - Math.exp(-t / tauScaled))
      currentRef.current = I
    } else {
      const t0 = currentRef.current / I_final * tauScaled
      I = I_final * Math.exp(-(t - t0) / tauScaled)
      if (I < 0.001) I = 0
    }

    const V_L = L_henry * I_final * Math.exp(-t / tauScaled) / (tauScaled / 5000) * 5000

    // ── Circuit diagram ──
    const left = cx - 180, right = cx + 180, top = cy - 80, bot = cy + 80

    // Wires
    ctx.strokeStyle = '#3a4060'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(right, top); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(left, bot); ctx.lineTo(right, bot); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.stroke()

    // Voltage source (left)
    ctx.strokeStyle = '#4fde98'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(left, cy, 20, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#4fde98'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${V_source}V`, left, cy)
    ctx.textBaseline = 'alphabetic'

    // Resistor (top, left portion)
    const rx = cx - 90
    ctx.fillStyle = '#1a1a2a'
    ctx.fillRect(rx - 22, top - 10, 44, 20)
    ctx.strokeStyle = '#f7a94f'
    ctx.lineWidth = 1.5
    ctx.strokeRect(rx - 22, top - 10, 44, 20)
    ctx.fillStyle = '#f7a94f'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${R}Ω`, rx, top - 15)

    // Inductor (solenoid symbol on top, right portion)
    const solenoidX = cx + 60
    const solenoidLen = 100
    for (let i = 0; i < nTurns; i++) {
      const x = right - solenoidLen + (i + 0.5) * (solenoidLen / nTurns)
      ctx.strokeStyle = '#60c8ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, top, 50 / nTurns, 0, Math.PI, true)
      ctx.stroke()
    }
    ctx.fillStyle = '#60c8ff'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`L=${(L_henry * 1e6).toFixed(0)}μH`, cx + 100, top - 15)

    // Switch
    ctx.strokeStyle = switchOn ? '#4fde98' : '#f75f5f'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(right - 10, top)
    ctx.lineTo(right + 8, switchOn ? top : top - 18)
    ctx.stroke()
    ctx.fillStyle = '#555577'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(switchOn ? 'ON' : 'OFF', right, bot + 20)

    // Wire right
    ctx.strokeStyle = '#3a4060'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(right, top); ctx.lineTo(right, bot); ctx.stroke()

    // Animated current dot
    if (I > 0.05 && isPlaying) {
      const pathFrac = (t * speed * 0.008) % 1
      const perim = 2 * (right - left + 2 * (cy - top))
      const pos = pathFrac * perim
      let dx = left, dy2 = top
      const segment = right - left + 2 * (cy - top)
      if (pos < right - left) {
        dx = left + pos; dy2 = top
      } else if (pos < right - left + cy - top) {
        dx = right; dy2 = top + (pos - (right - left))
      } else if (pos < right - left + cy - top + right - left) {
        dx = right - (pos - (right - left + cy - top)); dy2 = bot
      } else {
        dx = left; dy2 = bot - (pos - (right - left + cy - top + right - left))
      }
      ctx.fillStyle = '#4fde98'
      ctx.shadowColor = '#4fde98'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(dx, dy2, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // ── Graph ──
    const gX = 14, gY = H - 150, gW = W * 0.5 - 20, gH = 110
    ctx.strokeStyle = '#2a2a40'
    ctx.lineWidth = 1
    ctx.strokeRect(gX, gY, gW, gH)

    // Axes labels
    ctx.fillStyle = '#555577'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('I', gX + 4, gY + 12)
    ctx.fillText('t', gX + gW - 12, gY + gH - 4)

    // I(t) curve
    ctx.strokeStyle = '#4fde98'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let px = 0; px < gW; px++) {
      const frac = px / gW
      const I_px = switchOn ? I_final * (1 - Math.exp(-frac * 5)) : I_final * Math.exp(-frac * 5)
      const py = gY + gH - I_px / I_final * (gH - 16) - 8
      px === 0 ? ctx.moveTo(gX + px, py) : ctx.lineTo(gX + px, py)
    }
    ctx.stroke()

    // Current indicator on graph
    const curFrac = Math.min((switchOn ? t / tauScaled * 0.2 : 0), 1)
    const curPy = gY + gH - (I / I_final) * (gH - 16) - 8
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(gX + curFrac * gW, curPy, 5, 0, Math.PI * 2)
    ctx.fill()

    // τ label
    ctx.fillStyle = '#f7a94f'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`τ = L/R = ${(tau * 1000).toFixed(3)} ms`, gX + 4, gY + gH - 4)

    // Info
    ctx.fillStyle = '#e8e8f0'
    ctx.font = '12px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`I = ${I.toFixed(3)} A`, W - 14, H - 60)
    ctx.fillText(`V_L = -L·dI/dt`, W - 14, H - 40)
    ctx.fillText(`Energy = ½LI² = ${(0.5 * L_henry * I * I * 1e6).toFixed(2)} μJ`, W - 14, H - 18)
  }, [nTurns, switchOn, L_henry, isPlaying, speed])

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
              Number of turns N: <span className="text-white font-mono">{nTurns}</span>
              <span className="ml-2 text-xs text-[#60c8ff]">L = {(L_henry * 1e6).toFixed(0)} μH</span>
            </label>
            <input type="range" min="4" max="20" step="1" value={nTurns}
              onChange={e => { setNTurns(Number(e.target.value)); onConceptInteract?.('inductance') }}
              className="w-full accent-[#60c8ff]" />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSwitchOn(v => {
                  if (!v) timeRef.current = 0
                  return !v
                })
                onConceptInteract?.('rl-circuit')
              }}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${switchOn ? 'bg-[#4fde98] text-[#0f0f14]' : 'bg-[#f75f5f] text-white'}`}
            >
              Switch {switchOn ? 'ON → turn OFF' : 'OFF → turn ON'}
            </button>
            <span className="text-[#8888aa] text-xs">
              {switchOn ? 'Current building up (τ = L/R)' : 'Current decaying (τ = L/R)'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
