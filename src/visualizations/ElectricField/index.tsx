import React, { useRef, useEffect, useState, useCallback } from 'react'
import type { VisualizationProps } from '../../types'

interface Charge { x: number; y: number; q: number }
interface TestParticle { x: number; y: number; vx: number; vy: number; active: boolean }

// ── Physics helpers ────────────────────────────────────────────────────────────

function getField(charges: Charge[], px: number, py: number, magnitude = 1) {
  let ex = 0, ey = 0
  for (const c of charges) {
    const dx = px - c.x, dy = py - c.y
    const r2 = dx * dx + dy * dy
    if (r2 < 100) continue
    const r = Math.sqrt(r2)
    const mag = (c.q * magnitude) / r2
    ex += mag * dx / r
    ey += mag * dy / r
  }
  return { ex, ey }
}

function getVoltage(charges: Charge[], px: number, py: number, magnitude = 1) {
  let v = 0
  for (const c of charges) {
    const r = Math.hypot(px - c.x, py - c.y)
    if (r < 5) continue
    v += (c.q * magnitude) / r
  }
  return v
}

function fieldMag(ex: number, ey: number) { return Math.sqrt(ex * ex + ey * ey) }

// Blue (weak) → white (medium) → amber (strong)
function magToColor(mag: number): string {
  const t = Math.min(mag / 0.004, 1)
  if (t < 0.5) {
    const s = t * 2
    const r = Math.round(79  + s * (255 - 79))
    const g = Math.round(142 + s * (220 - 142))
    const b = Math.round(247 + s * (200 - 247))
    return `rgba(${r},${g},${b},${0.45 + s * 0.35})`
  } else {
    const s = (t - 0.5) * 2
    const r = 255
    const g = Math.round(220 - s * (220 - 169))
    const b = Math.round(200 - s * 200)
    return `rgba(${r},${g},${b},${0.8 + s * 0.2})`
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  nx: number, ny: number,
  len: number, col: string,
) {
  const ox = x - nx * len * 0.5, oy = y - ny * len * 0.5
  const tx = x + nx * len * 0.5, ty = y + ny * len * 0.5
  ctx.strokeStyle = col
  ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(tx, ty); ctx.stroke()
  // Clean arrowhead
  const hs = Math.min(len * 0.38, 8)
  ctx.fillStyle = col
  ctx.beginPath()
  ctx.moveTo(tx, ty)
  ctx.lineTo(tx - nx * hs + ny * hs * 0.45, ty - ny * hs - nx * hs * 0.45)
  ctx.lineTo(tx - nx * hs * 0.55, ty - ny * hs * 0.55)
  ctx.lineTo(tx - nx * hs - ny * hs * 0.45, ty - ny * hs + nx * hs * 0.45)
  ctx.closePath(); ctx.fill()
}

// ── Default charge set ─────────────────────────────────────────────────────────

function defaultCharges(W: number, H: number): Charge[] {
  return [
    { x: W * 0.35, y: H * 0.5, q: 1 },
    { x: W * 0.65, y: H * 0.5, q: -1 },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ElectricField({ isPlaying, speed, isFocusMode, onConceptInteract }: VisualizationProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const animRef        = useRef<number>(0)
  const chargesRef     = useRef<Charge[]>([{ x: 200, y: 225, q: 1 }, { x: 400, y: 225, q: -1 }])
  const testRef        = useRef<TestParticle>({ x: 300, y: 55, vx: 0, vy: 0, active: false })
  const tailsRef       = useRef<{ x: number; y: number }[]>([])
  const draggingIdx    = useRef<number>(-1)
  const dragStartRef   = useRef<{ x: number; y: number } | null>(null)
  const dragDistRef    = useRef<number>(0)
  const mousePos       = useRef<{ x: number; y: number } | null>(null)

  const [charges,        setCharges]        = useState<Charge[]>(chargesRef.current)
  const [showLines,      setShowLines]      = useState(true)
  const [showVectors,    setShowVectors]    = useState(false)
  const [showEquipot,    setShowEquipot]    = useState(false)
  const [showTest,       setShowTest]       = useState(false)
  const [chargeMag,      setChargeMag]      = useState(1)
  const chargeMagRef     = useRef(1)

  // keep refs in sync
  useEffect(() => { chargesRef.current = charges }, [charges])
  useEffect(() => { chargeMagRef.current = chargeMag }, [chargeMag])

  // ── Canvas-coordinate helper ────────────────────────────────────────────────

  function canvasXY(e: MouseEvent | React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    const sx     = canvas.width  / rect.width
    const sy     = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top)  * sy,
    }
  }

  // ── Preset builders ─────────────────────────────────────────────────────────

  function applyPreset(name: 'dipole' | 'plus-plus' | 'ring' | 'reset') {
    const canvas = canvasRef.current
    const W = canvas ? canvas.width  : 600
    const H = canvas ? canvas.height : 450
    setShowTest(false)
    tailsRef.current = []
    switch (name) {
      case 'dipole':
      case 'reset':
        setCharges(defaultCharges(W, H))
        break
      case 'plus-plus':
        setCharges([
          { x: W * 0.35, y: H * 0.5, q: 1 },
          { x: W * 0.65, y: H * 0.5, q: 1 },
        ])
        break
      case 'ring': {
        const cx = W * 0.5, cy = H * 0.5
        const r  = Math.min(W, H) * 0.22
        setCharges([
          { x: cx - r, y: cy - r, q:  1 },
          { x: cx + r, y: cy - r, q: -1 },
          { x: cx + r, y: cy + r, q:  1 },
          { x: cx - r, y: cy + r, q: -1 },
        ])
        break
      }
    }
  }

  // ── Test-particle reset ─────────────────────────────────────────────────────

  function resetTestParticle() {
    const canvas = canvasRef.current
    testRef.current = {
      x: canvas ? canvas.width * 0.5 : 300,
      y: 55,
      vx: 0, vy: 0,
      active: true,
    }
    tailsRef.current = []
  }

  // ── Test-particle physics (velocity-Verlet) ─────────────────────────────────

  useEffect(() => {
    if (!showTest || !isPlaying) return
    const id = setInterval(() => {
      const tc  = testRef.current
      if (!tc.active) return
      const chs = chargesRef.current
      const mag = chargeMagRef.current
      const { ex, ey } = getField(chs, tc.x, tc.y, mag)
      const fm  = fieldMag(ex, ey)
      if (fm < 1e-12) return

      const accel    = 0.12 * speed
      const damping  = 0.96
      const nvx = (tc.vx + (ex / fm) * accel) * damping
      const nvy = (tc.vy + (ey / fm) * accel) * damping
      const nx  = tc.x + nvx
      const ny  = tc.y + nvy

      const canvas = canvasRef.current
      if (canvas && (nx < 0 || nx > canvas.width || ny < 0 || ny > canvas.height)) {
        resetTestParticle(); return
      }
      for (const c of chs) {
        if (Math.hypot(nx - c.x, ny - c.y) < 20) { resetTestParticle(); return }
      }
      tailsRef.current = [...tailsRef.current.slice(-60), { x: nx, y: ny }]
      testRef.current  = { ...tc, x: nx, y: ny, vx: nvx, vy: nvy }
    }, 16)
    return () => clearInterval(id)
  }, [showTest, isPlaying, speed])

  // ── Draw ───────────────────────────────────────────────────────────────────

  const drawFieldLines = useCallback((
    ctx: CanvasRenderingContext2D,
    chs: Charge[],
    W: number, H: number,
    mag: number,
  ) => {
    const NUM = 14, STEP = 4, MAX_STEPS = 380
    for (const src of chs) {
      if (src.q <= 0) continue
      for (let i = 0; i < NUM; i++) {
        const angle = (i / NUM) * Math.PI * 2
        let x = src.x + 26 * Math.cos(angle)
        let y = src.y + 26 * Math.sin(angle)

        const pts: [number, number][] = []
        for (let s = 0; s < MAX_STEPS; s++) {
          if (x < -5 || x > W + 5 || y < -5 || y > H + 5) break
          let nearNeg = false
          for (const c of chs) {
            if (c.q < 0 && Math.hypot(x - c.x, y - c.y) < 20) { nearNeg = true; break }
          }
          if (nearNeg) break
          pts.push([x, y])
          const { ex, ey } = getField(chs, x, y, mag)
          const fm = fieldMag(ex, ey)
          if (fm < 1e-12) break
          x += (ex / fm) * STEP
          y += (ey / fm) * STEP
        }

        if (pts.length < 2) continue

        // Gradient stroke
        const grad = ctx.createLinearGradient(
          pts[0][0], pts[0][1],
          pts[pts.length - 1][0], pts[pts.length - 1][1],
        )
        grad.addColorStop(0, 'rgba(90, 150, 255, 0.7)')
        grad.addColorStop(1, 'rgba(90, 150, 255, 0.15)')
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (const [px, py] of pts) ctx.lineTo(px, py)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.6
        ctx.stroke()

        // Direction arrowheads along line
        for (let ti = 35; ti < pts.length - 5; ti += 55) {
          const [px, py] = pts[ti]
          const [nx2, ny2] = pts[ti + 1]
          const dx = nx2 - px, dy = ny2 - py
          const d  = Math.hypot(dx, dy) || 1
          drawArrow(ctx, px, py, dx / d, dy / d, 11, 'rgba(140,185,255,0.9)')
        }
      }
    }
  }, [])

  const drawEquipotentials = useCallback((
    ctx: CanvasRenderingContext2D,
    chs: Charge[],
    W: number, H: number,
    mag: number,
  ) => {
    const GRID = 40
    const cols = Math.ceil(W / GRID) + 1
    const rows = Math.ceil(H / GRID) + 1

    // Build voltage grid
    const vGrid: number[][] = []
    let vMin = Infinity, vMax = -Infinity
    for (let row = 0; row < rows; row++) {
      vGrid[row] = []
      for (let col = 0; col < cols; col++) {
        const v = getVoltage(chs, col * GRID, row * GRID, mag)
        vGrid[row][col] = v
        if (isFinite(v)) { vMin = Math.min(vMin, v); vMax = Math.max(vMax, v) }
      }
    }
    if (!isFinite(vMin) || !isFinite(vMax) || vMax - vMin < 1e-6) return

    // Pick ~7 evenly-spaced threshold levels
    const NUM_LEVELS = 7
    const levels: number[] = []
    for (let i = 1; i < NUM_LEVELS; i++) {
      levels.push(vMin + (vMax - vMin) * (i / NUM_LEVELS))
    }

    ctx.strokeStyle = 'rgba(160, 120, 255, 0.35)'
    ctx.lineWidth   = 1.2

    for (const level of levels) {
      // Marching squares (simplified edge scan)
      for (let row = 0; row < rows - 1; row++) {
        for (let col = 0; col < cols - 1; col++) {
          const x0 = col * GRID, y0 = row * GRID
          const v00 = vGrid[row][col]
          const v10 = vGrid[row][col + 1]
          const v01 = vGrid[row + 1][col]
          const v11 = vGrid[row + 1][col + 1]

          if (!isFinite(v00) || !isFinite(v10) || !isFinite(v01) || !isFinite(v11)) continue

          // For each edge, if the level crosses, interpolate crossing point
          const crossings: [number, number][] = []

          const addCross = (ax: number, ay: number, bx: number, by: number, va: number, vb: number) => {
            if ((va - level) * (vb - level) < 0) {
              const t = (level - va) / (vb - va)
              crossings.push([ax + t * (bx - ax), ay + t * (by - ay)])
            }
          }

          addCross(x0, y0,        x0 + GRID, y0,        v00, v10) // top
          addCross(x0 + GRID, y0, x0 + GRID, y0 + GRID, v10, v11) // right
          addCross(x0, y0 + GRID, x0 + GRID, y0 + GRID, v01, v11) // bottom
          addCross(x0, y0,        x0, y0 + GRID,         v00, v01) // left

          if (crossings.length === 2) {
            ctx.beginPath()
            ctx.moveTo(crossings[0][0], crossings[0][1])
            ctx.lineTo(crossings[1][0], crossings[1][1])
            ctx.stroke()
          }
        }
      }
    }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W   = canvas.width, H = canvas.height
    const chs = chargesRef.current
    const mag = chargeMagRef.current

    // Background + dot grid
    ctx.fillStyle = '#1a1a28'
    ctx.fillRect(0, 0, W, H)
    const GRID = 32
    ctx.fillStyle = 'rgba(255,255,255,0.035)'
    for (let gx = 0; gx < W; gx += GRID) {
      for (let gy = 0; gy < H; gy += GRID) {
        ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill()
      }
    }

    // Equipotential lines
    if (showEquipot) drawEquipotentials(ctx, chs, W, H, mag)

    // Vector field grid
    if (showVectors) {
      const gs = 46
      for (let gx = gs / 2; gx < W; gx += gs) {
        for (let gy = gs / 2; gy < H; gy += gs) {
          const { ex, ey } = getField(chs, gx, gy, mag)
          const fm = fieldMag(ex, ey)
          if (fm < 1e-10) continue
          const len = Math.max(6, Math.min(fm * 5000, 20))
          const col = magToColor(fm)
          drawArrow(ctx, gx, gy, ex / fm, ey / fm, len, col)
        }
      }
    }

    // Field lines
    if (showLines) drawFieldLines(ctx, chs, W, H, mag)

    // Test particle + trail
    if (showTest) {
      const tc = testRef.current
      // Trail (fading)
      const trail = tailsRef.current
      for (let ti = 1; ti < trail.length; ti++) {
        const alpha = (ti / trail.length) * 0.5
        ctx.strokeStyle = `rgba(79,222,152,${alpha})`
        ctx.lineWidth   = 2
        ctx.beginPath()
        ctx.moveTo(trail[ti - 1].x, trail[ti - 1].y)
        ctx.lineTo(trail[ti].x,     trail[ti].y)
        ctx.stroke()
      }
      // Glow
      const grd = ctx.createRadialGradient(tc.x, tc.y, 0, tc.x, tc.y, 18)
      grd.addColorStop(0, 'rgba(79,222,152,0.55)')
      grd.addColorStop(1, 'rgba(79,222,152,0)')
      ctx.fillStyle = grd
      ctx.beginPath(); ctx.arc(tc.x, tc.y, 18, 0, Math.PI * 2); ctx.fill()
      // Body
      ctx.fillStyle = '#4fde98'
      ctx.beginPath(); ctx.arc(tc.x, tc.y, 8, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px Inter, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('+q', tc.x, tc.y)
    }

    // Charges
    for (let ci = 0; ci < chs.length; ci++) {
      const c   = chs[ci]
      const col = c.q > 0 ? '#4f8ef7' : '#f77f7f'
      const isDragging = draggingIdx.current === ci

      // Outer glow (brighter when dragging)
      const glowR = isDragging ? 54 : 44
      const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, glowR)
      grd.addColorStop(0, col + (isDragging ? '60' : '40'))
      grd.addColorStop(1, col + '00')
      ctx.fillStyle = grd
      ctx.beginPath(); ctx.arc(c.x, c.y, glowR, 0, Math.PI * 2); ctx.fill()

      // Body
      ctx.fillStyle = col
      ctx.beginPath(); ctx.arc(c.x, c.y, 18, 0, Math.PI * 2); ctx.fill()

      // Border
      ctx.strokeStyle = c.q > 0 ? '#7ab4ff' : '#ff9999'
      ctx.lineWidth = isDragging ? 2.5 : 1.5
      ctx.stroke()

      // ± label
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 16px Inter, sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(c.q > 0 ? '+' : '−', c.x, c.y)
    }

    // Hover tooltip: show "q+" or "q−" label above nearby charge
    if (mousePos.current) {
      const { x: mx, y: my } = mousePos.current
      for (const c of chs) {
        const dist = Math.hypot(c.x - mx, c.y - my)
        if (dist < 32) {
          const label = c.q > 0 ? 'q⁺' : 'q⁻'
          const tx = c.x, ty = c.y - 32
          // Callout bubble
          ctx.fillStyle = 'rgba(30,30,50,0.85)'
          ctx.strokeStyle = c.q > 0 ? '#4f8ef7' : '#f77f7f'
          ctx.lineWidth = 1
          const tw = 34, th = 20
          ctx.beginPath()
          ctx.roundRect(tx - tw / 2, ty - th / 2, tw, th, 5)
          ctx.fill(); ctx.stroke()
          // Tiny caret down
          ctx.fillStyle = 'rgba(30,30,50,0.85)'
          ctx.beginPath()
          ctx.moveTo(tx - 5, ty + th / 2)
          ctx.lineTo(tx + 5, ty + th / 2)
          ctx.lineTo(tx,     ty + th / 2 + 6)
          ctx.closePath(); ctx.fill()
          ctx.strokeStyle = c.q > 0 ? '#4f8ef7' : '#f77f7f'
          ctx.lineWidth = 1
          ctx.stroke()
          // Label text
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 12px Inter, sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(label, tx, ty)
          break
        }
      }
    }

    // Instruction hint (no charges added beyond default)
    if (chs.length <= 2 && !showTest) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.font = '11.5px Inter, sans-serif'
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'
      ctx.fillText('Drag charges  ·  Left-click canvas to add +  ·  Right-click for −', 14, H - 10)
    }
  }, [showLines, showVectors, showEquipot, showTest, drawFieldLines, drawEquipotentials])

  // ── Animation loop + resize ─────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1
      const w   = canvas.offsetWidth  || 600
      const h   = canvas.offsetHeight || 460
      canvas.width  = w * dpr
      canvas.height = h * dpr
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      canvas.style.width  = w + 'px'
      canvas.style.height = h + 'px'
    }
    setSize()

    const ro = new ResizeObserver(setSize)
    ro.observe(canvas)

    let rafId: number
    const loop = () => { draw(); rafId = requestAnimationFrame(loop) }
    rafId = requestAnimationFrame(loop)

    return () => { cancelAnimationFrame(rafId); ro.disconnect() }
  }, [draw])

  // ── Mouse event handlers ────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const { x, y } = canvasXY(e)
    dragStartRef.current  = { x, y }
    dragDistRef.current   = 0

    const hit = chargesRef.current.findIndex(c => Math.hypot(c.x - x, c.y - y) < 22)
    if (hit >= 0) {
      draggingIdx.current = hit
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = canvasXY(e)
    mousePos.current = { x, y }

    if (draggingIdx.current >= 0 && dragStartRef.current) {
      const dx = x - dragStartRef.current.x, dy = y - dragStartRef.current.y
      dragDistRef.current = Math.hypot(dx, dy)

      setCharges(cs =>
        cs.map((c, i) =>
          i === draggingIdx.current ? { ...c, x, y } : c,
        ),
      )
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const { x, y } = canvasXY(e)
    const wasDragging = draggingIdx.current >= 0
    draggingIdx.current = -1

    // Only fire add/remove if not a real drag
    if (dragDistRef.current < 5) {
      if (wasDragging) {
        // click on existing charge: remove it
        const hit = chargesRef.current.findIndex(c => Math.hypot(c.x - x, c.y - y) < 22)
        if (hit >= 0) {
          setCharges(cs => cs.filter((_, i) => i !== hit))
        }
      } else {
        // click on empty canvas
        const hit = chargesRef.current.findIndex(c => Math.hypot(c.x - x, c.y - y) < 22)
        if (hit < 0 && chargesRef.current.length < 5) {
          const q = e.button === 2 ? -1 : 1
          setCharges(cs => [...cs, { x, y, q }])
          onConceptInteract?.('charge-placed')
        }
      }
    }

    dragStartRef.current = null
    dragDistRef.current  = 0
  }

  const handleMouseLeave = () => {
    mousePos.current = null
    draggingIdx.current = -1
    dragStartRef.current = null
    dragDistRef.current  = 0
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
  }

  // ── Button style helper ─────────────────────────────────────────────────────

  const btn = (active: boolean, accent = 'var(--accent-blue)'): React.CSSProperties => ({
    padding:      '0.375rem 0.8rem',
    borderRadius: '7px',
    fontSize:     '0.8rem',
    fontWeight:   600,
    border:       `1px solid ${active ? accent : 'var(--border)'}`,
    background:   active ? accent : 'transparent',
    color:        active ? '#fff' : 'var(--text-secondary)',
    cursor:       'pointer',
    transition:   'all 0.15s',
    whiteSpace:   'nowrap' as const,
  })

  const presetBtn = (): React.CSSProperties => ({
    ...btn(false),
    background:   'rgba(255,255,255,0.04)',
    border:       '1px solid rgba(255,255,255,0.12)',
    color:        'var(--text-secondary)',
  })

  const testBtnStyle: React.CSSProperties = {
    ...btn(showTest),
    background:   showTest ? '#4fde98' : 'transparent',
    borderColor:  showTest ? '#4fde98' : 'var(--border)',
    color:        showTest ? '#0d0d12' : 'var(--text-secondary)',
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        style={{
          width:        '100%',
          height:       isFocusMode ? '70vh' : '460px',
          borderRadius: '12px',
          border:       '1px solid var(--border)',
          cursor:       draggingIdx.current >= 0 ? 'grabbing' : 'crosshair',
          display:      'block',
        }}
      />

      {!isFocusMode && (
        <div style={{
          display:      'flex',
          flexDirection:'column',
          gap:          '0.5rem',
          padding:      '0.6rem 0.75rem',
          background:   'rgba(255,255,255,0.03)',
          borderRadius: '10px',
          border:       '1px solid var(--border)',
        }}>
          {/* Row 1: toggles */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button style={btn(showLines)}
              onClick={() => { setShowLines(v => !v); onConceptInteract?.('field-lines') }}>
              Field Lines
            </button>
            <button style={btn(showVectors)}
              onClick={() => { setShowVectors(v => !v); onConceptInteract?.('field-vectors') }}>
              Vector Grid
            </button>
            <button style={btn(showEquipot, '#a078ff')}
              onClick={() => { setShowEquipot(v => !v); onConceptInteract?.('equipotential') }}>
              Equipotentials
            </button>
            <button style={testBtnStyle}
              onClick={() => {
                resetTestParticle()
                setShowTest(true)
                onConceptInteract?.('test-charge')
              }}>
              Release Test Charge
            </button>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {charges.length}/5 charges
            </span>
          </div>

          {/* Row 2: presets */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Presets:</span>
            <button style={presetBtn()} onClick={() => applyPreset('dipole')}>Dipole</button>
            <button style={presetBtn()} onClick={() => applyPreset('plus-plus')}>+ +</button>
            <button style={presetBtn()} onClick={() => applyPreset('ring')}>Ring</button>
            <button style={presetBtn()} onClick={() => applyPreset('reset')}>Reset</button>
          </div>

          {/* Row 3: charge magnitude slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Charge magnitude:
            </span>
            <input
              type="range"
              min={1} max={5} step={1}
              value={chargeMag}
              onChange={e => setChargeMag(Number(e.target.value))}
              style={{ flex: 1, maxWidth: '160px', accentColor: '#4f8ef7', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '1.2rem' }}>
              {chargeMag}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
