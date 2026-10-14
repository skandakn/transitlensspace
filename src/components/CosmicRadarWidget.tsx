import React, { useEffect, useRef, useState } from 'react'
import { Radio, Activity, Sparkles, Orbit, Disc } from 'lucide-react'
import { cn } from '../lib/utils'

interface CosmicRadarWidgetProps {
  isCollapsed?: boolean
}

type DisplayMode = 'dual' | 'radar' | 'flux'

interface TargetPlanet {
  name: string
  radiusFraction: number // 0 to 1
  angle: number // radians
  color: string
  period: string
  depth: string
  lastSwept: number
}

interface StarParticle {
  x: number
  y: number
  r: number
  color: string
  speedY: number
  speedX: number
  alpha: number
  pulseSpeed: number
  pulseOffset: number
}

interface CosmicRay {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  alpha: number
  color: string
}

export function CosmicRadarWidget({ isCollapsed = false }: CosmicRadarWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mode, setMode] = useState<DisplayMode>('dual')
  const [activeCandidate, setActiveCandidate] = useState<string>('TOI-700 d')
  const [telemetrySignal, setTelemetrySignal] = useState<{
    snr: string
    phase: string
    flux: string
    status: string
  }>({
    snr: '28.4',
    phase: '0.42',
    flux: '0.9918',
    status: 'LOCKED'
  })

  // If collapsed, render the compact animated radar orb
  if (isCollapsed) {
    return <MiniCosmicRadarOrb />
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-[150px] flex flex-col justify-between my-1.5 p-2.5 rounded-2xl bg-gradient-to-b from-slate-950/80 via-purple-950/40 to-slate-950/90 border border-violet-500/35 backdrop-blur-md shadow-[0_0_24px_rgba(139,92,246,0.22)] overflow-hidden group/radar select-none"
    >
      {/* 1. HTML5 Canvas Animation Layer (Starfield + Radar + Transit Flux) */}
      <CosmicCanvas
        mode={mode}
        onCandidateDetected={(name, snr, flux) => {
          setActiveCandidate(name)
          setTelemetrySignal((prev) => ({
            ...prev,
            snr,
            flux,
            status: 'SWEEP HIT'
          }))
        }}
      />

      {/* 2. Top Header Telemetry & Mode Selector */}
      <div className="relative z-10 flex items-center justify-between gap-1 pb-1 border-b border-violet-500/25">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          </span>
          <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-300 truncate flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            COSMIC RADAR
          </span>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-violet-500/30">
          <button
            type="button"
            onClick={() => setMode('radar')}
            className={cn(
              'px-1.5 py-0.5 rounded text-[8px] font-mono tracking-tight transition-all cursor-pointer',
              mode === 'radar'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white'
            )}
            title="Radar Sweep Mode"
          >
            RADAR
          </button>
          <button
            type="button"
            onClick={() => setMode('flux')}
            className={cn(
              'px-1.5 py-0.5 rounded text-[8px] font-mono tracking-tight transition-all cursor-pointer',
              mode === 'flux'
                ? 'bg-violet-500/30 text-violet-200 border border-violet-400/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-white'
            )}
            title="Photometric Transit Flux Stream"
          >
            FLUX
          </button>
          <button
            type="button"
            onClick={() => setMode('dual')}
            className={cn(
              'px-1.5 py-0.5 rounded text-[8px] font-mono tracking-tight transition-all cursor-pointer',
              mode === 'dual'
                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'text-slate-400 hover:text-white'
            )}
            title="Dual Radar + Waveform Telemetry"
          >
            DUAL
          </button>
        </div>
      </div>

      {/* 3. Middle Dynamic Viewport Spacer */}
      <div className="flex-1 min-h-[90px] pointer-events-none" />

      {/* 4. Live Telemetry Strip & Detection Badge */}
      <div className="relative z-10 pt-2 border-t border-violet-500/25 space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Orbit className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-slate-400">TARGET:</span>
            <span className="text-cyan-300 font-semibold">{activeCandidate}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">SNR {telemetrySignal.snr}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-violet-400" />
            FLUX: <span className="text-slate-200">{telemetrySignal.flux}</span>
          </span>
          <span className="flex items-center gap-1 text-[8px] text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
            <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
            KEPLER/TESS STREAM
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * High-performance HTML5 Canvas renderer for the interactive Cosmic Radar & Transit Stream
 */
function CosmicCanvas({
  mode,
  onCandidateDetected
}: {
  mode: DisplayMode
  onCandidateDetected: (name: string, snr: string, flux: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onCandidateDetectedRef = useRef(onCandidateDetected)
  onCandidateDetectedRef.current = onCandidateDetected

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let angle = 0
    let fluxOffset = 0
    let cosmicRays: CosmicRay[] = []
    let lastRayTime = Date.now()

    // Candidates in sector
    const targets: TargetPlanet[] = [
      { name: 'TOI-700 d', radiusFraction: 0.42, angle: 1.15, color: '#22d3ee', period: '37.4 d', depth: '850 ppm', lastSwept: 0 },
      { name: 'Kepler-90 i', radiusFraction: 0.72, angle: 3.65, color: '#c084fc', period: '14.4 d', depth: '420 ppm', lastSwept: 0 },
      { name: 'K2-18 b', radiusFraction: 0.88, angle: 5.15, color: '#38bdf8', period: '32.9 d', depth: '1200 ppm', lastSwept: 0 },
      { name: 'LHS 1140 b', radiusFraction: 0.58, angle: 2.35, color: '#34d399', period: '24.7 d', depth: '980 ppm', lastSwept: 0 }
    ]

    // Initialize 40 drifting stars and stardust particles
    let width = canvas.offsetWidth
    let height = canvas.offsetHeight

    const colors = ['#38bdf8', '#c084fc', '#f472b6', '#22d3ee', '#a78bfa', '#ffffff', '#34d399']
    const particles: StarParticle[] = Array.from({ length: 42 }, () => ({
      x: Math.random() * (width || 250),
      y: Math.random() * (height || 260),
      r: Math.random() * 1.6 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 0.35 + 0.12,
      speedX: (Math.random() - 0.5) * 0.08,
      alpha: Math.random() * 0.6 + 0.3,
      pulseSpeed: Math.random() * 0.005 + 0.002,
      pulseOffset: Math.random() * Math.PI * 2
    }))

    // Handle high-DPI resize observer
    const handleResize = () => {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.resetTransform?.()
      ctx.scale(dpr, dpr)
    }

    handleResize()
    const resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(canvas)

    // Main render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // 1. Drifting background starfield & nebula dust
      particles.forEach((p) => {
        p.y -= p.speedY
        p.x += p.speedX
        if (p.y < 0) {
          p.y = height
          p.x = Math.random() * width
        }
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0

        const pulse = 0.6 + 0.4 * Math.sin(Date.now() * p.pulseSpeed + p.pulseOffset)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha * pulse
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // 2. Occasional shooting star / cosmic ray streak
      const now = Date.now()
      if (now - lastRayTime > 4500 && Math.random() < 0.03) {
        lastRayTime = now
        cosmicRays.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * (height * 0.4),
          vx: Math.random() * 4 + 3,
          vy: Math.random() * 2 + 1.5,
          length: Math.random() * 35 + 20,
          alpha: 1,
          color: Math.random() > 0.5 ? '#22d3ee' : '#e879f9'
        })
      }

      // Draw & update cosmic rays
      cosmicRays = cosmicRays.filter((ray) => ray.alpha > 0.02)
      cosmicRays.forEach((ray) => {
        ray.x += ray.vx
        ray.y += ray.vy
        ray.alpha *= 0.92

        ctx.strokeStyle = ray.color
        ctx.globalAlpha = ray.alpha
        ctx.lineWidth = 1.2
        ctx.shadowColor = ray.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.moveTo(ray.x, ray.y)
        ctx.lineTo(ray.x - ray.vx * 3.5, ray.y - ray.vy * 3.5)
        ctx.stroke()
        ctx.shadowBlur = 0
      })

      // 3. Render either Radar, Transit Flux, or Dual based on mode
      if (mode === 'radar' || mode === 'dual') {
        renderRadar(ctx, width, height, mode === 'dual')
      }

      if (mode === 'flux' || mode === 'dual') {
        renderFluxWaveform(ctx, width, height, mode === 'dual')
      }

      animId = requestAnimationFrame(render)
    }

    // Sub-renderer: Radar Sweep
    const renderRadar = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      isDual: boolean
    ) => {
      // Position radar in center (or upper half if dual)
      const cx = w / 2
      const cy = isDual ? h * 0.38 : h * 0.5
      const maxR = Math.min(w, h) * (isDual ? 0.31 : 0.4)

      angle = (angle + 0.025) % (Math.PI * 2)

      c.save()
      c.translate(cx, cy)

      // Sweep conic gradient cone
      const sweep = c.createConicGradient(angle, 0, 0)
      sweep.addColorStop(0, 'rgba(34, 211, 238, 0.4)')
      sweep.addColorStop(0.08, 'rgba(168, 85, 247, 0.2)')
      sweep.addColorStop(0.24, 'rgba(6, 182, 212, 0)')
      sweep.addColorStop(1, 'rgba(6, 182, 212, 0)')

      c.fillStyle = sweep
      c.beginPath()
      c.arc(0, 0, maxR, 0, Math.PI * 2)
      c.fill()

      // Concentric range rings with distance labels
      const rings = [0.33, 0.66, 1.0]
      const labels = ['0.5 AU', '1.0 AU', '1.5 AU']
      rings.forEach((fraction, idx) => {
        c.lineWidth = 1
        c.strokeStyle = `rgba(34, 211, 238, ${fraction === 1 ? 0.45 : 0.22})`
        c.beginPath()
        c.arc(0, 0, maxR * fraction, 0, Math.PI * 2)
        c.stroke()

        // Ring distance text
        c.fillStyle = 'rgba(148, 163, 184, 0.5)'
        c.font = '8px monospace'
        c.textAlign = 'left'
        c.fillText(labels[idx], 4, -maxR * fraction + 8)
      })

      // Crosshairs
      c.strokeStyle = 'rgba(168, 85, 247, 0.3)'
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(-maxR, 0)
      c.lineTo(maxR, 0)
      c.moveTo(0, -maxR)
      c.lineTo(0, maxR)
      c.stroke()

      // Leading beam line with glowing head
      c.strokeStyle = 'rgba(56, 189, 248, 0.95)'
      c.lineWidth = 1.8
      c.shadowColor = '#22d3ee'
      c.shadowBlur = 8
      c.beginPath()
      c.moveTo(0, 0)
      c.lineTo(Math.cos(angle) * maxR, Math.sin(angle) * maxR)
      c.stroke()
      c.shadowBlur = 0

      // Core center emitter
      c.fillStyle = '#22d3ee'
      c.beginPath()
      c.arc(0, 0, 3, 0, Math.PI * 2)
      c.fill()

      // Exoplanet target blips
      targets.forEach((t) => {
        const tr = maxR * t.radiusFraction
        const tx = Math.cos(t.angle) * tr
        const ty = Math.sin(t.angle) * tr

        // Check if radar beam recently hit this target
        const diff = Math.abs((angle % (Math.PI * 2)) - t.angle)
        const isHit = diff < 0.1 || diff > Math.PI * 2 - 0.1
        if (isHit && Date.now() - t.lastSwept > 1200) {
          t.lastSwept = Date.now()
          onCandidateDetectedRef.current(t.name, (Math.random() * 8 + 22).toFixed(1), (0.991 + Math.random() * 0.003).toFixed(4))
        }

        const timeSinceHit = Date.now() - t.lastSwept
        const pingActive = timeSinceHit < 800
        const pingRatio = pingActive ? timeSinceHit / 800 : 0

        // Expanding echo wave on sweep contact
        if (pingActive) {
          c.strokeStyle = t.color
          c.lineWidth = 1.5 * (1 - pingRatio)
          c.globalAlpha = 0.8 * (1 - pingRatio)
          c.beginPath()
          c.arc(tx, ty, 4 + 14 * pingRatio, 0, Math.PI * 2)
          c.stroke()
        }

        // Target dot
        c.fillStyle = t.color
        c.globalAlpha = 1
        c.shadowColor = t.color
        c.shadowBlur = isHit ? 10 : 4
        c.beginPath()
        c.arc(tx, ty, isHit ? 3.5 : 2.5, 0, Math.PI * 2)
        c.fill()
        c.shadowBlur = 0

        // Target label
        c.fillStyle = isHit ? '#ffffff' : 'rgba(203, 213, 225, 0.8)'
        c.font = '8px monospace'
        c.textAlign = 'left'
        c.fillText(t.name, tx + 6, ty + 3)
      })

      c.restore()
      c.globalAlpha = 1
    }

    // Sub-renderer: Photometric Light Curve Waveform
    const renderFluxWaveform = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      isDual: boolean
    ) => {
      fluxOffset = (fluxOffset + 1.2) % 360

      const waveY = isDual ? h * 0.76 : h * 0.5
      const waveHeight = isDual ? h * 0.16 : h * 0.35
      const waveWidth = w - 24
      const startX = 12

      c.save()

      // Waveform background card
      c.fillStyle = 'rgba(6, 9, 19, 0.45)'
      c.strokeStyle = 'rgba(139, 92, 246, 0.25)'
      c.lineWidth = 1
      c.beginPath()
      c.roundRect(startX, waveY - waveHeight / 2 - 8, waveWidth, waveHeight + 16, 8)
      c.fill()
      c.stroke()

      // Baseline grid line
      c.strokeStyle = 'rgba(148, 163, 184, 0.15)'
      c.setLineDash([4, 4])
      c.beginPath()
      c.moveTo(startX, waveY)
      c.lineTo(startX + waveWidth, waveY)
      c.stroke()
      c.setLineDash([])

      // Generate photometric flux curve with periodic exoplanet transit dips
      c.beginPath()
      c.strokeStyle = '#22d3ee'
      c.lineWidth = 1.8
      c.shadowColor = '#06b6d4'
      c.shadowBlur = 6

      for (let x = 0; x < waveWidth; x += 3) {
        const timeX = (x + fluxOffset) % waveWidth
        const phase = timeX / waveWidth // 0 to 1

        // Periodic transit dip: around phase 0.5
        let dip = 0
        const transitDist = Math.abs(phase - 0.5)
        if (transitDist < 0.1) {
          // U-shaped limb-darkened transit profile
          const normalizedDist = transitDist / 0.1
          dip = (1 - Math.pow(normalizedDist, 4)) * (waveHeight * 0.68)
        }

        // Tiny photometric noise jitter
        const jitter = (Math.sin(x * 0.4 + fluxOffset * 0.2) + Math.cos(x * 0.7)) * 1.5
        const plotY = waveY + dip + jitter

        if (x === 0) {
          c.moveTo(startX + x, plotY)
        } else {
          c.lineTo(startX + x, plotY)
        }
      }
      c.stroke()
      c.shadowBlur = 0

      // Transit Ingress / Egress marker text
      c.fillStyle = '#34d399'
      c.font = '8px monospace'
      c.textAlign = 'center'
      c.fillText('▼ TRANSIT DIP (-0.84%)', startX + waveWidth * 0.5, waveY + waveHeight * 0.65)

      // Live scanning laser cursor
      const cursorX = startX + (fluxOffset % waveWidth)
      c.strokeStyle = 'rgba(244, 114, 182, 0.8)'
      c.lineWidth = 1.2
      c.beginPath()
      c.moveTo(cursorX, waveY - waveHeight / 2 - 4)
      c.lineTo(cursorX, waveY + waveHeight / 2 + 4)
      c.stroke()

      c.fillStyle = '#f472b6'
      c.beginPath()
      c.arc(cursorX, waveY, 3, 0, Math.PI * 2)
      c.fill()

      c.restore()
      c.globalAlpha = 1
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
    }
  }, [mode])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: 'block' }}
    />
  )
}

