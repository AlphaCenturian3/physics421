import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

export default function MagneticForce({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [charge, setCharge] = useState(1)    // sign: +1 or -1
  const [Bfield, setBfield] = useState(1)    // normalized B magnitude (into page)
  const [velocity, setVelocity] = useState(1) // normalized speed

  // Particle does circular motion in magnetic field (into page, B = -z)
  // F = qv×B; with v in xy-plane and B = -z, F is centripetal
  // r = mv/(qB)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2

    // Draw B-field dots/crosses (into vs out of page)
    const gridS = 40
    for (let gx = 20; gx < W; gx += gridS) {
      for (let gy = 20; gy < H; gy += gridS) {
        ctx.fillStyle = '#2a3050'
        ctx.font = '16px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(Bfield >= 0 ? '×' : '·', gx, gy)
        ctx.textBaseline = 'alphabetic'
      }
    }

    // B label
    ctx.fillStyle = '#555580'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`B = ${Bfield >= 0 ? 'into page ×' : 'out of page ·'}  |B| = ${Math.abs(Bfield).toFixed(1)} T`, 14, 22)

    // Cyclotron radius (normalized, so r = velocity / (|charge| * |B|))
    const r = Math.max(40, (velocity * 80) / (Math.abs(charge) * Math.abs(Bfield)))
    const omega = (charge * Bfield * velocity) / (r) // angular velocity direction
    const angle = t * Math.abs(omega) * 0.02 * speed * Math.sign(charge * Bfield)

    const px = cx + r * Math.cos(angle)
    const py = cy + r * Math.sin(angle)

    // Orbit circle (dashed)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#333355'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Radius label
    ctx.fillStyle = '#444466'
    ctx.font = '11px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`r = mv/|q|B = ${r.toFixed(0)} px`, cx + 4, cy - 8)

    // Velocity vector (tangent to circle)
    const vDir = Math.sign(charge * Bfield)
    const vx = -Math.sin(angle) * vDir, vy = Math.cos(angle) * vDir
    const vLen = 45
    ctx.strokeStyle = '#4f8ef7'
    ctx.fillStyle = '#4f8ef7'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + vx * vLen, py + vy * vLen)
    ctx.stroke()
    const ax = px + vx * vLen, ay = py + vy * vLen
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax - vx * 8 + vy * 5, ay - vy * 8 - vx * 5)
    ctx.lineTo(ax - vx * 8 - vy * 5, ay - vy * 8 + vx * 5)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#4f8ef7'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('v', ax + vx * 10, ay + vy * 10)

    // Force vector (centripetal = inward)
    const fx = cx - px, fy = cy - py
    const fMag = Math.hypot(fx, fy)
    const fnx = fx / fMag, fny = fy / fMag
    const fLen = 35
    ctx.strokeStyle = '#f75f5f'
    ctx.fillStyle = '#f75f5f'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + fnx * fLen, py + fny * fLen)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(px + fnx * fLen, py + fny * fLen)
    ctx.lineTo(px + fnx * fLen - fnx * 8 + fny * 5, py + fny * fLen - fny * 8 - fnx * 5)
    ctx.lineTo(px + fnx * fLen - fnx * 8 - fny * 5, py + fny * fLen - fny * 8 + fnx * 5)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f75f5f'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('F = qv×B', px + fnx * (fLen + 16), py + fny * (fLen + 16))

    // Particle
    const pcolor = charge > 0 ? '#4fde98' : '#f7a94f'
    const pglow = ctx.createRadialGradient(px, py, 0, px, py, 18)
    pglow.addColorStop(0, pcolor + '88')
    pglow.addColorStop(1, pcolor + '00')
    ctx.fillStyle = pglow
    ctx.beginPath()
    ctx.arc(px, py, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pcolor
    ctx.beginPath()
    ctx.arc(px, py, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(charge > 0 ? '+' : '−', px, py)
    ctx.textBaseline = 'alphabetic'

    // Key insight
    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Magnetic force ⊥ velocity → no work done → |v| constant', W / 2, H - 12)

    const omegaVal = velocity / r * 60
    ctx.fillStyle = '#e8e8f0'
    ctx.font = '12px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`ω = |q|B/m = ${omegaVal.toFixed(2)} rad/s  |  f = ${(omegaVal / (2 * Math.PI)).toFixed(2)} Hz`, W - 14, H - 12)
  }, [charge, Bfield, velocity, speed])

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
        <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4 space-y-4">
          <div className="flex gap-3">
            <button onClick={() => { setCharge(1); onConceptInteract?.('lorentz-force') }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${charge > 0 ? 'bg-[#4fde98] text-[#0f0f14]' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa]'}`}>
              + Charge
            </button>
            <button onClick={() => { setCharge(-1); onConceptInteract?.('lorentz-force') }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${charge < 0 ? 'bg-[#f7a94f] text-[#0f0f14]' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa]'}`}>
              − Charge
            </button>
          </div>
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">B Field: <span className="text-white font-mono">{Bfield.toFixed(1)} T</span></label>
            <input type="range" min="0.5" max="3" step="0.5" value={Bfield}
              onChange={e => setBfield(Number(e.target.value))} className="w-full accent-[#4f8ef7]" />
          </div>
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">Speed: <span className="text-white font-mono">{velocity.toFixed(1)} rel. units</span></label>
            <input type="range" min="0.5" max="3" step="0.5" value={velocity}
              onChange={e => setVelocity(Number(e.target.value))} className="w-full accent-[#4fde98]" />
          </div>
        </div>
      )}
    </div>
  )
}
