import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

interface Charge { x: number; y: number; q: number }
interface TestParticle { x: number; y: number; vx: number; vy: number; active: boolean }

const K = 1.0 // normalized

function getPotential(charges: Charge[], px: number, py: number): number {
  let V = 0
  for (const c of charges) {
    const r = Math.hypot(px - c.x, py - c.y)
    if (r < 5) continue
    V += K * c.q / r
  }
  return V
}

function getField(charges: Charge[], px: number, py: number): { ex: number; ey: number } {
  let ex = 0, ey = 0
  for (const c of charges) {
    const dx = px - c.x, dy = py - c.y
    const r2 = dx * dx + dy * dy
    if (r2 < 25) continue
    const r = Math.sqrt(r2)
    const mag = c.q / r2
    ex += mag * dx / r
    ey += mag * dy / r
  }
  return { ex, ey }
}

function potToColor(V: number): [number, number, number] {
  const t = Math.max(-1, Math.min(1, V / 3))
  if (t >= 0) {
    // warm: dark to red/orange
    return [Math.round(20 + t * 220), Math.round(10 + t * 50), Math.round(10 + t * 10)]
  } else {
    // cool: dark to blue
    return [Math.round(10 + (-t) * 20), Math.round(10 + (-t) * 60), Math.round(20 + (-t) * 200)]
  }
}