/**
 * Compact animated radar orb for when the sidebar is collapsed
 */
export function MiniCosmicRadarOrb() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let angle = 0

    const render = () => {
      ctx.clearRect(0, 0, 44, 44)
      angle = (angle + 0.04) % (Math.PI * 2)

      // Outer glowing ring
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(22, 22, 18, 0, Math.PI * 2)
      ctx.stroke()

      // Inner ring
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(22, 22, 10, 0, Math.PI * 2)
      ctx.stroke()

      // Rotating radar beam
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.moveTo(22, 22)
      ctx.lineTo(22 + Math.cos(angle) * 18, 22 + Math.sin(angle) * 18)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Core glowing blip
      ctx.fillStyle = '#34d399'
      ctx.beginPath()
      ctx.arc(22, 22, 2.5, 0, Math.PI * 2)
      ctx.fill()

      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div
      className="my-3 flex flex-col items-center justify-center cursor-pointer group/mini"
      title="Cosmic Exoplanet Radar (Active)"
    >
      <div className="relative w-11 h-11 rounded-xl bg-slate-900/80 border border-violet-500/35 flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.25)] group-hover/mini:border-cyan-400 transition-all">
        <canvas ref={canvasRef} width={44} height={44} className="w-11 h-11" />
      </div>
      <span className="text-[8px] font-mono text-cyan-400/80 mt-1 uppercase tracking-tight">
        RADAR
      </span>
    </div>
  )
}
