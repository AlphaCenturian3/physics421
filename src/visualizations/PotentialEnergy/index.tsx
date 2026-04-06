import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

const K = 8.99e9

export default function PotentialEnergy({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const [q1, setQ1] = useState(1)
  const [q2, setQ2] = useState(-1)
  // draggable charge position (x fraction of left panel, 0.2-0.8)
  const [charge2X, setCharge2X] = useState(0.65)
  const isDraggingRef = useRef(false)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const leftW = W * 0.55
    const rightW = W - leftW
    const lCy = H / 2

    // Divider
    ctx.strokeStyle = '#2a2a40'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(leftW, 0)
    ctx.lineTo(leftW, H)
    ctx.stroke()

    // ── LEFT PANEL: spatial view ──
    // Charge 1 fixed
    const c1x = leftW * 0.2
    const c1y = lCy
    // Charge 2 draggable
    const c2x = leftW * charge2X
    const c2y = lCy

    const distPx = Math.max(Math.abs(c2x - c1x), 10)
    const distM = distPx / 100 // 100px = 1m
    const PE = K * q1 * q2 / distM

    // Force arrow on charge 2
    const forceDir = q1 * q2 < 0 ? -1 : 1 // attractive = toward left = -1
    const forceLen = Math.min(Math.abs(PE) / 1e9 * 30 + 20, 70)
    const arrowColor = PE < 0 ? '#4fde98' : '#f7a94f'
    // arrow from charge 2
    const farrowX = c2x + forceDir * forceLen
    ctx.strokeStyle = arrowColor
    ctx.fillStyle = arrowColor
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(c2x + (q1 * q2 < 0 ? -22 : 22), c2y)
    ctx.lineTo(farrowX, c2y)
    ctx.stroke()
    const adir = forceDir
    ctx.beginPath()
    ctx.moveTo(farrowX, c2y)
    ctx.lineTo(farrowX - adir * 10, c2y - 5)
    ctx.lineTo(farrowX - adir * 10, c2y + 5)
    ctx.closePath()
    ctx.fill()

    // Work label
    ctx.fillStyle = arrowColor
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(PE < 0 ? 'Field does +work' : 'External work needed', c2x, c2y - 55)

    // Dashed distance line
    ctx.setLineDash([3, 4])
    ctx.strokeStyle = '#333355'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(c1x, c1y)
    ctx.lineTo(c2x, c2y)
    ctx.stroke()
    ctx.setLineDash([])

    // Distance label
    ctx.fillStyle = '#555577'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`r = ${distM.toFixed(2)} m`, (c1x + c2x) / 2, c1y - 24)

    // Charge 1
    const pulse = 1 + 0.06 * Math.sin(t * 0.05)
    const drawCharge = (x: number, y: number, q: number, draggable = false) => {
      const color = q > 0 ? '#4f8ef7' : '#f75f5f'
      const r = 18 * (draggable ? 1 : pulse)
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2)
      glow.addColorStop(0, color + '88')
      glow.addColorStop(1, color + '00')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(x, y, r * 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      if (draggable) {
        ctx.strokeStyle = '#ffffff44'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(q > 0 ? '+' : '−', x, y)
      ctx.textBaseline = 'alphabetic'
    }
    drawCharge(c1x, c1y, q1)
    drawCharge(c2x, c2y, q2, true)

    // Drag hint
    ctx.fillStyle = '#444466'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('drag →', c2x, c2y + 32)

    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('← Spatial View', 8, 18)

    // ── RIGHT PANEL: PE vs distance graph ──
    const gx0 = leftW + 20
    const gy0 = 30
    const gW = rightW - 30
    const gH = H - 60

    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('PE vs. Distance →', leftW + 8, 18)

    // Axes
    ctx.strokeStyle = '#2a2a40'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(gx0, gy0)
    ctx.lineTo(gx0, gy0 + gH)
    ctx.lineTo(gx0 + gW, gy0 + gH)
    ctx.stroke()

    // Zero line (midpoint of graph)
    const midY = gy0 + gH / 2
    ctx.strokeStyle = '#333355'
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(gx0, midY)
    ctx.lineTo(gx0 + gW, midY)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#444466'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('0', gx0 - 4, midY + 4)

    // Plot U = kq1q2/r curve
    const rMin = 0.1, rMax = 3.5
    const UScale = gH / 2 / 1e10

    ctx.strokeStyle = q1 * q2 < 0 ? '#4fde98' : '#f7a94f'
    ctx.lineWidth = 2
    ctx.beginPath()
    let started = false
    for (let px2 = 0; px2 <= gW; px2 += 2) {
      const r2 = rMin + (px2 / gW) * (rMax - rMin)
      const U2 = K * q1 * q2 / r2
      const py2 = midY - U2 * UScale
      if (py2 < gy0 || py2 > gy0 + gH) { started = false; continue }
      if (!started) { ctx.moveTo(gx0 + px2, py2); started = true }
      else ctx.lineTo(gx0 + px2, py2)
    }
    ctx.stroke()

    // Current point on graph
    const curR = Math.max(distM, 0.1)
    const curPx = ((curR - rMin) / (rMax - rMin)) * gW
    const curU = K * q1 * q2 / curR
    const curPy = midY - curU * UScale
    if (curPy >= gy0 && curPy <= gy0 + gH) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(gx0 + curPx, curPy, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e8e8f0'
      ctx.font = '11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`U = ${(curU / 1e9).toFixed(2)} GJ`, gx0 + curPx + 8, curPy - 4)
    }

    // Current PE text
    ctx.fillStyle = arrowColor
    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`U = kq₁q₂/r = ${(PE / 1e9).toFixed(2)} GJ`, leftW + rightW / 2, H - 10)
  }, [q1, q2, charge2X])

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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const x = (e.clientX - rect.left) * scaleX
    const W = canvasRef.current!.width
    const leftW = W * 0.55
    const c2x = leftW * charge2X
    if (Math.abs(x - c2x) < 28) isDraggingRef.current = true
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const x = (e.clientX - rect.left) * scaleX
    const W = canvasRef.current!.width
    const leftW = W * 0.55
    const frac = Math.max(0.28, Math.min(0.88, x / leftW))
    setCharge2X(frac)
    onConceptInteract?.('potential-energy')
  }

  const handleMouseUp = () => { isDraggingRef.current = false }

  return (
    <div className="space-y-4">
      <div className="text-[#8888aa] text-xs text-center">
        Drag the right charge (faint outline) to change separation and see PE update in real time
      </div>
      <div
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[65vh]' : 'h-[380px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {!isFocusMode && (
        <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Charge q₁: {q1 >= 0 ? '+' : ''}{q1.toFixed(1)} C
            </label>
            <input
              type="range" min="-3" max="3" step="0.5" value={q1}
              onChange={e => { setQ1(Number(e.target.value)); onConceptInteract?.('potential-energy') }}
              className="w-full accent-[#4f8ef7]"
            />
          </div>
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Charge q₂: {q2 >= 0 ? '+' : ''}{q2.toFixed(1)} C
            </label>
            <input
              type="range" min="-3" max="3" step="0.5" value={q2}
              onChange={e => { setQ2(Number(e.target.value)); onConceptInteract?.('potential-energy') }}
              className="w-full accent-[#4f8ef7]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
