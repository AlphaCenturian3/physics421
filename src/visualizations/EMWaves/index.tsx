import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

export default function EMWaves({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)
  const [wavelength, setWavelength] = useState(200)  // px (visual)
  const [showPolarization, setShowPolarization] = useState(false)
  const [show3D, setShow3D] = useState(false)

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#0f0f14'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2
    const phase = t * 0.04 * speed
    const k = (2 * Math.PI) / wavelength
    const amplitude = 80

    // Propagation axis (z-axis, left to right)
    ctx.strokeStyle = '#2a2a40'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, cy)
    ctx.lineTo(W - 20, cy)
    ctx.stroke()
    ctx.fillStyle = '#333355'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('→ propagation (z)', W - 22, cy - 6)

    // E-field wave (vertical, red/orange)
    ctx.strokeStyle = '#f75f5f'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let px = 20; px < W - 20; px++) {
      const z = px - cx
      const Ey = amplitude * Math.sin(k * z - phase)
      if (px === 20) ctx.moveTo(px, cy - Ey)
      else ctx.lineTo(px, cy - Ey)
    }
    ctx.stroke()

    // B-field wave (horizontal oscillating in z-x plane, shown as depth cue)
    if (show3D) {
      // Draw B as horizontal lines (coming in/out of screen) using perspective projection
      const nArrows = Math.floor((W - 40) / 20)
      for (let i = 0; i < nArrows; i++) {
        const px = 20 + i * 20
        const z = px - cx
        const Bx = amplitude * 0.6 * Math.sin(k * z - phase)
        // 3D projection: x displacement → horizontal + vertical (isometric)
        const projX = Bx * 0.7, projY = Bx * 0.3
        ctx.strokeStyle = `rgba(79,142,247,${0.6 + 0.4 * Math.abs(Math.sin(k * z - phase))})`
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(px, cy)
        ctx.lineTo(px + projX, cy + projY)
        ctx.stroke()
        if (Math.abs(Bx) > 5) {
          const sign = Math.sign(Bx)
          ctx.fillStyle = 'rgba(79,142,247,0.8)'
          ctx.beginPath()
          ctx.moveTo(px + projX, cy + projY)
          ctx.lineTo(px + projX - sign * 5, cy + projY - 3)
          ctx.lineTo(px + projX - sign * 5, cy + projY + 3)
          ctx.closePath()
          ctx.fill()
        }
      }
      ctx.fillStyle = '#4f8ef7'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('B (x-direction)', 24, cy + 60)
    } else {
      // B-field as color shading below axis
      ctx.strokeStyle = '#4f8ef7'
      ctx.lineWidth = 2.5
      const nArrows2 = Math.floor((W - 40) / 20)
      for (let i = 0; i < nArrows2; i++) {
        const px = 20 + i * 20
        const z = px - cx
        const Bx = amplitude * 0.5 * Math.sin(k * z - phase)
        if (Math.abs(Bx) < 4) continue
        const sign = Math.sign(Bx)
        ctx.strokeStyle = `rgba(79,142,247,0.65)`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(px - Math.abs(Bx) * 0.5, cy + 30)
        ctx.lineTo(px + Math.abs(Bx) * 0.5, cy + 30)
        ctx.stroke()
        ctx.fillStyle = 'rgba(79,142,247,0.7)'
        ctx.beginPath()
        ctx.moveTo(px + sign * Math.abs(Bx) * 0.5, cy + 30)
        ctx.lineTo(px + sign * Math.abs(Bx) * 0.5 - sign * 6, cy + 25)
        ctx.lineTo(px + sign * Math.abs(Bx) * 0.5 - sign * 6, cy + 35)
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = '#4f8ef7'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('B (x-direction, top view)', 24, cy + 46)
    }

    // E-field label
    ctx.fillStyle = '#f75f5f'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('E (y-direction)', 24, cy - amplitude - 14)

    // Polarization filter
    if (showPolarization) {
      const filterX = cx + 80
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fillRect(filterX - 8, 30, 16, H - 60)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(filterX - 8, 30, 16, H - 60)
      // Vertical slit
      for (let y = 40; y < H - 40; y += 12) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(filterX - 6, y)
        ctx.lineTo(filterX + 6, y)
        ctx.stroke()
      }
      ctx.fillStyle = '#ffffff88'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('↕', filterX, H - 50)
      ctx.fillText('Polarizer', filterX, H - 36)
    }

    // Wavelength and frequency info
    const lambda_m = (wavelength / 200) * 550e-9 // map to visible range
    const c = 3e8
    const f = c / lambda_m
    const E_phot = 6.626e-34 * f

    ctx.fillStyle = '#e8e8f0'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`λ = ${(lambda_m * 1e9).toFixed(0)} nm  |  f = ${(f / 1e14).toFixed(2)} × 10¹⁴ Hz  |  E = ${(E_phot * 1e19).toFixed(2)} × 10⁻¹⁹ J`, cx, H - 38)
    ctx.fillText(`c = λf = ${(lambda_m * f / 1e8).toFixed(2)} × 10⁸ m/s  =  c`, cx, H - 16)

    // EM spectrum bar
    const specW = W - 40, specH = 14
    const specY = H - 60
    const grad = ctx.createLinearGradient(20, specY, 20 + specW, specY)
    grad.addColorStop(0, '#8800ff')     // UV
    grad.addColorStop(0.14, '#4400ff') // violet
    grad.addColorStop(0.25, '#0055ff') // blue
    grad.addColorStop(0.4, '#00cc44')  // green
    grad.addColorStop(0.55, '#cccc00') // yellow
    grad.addColorStop(0.7, '#ff6600')  // orange
    grad.addColorStop(0.85, '#ff0000') // red
    grad.addColorStop(1, '#cc0000')    // IR
    ctx.fillStyle = grad
    ctx.fillRect(20, specY, specW, specH)

    // Marker on spectrum
    const markerFrac = Math.max(0, Math.min(1, (wavelength - 60) / (340)))
    const markerX = 20 + markerFrac * specW
    ctx.fillStyle = '#fff'
    ctx.fillRect(markerX - 1, specY - 6, 2, specH + 12)

    ctx.fillStyle = '#8888aa'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('UV  Violet  Blue  Green  Yellow  Orange  Red  IR', 20, specY - 4)
  }, [wavelength, showPolarization, show3D, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth || 600
    canvas.height = canvas.offsetHeight || 440
    const resizer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth || 600
      canvas.height = canvas.offsetHeight || 440
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
        className={`relative rounded-2xl overflow-hidden border border-[#2a2a40] ${isFocusMode ? 'h-[70vh]' : 'h-[420px]'}`}
        style={{ background: '#0f0f14' }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      {!isFocusMode && (
        <div className="space-y-4">
          <div className="bg-[#1a1a24] border border-[#2a2a40] rounded-xl p-4">
            <label className="text-[#8888aa] text-sm block mb-1">
              Wavelength: <span className="text-white font-mono">{((wavelength / 200) * 550).toFixed(0)} nm</span>
              <span className="ml-2 text-xs text-[#8888aa]">(visual scale)</span>
            </label>
            <input type="range" min="60" max="400" step="10" value={wavelength}
              onChange={e => { setWavelength(Number(e.target.value)); onConceptInteract?.('em-spectrum') }}
              className="w-full accent-[#f75f5f]" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShow3D(v => !v); onConceptInteract?.('em-polarization') }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${show3D ? 'bg-[#4f8ef7] text-white' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}>
              3D Perspective
            </button>
            <button onClick={() => { setShowPolarization(v => !v); onConceptInteract?.('em-polarization') }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showPolarization ? 'bg-[#f7a94f] text-[#0f0f14]' : 'bg-[#1a1a24] border border-[#2a2a40] text-[#8888aa] hover:text-white'}`}>
              Polarizer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
