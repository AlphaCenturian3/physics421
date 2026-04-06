import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

interface Electron {
  x: number
  y: number
  lane: number
}

export default function CurrentResistance({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const electronsRef = useRef<Electron[]>([])
  const lastParamsRef = useRef({ resistance: 0, wireWidth: 0 })

  const [resistance, setResistance] = useState(50) // 10–100 (high = more resistance)
  const [wireWidth, setWireWidth] = useState(60)   // px half-height of conductor
  const VOLTAGE = 12

  // Initialize electrons when params change
  const initElectrons = useCallback((wireH: number, count: number, W: number) => {
    const electrons: Electron[] = []
    for (let i = 0; i < count; i++) {
      electrons.push({
        x: Math.random() * W,
        y: 0,
        lane: i,
      })
    }
    electronsRef.current = electrons
  }, [])

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const wireH = wireWidth
    const wireTop = H / 2 - wireH / 2
    const wireBot = H / 2 + wireH / 2

    const numLanes = Math.max(2, Math.floor(wireH / 16))
    const numElectrons = Math.min(20, numLanes * 3)
    const current = VOLTAGE / resistance // I = V/R

    // Init electrons if params changed
    if (
      lastParamsRef.current.resistance !== resistance ||
      lastParamsRef.current.wireWidth !== wireWidth
    ) {
      initElectrons(wireH, numElectrons, W)
      lastParamsRef.current = { resistance, wireWidth }
    }

    // Wire body
    const wireGrad = ctx.createLinearGradient(0, wireTop, 0, wireBot)
    wireGrad.addColorStop(0, '#2a3050')
    wireGrad.addColorStop(0.5, '#1e2540')
    wireGrad.addColorStop(1, '#2a3050')
    ctx.fillStyle = wireGrad
    ctx.fillRect(0, wireTop, W, wireH)
    ctx.strokeStyle = '#3a4570'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, wireTop, W, wireH)

    // Resistor symbol in the middle
    const rX = W / 2 - 50, rY = wireTop + wireH / 4, rW = 100, rH = wireH / 2
    ctx.fillStyle = '#1a1a2a'
    ctx.fillRect(rX, rY, rW, rH)
    ctx.strokeStyle = '#f7a94f'
    ctx.lineWidth = 1.5
    ctx.strokeRect(rX, rY, rW, rH)
    ctx.fillStyle = '#f7a94f'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`R = ${resistance} Ω`, W / 2, H / 2)
    ctx.textBaseline = 'alphabetic'

    // Update and draw electrons
    const electronSpeed = Math.max(0.5, (VOLTAGE / resistance) * 3) * speed
    const scatterProb = resistance / 100 * 0.02

    for (let i = 0; i < electronsRef.current.length; i++) {
      const e = electronsRef.current[i]
      // Lane assignment (evenly spaced vertically)
      const laneIndex = i % numLanes
      const targetY = wireTop + (laneIndex + 0.5) * (wireH / numLanes)

      if (isPlaying) {
        // Drift to the right (conventional current left→right means electrons right→left... let's keep visual simple: electrons drift left)
        e.x -= electronSpeed
        // Scatter occasionally (jitter from resistor)
        if (Math.random() < scatterProb) {
          e.y += (Math.random() - 0.5) * 8
        }
        // Pull back to lane
        e.y += (targetY - e.y) * 0.08
        e.y = Math.max(wireTop + 4, Math.min(wireBot - 4, e.y))
        // Wrap around
        if (e.x < -8) e.x = W + 8
      } else {
        e.y = targetY
      }

      // Draw electron (blue dot with glow)
      const alpha = 0.7 + 0.3 * Math.sin(t * 0.05 + i * 0.5)
      ctx.fillStyle = `rgba(79,142,247,${alpha})`
      ctx.shadowColor = '#4f8ef7'
      ctx.shadowBlur = 5
      ctx.beginPath()
      ctx.arc(e.x, e.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // − label on electrons
      ctx.fillStyle = '#ffffff88'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('−', e.x, e.y)
      ctx.textBaseline = 'alphabetic'
    }

    // Current direction arrow (top of wire)
    ctx.fillStyle = '#4fde98'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('I →', 14, wireTop - 10)
    // Voltage label
    ctx.fillStyle = '#f7a94f'
    ctx.textAlign = 'left'
    ctx.fillText(`V = ${VOLTAGE} V`, 14, H - 10)

    // Info panel
    const A_cross = (wireWidth / 60) * 1e-6 // ~1 mm² at default, in m²
    const J = current / A_cross
    ctx.fillStyle = '#e8e8f0'
    ctx.font = '13px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`I = V/R = ${current.toFixed(2)} A`, W - 14, wireTop - 28)
    ctx.fillText(`J = I/A = ${(J / 1e6).toFixed(2)} MA/m²`, W - 14, wireTop - 10)
    ctx.fillStyle = '#8888aa'
    ctx.font = '11px sans-serif'
    ctx.fillText(`drift speed ∝ ${(electronSpeed).toFixed(1)} rel. units`, W - 14, H - 10)
  }, [resistance, wireWidth, isPlaying, speed, initElectrons])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth || 600
    canvas.height = canvas.offsetHeight || 350
    const resizer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth || 600
      canvas.height = canvas.offsetHeight || 350
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
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[60vh]' : 'h-[320px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {!isFocusMode && (
        <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4 space-y-4">
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Resistance R: <span className="text-white font-mono">{resistance} Ω</span>
              <span className="ml-2 text-xs text-[#f7a94f]">I = {(VOLTAGE / resistance).toFixed(2)} A</span>
            </label>
            <input
              type="range" min="10" max="100" step="5" value={resistance}
              onChange={e => { setResistance(Number(e.target.value)); onConceptInteract?.('ohms-law') }}
              className="w-full accent-[#f7a94f]"
            />
          </div>
          <div>
            <label className="text-[#8888aa] text-sm block mb-1">
              Wire Width (cross-section): <span className="text-white font-mono">{wireWidth} px</span>
            </label>
            <input
              type="range" min="30" max="110" step="5" value={wireWidth}
              onChange={e => { setWireWidth(Number(e.target.value)); onConceptInteract?.('current-density') }}
              className="w-full accent-[#4f8ef7]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
