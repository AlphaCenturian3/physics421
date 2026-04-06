import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

type Mode = 'moving-magnet' | 'rotating-loop' | 'changing-B'

export default function FaradaysLaw({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [mode, setMode] = useState<Mode>('moving-magnet')

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2

    if (mode === 'moving-magnet') {
      // Oscillating bar magnet approaching a coil
      const coilX = cx + 80
      const magPhase = Math.sin(t * 0.03 * speed)
      const magX = cx - 80 + magPhase * 60

      // Draw coil (vertical rectangle = cross section of solenoid)
      ctx.strokeStyle = '#f7a94f'
      ctx.lineWidth = 3
      const coilW = 20, coilH = 100
      ctx.strokeRect(coilX - coilW / 2, cy - coilH / 2, coilW, coilH)
      // Coil turns
      for (let yi = 0; yi < 8; yi++) {
        const y = cy - coilH / 2 + yi * (coilH / 7)
        ctx.beginPath()
        ctx.ellipse(coilX, y, coilW / 2, 6, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw bar magnet
      const mW = 50, mH = 24
      ctx.fillStyle = '#4f8ef7'
      ctx.fillRect(magX - mW / 2, cy - mH / 2, mW / 2, mH)
      ctx.fillStyle = '#f75f5f'
      ctx.fillRect(magX, cy - mH / 2, mW / 2, mH)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N', magX - mW / 4, cy)
      ctx.fillText('S', magX + mW / 4, cy)
      ctx.textBaseline = 'alphabetic'

      // Velocity arrow
      const vDir = Math.cos(t * 0.03 * speed) // derivative of sin
      const vColor = vDir > 0 ? '#4fde98' : '#f75f5f'
      ctx.strokeStyle = vColor
      ctx.fillStyle = vColor
      ctx.lineWidth = 2
      const vLen = 30 * Math.abs(vDir)
      ctx.beginPath()
      ctx.moveTo(magX + (mW / 2 + 4) * Math.sign(vDir), cy)
      ctx.lineTo(magX + (mW / 2 + 4 + vLen) * Math.sign(vDir), cy)
      ctx.stroke()

      // Field lines from magnet
      const dist = coilX - magX - mW / 2
      const B_at_coil = Math.max(0, 50 / (dist * dist + 10)) * 1000
      const flux = B_at_coil * Math.PI * (coilW / 2) ** 2
      const dFlux_dt = -vDir * B_at_coil * 5 // approximate

      // EMF display
      const emf = -dFlux_dt * 0.01
      const emfColor = Math.abs(emf) > 0.01 ? '#4fde98' : '#8888aa'

      ctx.fillStyle = emfColor
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`EMF = -dΦ/dt ≈ ${emf.toFixed(2)} V`, cx, H - 40)
      ctx.fillStyle = '#8888aa'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`Φ_B ≈ ${(B_at_coil * 0.001).toFixed(3)} Wb  (through coil)`, cx, H - 18)

      // Lenz's law indicator
      if (Math.abs(emf) > 0.05) {
        const lenzText = emf > 0 ? "Induced current opposes flux increase" : "Induced current opposes flux decrease"
        ctx.fillStyle = '#f7a94f'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`Lenz's Law: ${lenzText}`, cx, H - 60)
      }

    } else if (mode === 'rotating-loop') {
      // Loop rotating in uniform B field
      const theta = t * 0.04 * speed // angle of loop rotation
      const B = 1.0, A = 4000 // B field and area (normalized)
      const flux = B * A * Math.cos(theta)
      const emf = B * A * Math.sin(theta) * 0.04 * speed

      // Background field lines
      for (let i = 0; i < 7; i++) {
        const y = 60 + i * ((H - 120) / 6)
        ctx.strokeStyle = 'rgba(60,100,200,0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(20, y)
        ctx.lineTo(W - 20, y)
        ctx.stroke()
      }
      ctx.fillStyle = '#3a64c8'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('B →', 24, 36)

      // Rotating loop (projected as ellipse)
      const projW = 80 * Math.abs(Math.cos(theta))
      const projH = 80
      ctx.strokeStyle = '#f7a94f'
      ctx.lineWidth = 3
      if (projW < 2) {
        ctx.beginPath()
        ctx.moveTo(cx, cy - projH)
        ctx.lineTo(cx, cy + projH)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.ellipse(cx, cy, projW, projH, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Normal vector
      const nAngle = theta
      const nLen = 60
      ctx.strokeStyle = '#4fde98'
      ctx.fillStyle = '#4fde98'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + nLen * Math.cos(nAngle), cy + nLen * Math.sin(nAngle) * 0.4)
      ctx.stroke()
      ctx.fillText('n̂', cx + nLen * Math.cos(nAngle) + 8, cy + nLen * Math.sin(nAngle) * 0.4)

      // Graphs
      const gW = 200, gH = 80, gX = W - gW - 20, gY1 = 30, gY2 = gY1 + gH + 20

      const drawWave = (gYbase: number, amplitude: (angle: number) => number, color: string, label: string) => {
        ctx.strokeStyle = '#2a2a40'
        ctx.lineWidth = 1
        ctx.strokeRect(gX, gYbase, gW, gH)
        ctx.setLineDash([2, 3])
        ctx.strokeStyle = '#333355'
        ctx.beginPath()
        ctx.moveTo(gX, gYbase + gH / 2)
        ctx.lineTo(gX + gW, gYbase + gH / 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let px = 0; px < gW; px++) {
          const ang = (px / gW) * Math.PI * 4
          const py = gYbase + gH / 2 - amplitude(ang) * gH * 0.45
          px === 0 ? ctx.moveTo(gX + px, py) : ctx.lineTo(gX + px, py)
        }
        ctx.stroke()
        // Current position
        const curPx = (theta % (Math.PI * 4)) / (Math.PI * 4) * gW
        const curPy = gYbase + gH / 2 - amplitude(theta % (Math.PI * 4)) * gH * 0.45
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(gX + curPx, curPy, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(label, gX + 4, gYbase + 12)
      }

      drawWave(gY1, a => Math.cos(a), '#4fde98', 'Φ = BA cos(θ)')
      drawWave(gY2, a => Math.sin(a), '#f75f5f', 'EMF = -dΦ/dt')

      ctx.fillStyle = '#e8e8f0'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`Φ = ${(flux / A).toFixed(2)} BA  |  EMF = ${emf.toFixed(2)} V`, cx, H - 14)

    } else {
      // Changing B through a fixed loop
      const loopR = 80
      const B_t = 1 + 0.8 * Math.sin(t * 0.04 * speed)
      const dB_dt = 0.8 * Math.cos(t * 0.04 * speed) * 0.04 * speed
      const A = Math.PI * loopR * loopR / 1e4
      const flux = B_t * A
      const emf = -dB_dt * A

      // Background field strength (density of dots)
      const numDots = Math.round(B_t * 5 + 5)
      for (let i = 0; i < numDots; i++) {
        for (let j = 0; j < numDots; j++) {
          const dx = cx - 130 + (i / (numDots - 1)) * 260
          const dy = cy - 100 + (j / (numDots - 1)) * 200
          ctx.fillStyle = `rgba(100,160,255,${0.3 + B_t * 0.2})`
          ctx.font = '14px monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('×', dx, dy)
          ctx.textBaseline = 'alphabetic'
        }
      }

      // Fixed loop
      ctx.strokeStyle = '#f7a94f'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy, loopR, 0, Math.PI * 2)
      ctx.stroke()

      // Induced current direction (Lenz)
      const indDir = emf > 0 ? 1 : -1
      const numInd = 8
      for (let i = 0; i < numInd; i++) {
        const ang = (i / numInd + t * 0.015 * speed * indDir) % 1 * Math.PI * 2
        const ix = cx + loopR * Math.cos(ang), iy = cy + loopR * Math.sin(ang)
        const tx = -Math.sin(ang) * indDir, ty2 = Math.cos(ang) * indDir
        ctx.fillStyle = '#4fde98'
        ctx.beginPath()
        ctx.moveTo(ix + tx * 6, iy + ty2 * 6)
        ctx.lineTo(ix - tx * 6 + ty2 * 4, iy - ty2 * 6 - tx * 4)
        ctx.lineTo(ix - tx * 6 - ty2 * 4, iy - ty2 * 6 + tx * 4)
        ctx.closePath()
        ctx.fill()
      }

      ctx.fillStyle = '#e8e8f0'
      ctx.font = '13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`B(t) = ${B_t.toFixed(2)} T  |  dB/dt = ${dB_dt.toFixed(3)} T/s`, cx, H - 40)
      ctx.fillText(`EMF = -A·dB/dt = ${emf.toFixed(3)} V`, cx, H - 18)
    }

    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText("Faraday: EMF = -dΦ_B/dt", 12, 20)
  }, [mode, speed])

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
        <div className="flex gap-3 flex-wrap">
          {([
            ['moving-magnet', 'Moving Magnet'],
            ['rotating-loop', 'Rotating Loop (Generator)'],
            ['changing-B', 'Changing B Field'],
          ] as [Mode, string][]).map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); onConceptInteract?.('faradays-law') }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === m ? 'bg-[#4f8ef7] text-white' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