export default function ElectricPotential({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number>(0)
  const chargesRef = useRef<Charge[]>([
    { x: 200, y: 200, q: 2 },
    { x: 400, y: 200, q: -2 },
  ])
  const particleRef = useRef<TestParticle>({ x: 300, y: 80, vx: 0, vy: 0, active: false })
  const needsHeatmapRef = useRef(true)
  const [charges, setCharges] = useState<Charge[]>(chargesRef.current)
  const [released, setReleased] = useState(false)
  const [hoverV, setHoverV] = useState<string | null>(null)

  useEffect(() => { chargesRef.current = charges; needsHeatmapRef.current = true }, [charges])

  const buildHeatmap = useCallback((W: number, H: number) => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas')
    }
    const os = offscreenRef.current
    os.width = W
    os.height = H
    const ctx = os.getContext('2d')!
    const imgData = ctx.createImageData(W, H)
    const data = imgData.data
    const chs = chargesRef.current
    const step = 2 // compute every 2nd pixel, fill 2x2 block
    for (let py = 0; py < H; py += step) {
      for (let px = 0; px < W; px += step) {
        const V = getPotential(chs, px, py)
        const [r, g, b] = potToColor(V)
        for (let dy = 0; dy < step && py + dy < H; dy++) {
          for (let dx = 0; dx < step && px + dx < W; dx++) {
            const idx = ((py + dy) * W + (px + dx)) * 4
            data[idx] = r
            data[idx + 1] = g
            data[idx + 2] = b
            data[idx + 3] = 200
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0)
    needsHeatmapRef.current = false
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    if (needsHeatmapRef.current) buildHeatmap(W, H)

    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    if (offscreenRef.current) {
      ctx.drawImage(offscreenRef.current, 0, 0)
    }

    const chs = chargesRef.current

    // E-field arrows (white, sparser)
    const gs = 52
    for (let gx = gs; gx < W; gx += gs) {
      for (let gy = gs; gy < H; gy += gs) {
        const { ex, ey } = getField(chs, gx, gy)
        const mag = Math.hypot(ex, ey)
        if (mag < 1e-4) continue
        const len = Math.min(mag * 800, 18)
        const nx = ex / mag, ny = ey / mag
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(gx - nx * len / 2, gy - ny * len / 2)
        ctx.lineTo(gx + nx * len / 2, gy + ny * len / 2)
        ctx.stroke()
        const ax = gx + nx * len / 2, ay = gy + ny * len / 2
        ctx.fillStyle = 'rgba(255,255,255,0.45)'
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax - nx * 5 + ny * 3, ay - ny * 5 - nx * 3)
        ctx.lineTo(ax - nx * 5 - ny * 3, ay - ny * 5 + nx * 3)
        ctx.closePath()
        ctx.fill()
      }
    }

    // Test particle
    const tc = particleRef.current
    if (tc.active || released) {
      ctx.fillStyle = '#4fde98'
      ctx.shadowColor = '#4fde98'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(tc.x, tc.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', tc.x, tc.y)
      ctx.textBaseline = 'alphabetic'
    }

    // Charges
    for (const c of chs) {
      const color = c.q > 0 ? '#4f8ef7' : '#f75f5f'
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 38)
      glow.addColorStop(0, color + '88')
      glow.addColorStop(1, color + '00')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(c.x, c.y, 38, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(c.x, c.y, 17, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.q > 0 ? '+' : '−', c.x, c.y)
      ctx.textBaseline = 'alphabetic'
    }

    // Hover V display
    if (hoverV) {
      ctx.fillStyle = 'rgba(30,30,50,0.8)'
      ctx.fillRect(8, 8, 160, 26)
      ctx.fillStyle = '#e8e8f0'
      ctx.font = '12px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`V = ${hoverV} V`, 14, 26)
    }

    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Warm = high V  |  Cool = low V  |  White arrows = E-field direction', W / 2, H - 10)
  }, [buildHeatmap, hoverV, released])

  // Particle physics
  useEffect(() => {
    if (!released || !isPlaying) return
    const interval = setInterval(() => {
      const tc = particleRef.current
      const { ex, ey } = getField(chargesRef.current, tc.x, tc.y)
      const mag = Math.hypot(ex, ey)
      if (mag < 1e-5) return
      const accel = 3 * speed
      const nx = ex / mag, ny = ey / mag
      const nvx = tc.vx + nx * accel * 0.08
      const nvy = tc.vy + ny * accel * 0.08
      const damp = 0.96
      const nx2 = tc.x + nvx
      const ny2 = tc.y + nvy
      const canvas = canvasRef.current
      if (canvas && (nx2 < 0 || nx2 > canvas.width || ny2 < 0 || ny2 > canvas.height)) {
        particleRef.current = { x: canvas.width / 2, y: 60, vx: 0, vy: 0, active: false }
        setReleased(false)
        return
      }
      particleRef.current = { x: nx2, y: ny2, vx: nvx * damp, vy: nvy * damp, active: true }
    }, 16)
    return () => clearInterval(interval)
  }, [released, isPlaying, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth || 600
    canvas.height = canvas.offsetHeight || 450
    needsHeatmapRef.current = true
    const resizer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth || 600
      canvas.height = canvas.offsetHeight || 450
      needsHeatmapRef.current = true
    })
    resizer.observe(canvas)
    const loop = () => { draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(animRef.current); resizer.disconnect() }
  }, [draw])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const idx = chargesRef.current.findIndex(c => Math.hypot(c.x - x, c.y - y) < 20)
    if (idx >= 0) {
      setCharges(cs => cs.filter((_, i) => i !== idx))
    } else if (chargesRef.current.length < 4) {
      const q = e.button === 2 ? -2 : 2
      setCharges(cs => [...cs, { x, y, q }])
      onConceptInteract?.('electric-potential')
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const V = getPotential(chargesRef.current, x, y)
    setHoverV(isFinite(V) ? V.toFixed(2) : '∞')
  }

  const handleRelease = () => {
    const canvas = canvasRef.current
    particleRef.current = { x: canvas ? canvas.width / 2 : 300, y: 50, vx: 0, vy: 0, active: true }
    setReleased(true)
    onConceptInteract?.('potential-gradient')
  }

  return (
    <div className="space-y-4">
      <div className="text-[#8888aa] text-xs text-center">
        Left-click to add + charge · Right-click to add − charge · Click charge to remove · Max 4
      </div>
      <div
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[70vh]' : 'h-[420px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onClick={handleClick}
          onContextMenu={e => { e.preventDefault(); handleClick(e) }}
          onMouseMove={handleMouseMove}
        />
      </div>

      {!isFocusMode && (
        <div className="flex gap-3">
          <button
            onClick={handleRelease}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[#4fde98] text-[#0f0f14] hover:bg-[#3fc880] transition-colors"
          >
            Release Test Charge
          </button>
          <button
            onClick={() => {
              setCharges([{ x: 200, y: 200, q: 2 }, { x: 400, y: 200, q: -2 }])
              particleRef.current = { x: 300, y: 80, vx: 0, vy: 0, active: false }
              setReleased(false)
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  )
}
