import React, { useEffect, useRef, useState } from 'react'
import { Radio, Sparkles, Orbit, Activity, ShieldCheck } from 'lucide-react'

interface CosmicRadarWidgetProps {
  isCollapsed?: boolean
}

interface Exoplanet {
  name: string
  a: number // semi-major axis (px)
  b: number // semi-minor axis (px)
  speed: number // rad / frame
  angle: number
  radius: number
  color: string
  glowColor: string
  tail: { x: number; y: number; alpha: number }[]
  depthPercent: number
  periodDays: number
}

interface Particle {
  x: number
  y: number
  r: number
  color: string
  alpha: number
  speedX: number
  speedY: number
}

interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  color: string
}

export function CosmicRadarWidget({ isCollapsed = false }: CosmicRadarWidgetProps) {
  if (isCollapsed) {
    return <MiniCosmicRadarOrb />
  }

  return <ExpandedCosmicTransitRadar />
}

/**
 * Live Interactive Exoplanet Transit & Radar Observatory
 * Features 3 orbiting exoplanets, coronal star glow, sweeping radar beam,
 * real-time photometric transit detection dips, and interactive gravitational pulse.
 */
function ExpandedCosmicTransitRadar() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activeTransit, setActiveTransit] = useState<{
    planet: string
    depth: number
    duration: string
  } | null>(null)
  const [scanSector, setScanSector] = useState<number>(27)
  const [transitCount, setTransitCount] = useState<number>(14)
  const [recentDips, setRecentDips] = useState<number[]>([1, 1, 1, 0.988, 0.985, 0.99, 1, 1, 1, 0.976, 0.973, 0.98, 1, 1, 1])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let width = canvas.offsetWidth || 260
    let height = canvas.offsetHeight || 190

    // Handle high-DPI
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.scale(dpr, dpr)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.offsetWidth || 260
      height = canvas.offsetHeight || 190
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.resetTransform?.()
      ctx.scale(dpr, dpr)
    }

    const resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(canvas)

    // Center coordinates
    const cx = width / 2
    const cy = height * 0.44

    // 3 Exoplanetary bodies
    const planets: Exoplanet[] = [
      {
        name: 'b (Hot Earth)',
        a: Math.min(width * 0.23, 48),
        b: Math.min(height * 0.17, 24),
        speed: 0.038,
        angle: 0.4,
        radius: 3.2,
        color: '#22d3ee',
        glowColor: 'rgba(34, 211, 238, 0.8)',
        tail: [],
        depthPercent: 1.15,
        periodDays: 2.8
      },
      {
        name: 'c (Habitable Zone)',
        a: Math.min(width * 0.36, 76),
        b: Math.min(height * 0.26, 38),
        speed: 0.022,
        angle: 2.2,
        radius: 4.0,
        color: '#34d399',
        glowColor: 'rgba(52, 211, 153, 0.85)',
        tail: [],
        depthPercent: 2.34,
        periodDays: 9.4
      },
      {
        name: 'd (Sub-Neptune)',
        a: Math.min(width * 0.47, 105),
        b: Math.min(height * 0.34, 52),
        speed: 0.012,
        angle: 4.1,
        radius: 4.8,
        color: '#c084fc',
        glowColor: 'rgba(192, 132, 252, 0.85)',
        tail: [],
        depthPercent: 3.82,
        periodDays: 24.1
      }
    ]

    // Floating background star particles
    const particles: Particle[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.4,
      color: Math.random() > 0.5 ? '#38bdf8' : '#a78bfa',
      alpha: Math.random() * 0.5 + 0.2,
      speedX: (Math.random() - 0.5) * 0.1,
      speedY: -Math.random() * 0.25 - 0.05
    }))

    let shockwaves: Shockwave[] = []
    let radarAngle = 0
    let lastTransitCheck = 0

    // Canvas click emits gravitational wave
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      shockwaves.push({
        x: mx,
        y: my,
        radius: 4,
        maxRadius: 75,
        alpha: 0.9,
        color: '#22d3ee'
      })
    }
    canvas.addEventListener('click', handleClick)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height * 0.45

      // 1. Star dust particles
      particles.forEach((p) => {
        p.y += p.speedY
        p.x += p.speedX
        if (p.y < 0) {
          p.y = height
          p.x = Math.random() * width
        }
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0

        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(Date.now() * 0.003 + p.x))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // 2. Sweeping Radar Cone & Range Rings
      radarAngle = (radarAngle + 0.022) % (Math.PI * 2)
      const radarMaxRadius = Math.min(width * 0.48, 108)

      // Range grid rings
      ;[0.35, 0.68, 1.0].forEach((ratio, idx) => {
        const rad = radarMaxRadius * ratio
        ctx.strokeStyle = idx === 2 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(34, 211, 238, 0.15)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 4])
        ctx.beginPath()
        ctx.arc(centerX, centerY, rad, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      })

      // Sweeping radar beam gradient
      const sweepGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radarMaxRadius
      )
      sweepGradient.addColorStop(0, 'rgba(34, 211, 238, 0.25)')
      sweepGradient.addColorStop(0.7, 'rgba(34, 211, 238, 0.08)')
      sweepGradient.addColorStop(1, 'transparent')

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radarMaxRadius, radarAngle - 0.45, radarAngle)
      ctx.closePath()
      ctx.fillStyle = sweepGradient
      ctx.fill()

      // Radar leading edge line
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 1.3
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(
        centerX + Math.cos(radarAngle) * radarMaxRadius,
        centerY + Math.sin(radarAngle) * radarMaxRadius
      )
      ctx.stroke()
      ctx.restore()

      // 3. Optical Line-of-Sight Transit Detection Axis
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(centerX - radarMaxRadius * 1.05, centerY)
      ctx.lineTo(centerX + radarMaxRadius * 1.05, centerY)
      ctx.stroke()
      ctx.setLineDash([])

      // 4. Render Exoplanetary Orbits (Tilted Ellipses)
      planets.forEach((planet) => {
        ctx.save()
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, planet.a, planet.b, -0.12, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      })

      // 5. Host Star (Center) with Coronal Flare & Stellar Pulse
      const pulse = 1 + 0.12 * Math.sin(Date.now() * 0.004)
      const starRadius = 8 * pulse

      // Radiant stellar corona
      const coronaGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        1,
        centerX,
        centerY,
        starRadius * 3.8
      )
      coronaGrad.addColorStop(0, 'rgba(253, 224, 71, 0.9)')
      coronaGrad.addColorStop(0.3, 'rgba(251, 146, 60, 0.45)')
      coronaGrad.addColorStop(0.7, 'rgba(34, 211, 238, 0.15)')
      coronaGrad.addColorStop(1, 'transparent')

      ctx.fillStyle = coronaGrad
      ctx.beginPath()
      ctx.arc(centerX, centerY, starRadius * 3.8, 0, Math.PI * 2)
      ctx.fill()

      // Star core
      ctx.save()
      ctx.shadowColor = '#fde047'
      ctx.shadowBlur = 18
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(centerX, centerY, starRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 6. Update & Render Orbiting Exoplanets & Transit Detection
      let currentTransitingPlanet: Exoplanet | null = null

      planets.forEach((planet) => {
        planet.angle = (planet.angle + planet.speed) % (Math.PI * 2)

        // Orbital parametric position with -0.12 inclination tilt
        const cosTilt = Math.cos(-0.12)
        const sinTilt = Math.sin(-0.12)
        const unrotatedX = planet.a * Math.cos(planet.angle)
        const unrotatedY = planet.b * Math.sin(planet.angle)

        const px = centerX + (unrotatedX * cosTilt - unrotatedY * sinTilt)
        const py = centerY + (unrotatedX * sinTilt + unrotatedY * cosTilt)

        // Record tail history
        planet.tail.unshift({ x: px, y: py, alpha: 0.7 })
        if (planet.tail.length > 12) planet.tail.pop()

        // Draw glowing motion tail
        for (let i = 0; i < planet.tail.length - 1; i++) {
          const pt = planet.tail[i]
          const nextPt = planet.tail[i + 1]
          ctx.strokeStyle = planet.color
          ctx.globalAlpha = pt.alpha * (1 - i / planet.tail.length) * 0.45
          ctx.lineWidth = planet.radius * (1 - i / planet.tail.length)
          ctx.beginPath()
          ctx.moveTo(pt.x, pt.y)
          ctx.lineTo(nextPt.x, nextPt.y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1

        // Check if planet is in front of the star (Transit Event: py > centerY and close to transit line)
        const isCrossingTransit =
          Math.abs(px - centerX) < planet.a * 0.28 &&
          py > centerY - 4 &&
          py < centerY + planet.b * 0.65

        if (isCrossingTransit) {
          currentTransitingPlanet = planet

          // Draw transit highlight flare ring around the star
          ctx.save()
          ctx.strokeStyle = '#22d3ee'
          ctx.lineWidth = 1.8
          ctx.shadowColor = '#22d3ee'
          ctx.shadowBlur = 12
          ctx.beginPath()
          ctx.arc(centerX, centerY, starRadius * 2.2, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()

          // Draw transit beacon line to bottom detector
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px, height - 12)
          ctx.stroke()
        }

        // Render Planet Sphere with glow
        ctx.save()
        ctx.shadowColor = planet.glowColor
        ctx.shadowBlur = 10
        ctx.fillStyle = planet.color
        ctx.beginPath()
        ctx.arc(px, py, planet.radius, 0, Math.PI * 2)
        ctx.fill()

        // Planet highlight reflection
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(px - planet.radius * 0.3, py - planet.radius * 0.3, planet.radius * 0.32, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Transit state trigger throttled
      const now = Date.now()
      if (now - lastTransitCheck > 300) {
        lastTransitCheck = now
        if (currentTransitingPlanet) {
          const p = currentTransitingPlanet as Exoplanet
          setActiveTransit({
            planet: p.name,
            depth: p.depthPercent,
            duration: `${(p.periodDays * 0.12).toFixed(1)} hrs`
          })
          setRecentDips((prev) => [
            ...prev.slice(1),
            parseFloat((1.0 - p.depthPercent * 0.01).toFixed(3))
          ])
        } else {
          setActiveTransit(null)
          setRecentDips((prev) => [...prev.slice(1), 1.0])
        }
      }

      // 7. Shockwaves / Gravitational pulse ripples
      shockwaves = shockwaves.filter((sw) => sw.alpha > 0.05)
      shockwaves.forEach((sw) => {
        sw.radius += 2.2
        sw.alpha *= 0.94
        ctx.save()
        ctx.strokeStyle = sw.color
        ctx.lineWidth = 1.5
        ctx.globalAlpha = sw.alpha
        ctx.shadowColor = sw.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      })

      // 8. Mini Real-Time Light Curve Trace along bottom of canvas
      const traceY = height - 16
      const traceStartX = 14
      const traceEndX = width - 14
      const traceWidth = traceEndX - traceStartX

      ctx.save()
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(traceStartX, traceY)
      ctx.lineTo(traceEndX, traceY)
      ctx.stroke()

      // Normalized baseline dip curve
      ctx.strokeStyle = currentTransitingPlanet ? '#22d3ee' : '#38bdf8'
      ctx.lineWidth = 1.6
      ctx.shadowColor = currentTransitingPlanet ? '#22d3ee' : '#38bdf8'
      ctx.shadowBlur = currentTransitingPlanet ? 8 : 2
      ctx.beginPath()

      const step = traceWidth / (recentDips.length - 1)
      recentDips.forEach((dip, i) => {
        const x = traceStartX + i * step
        // 1.0 flux = traceY; 0.95 flux dips downward by up to 10px
        const dipOffset = (1.0 - dip) * 280
        const y = traceY + dipOffset
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.restore()

      animId = requestAnimationFrame(render)
    }

    render()

    // Automatic sector drift
    const sectorTimer = setInterval(() => {
      setScanSector((s) => (s >= 55 ? 1 : s + 1))
      setTransitCount((c) => c + 1)
    }, 18000)

    return () => {
      cancelAnimationFrame(animId)
      clearInterval(sectorTimer)
      canvas.removeEventListener('click', handleClick)
      resizeObserver.disconnect()
    }
  }, [recentDips])

  return (
    <div
      className="relative flex-1 min-h-[220px] max-h-[310px] my-1.5 rounded-2xl bg-gradient-to-b from-slate-950/90 via-purple-950/40 to-slate-950/95 border border-cyan-500/35 backdrop-blur-md shadow-[0_0_24px_rgba(6,182,212,0.2),inset_0_0_16px_rgba(139,92,246,0.15)] flex flex-col overflow-hidden select-none transition-all duration-300 group hover:border-cyan-400/60"
      title="Interactive Exoplanet Transit & Photometry Radar — Click to trigger gravitational pulse"
    >
      {/* Widget Header Badge */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-violet-500/25 bg-slate-950/60 z-10 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center justify-center w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          </div>
          <span className="text-[10px] font-bold font-mono tracking-wider text-cyan-300 uppercase flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            TRANSIT RADAR
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[9px] text-slate-400">
          <span className="text-violet-400">SEC</span>
          <span className="text-cyan-300 font-semibold">{scanSector}</span>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 min-h-[145px] w-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />

        {/* Live Transit Alert Pill (Dynamic floating overlay) */}
        {activeTransit && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/80 shadow-[0_0_14px_rgba(34,211,238,0.6)] animate-pulse pointer-events-none">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span className="text-[9.5px] font-mono font-bold text-cyan-200">
              TRANSIT: {activeTransit.planet}
            </span>
            <span className="text-[9px] font-mono text-emerald-400">
              -{(activeTransit.depth).toFixed(2)}%
            </span>
          </div>
        )}

        {/* Quiet baseline scanner watermark */}
        {!activeTransit && (
          <div className="absolute bottom-5 left-3 text-[9px] font-mono text-slate-400/70 pointer-events-none flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-cyan-400/60" />
            <span>BLS Photometry Sweep · 120s</span>
          </div>
        )}
      </div>

      {/* Telemetry Footer Status */}
      <div className="px-3 py-1.5 border-t border-violet-500/20 bg-slate-950/70 z-10 flex items-center justify-between text-[9.5px] font-mono flex-shrink-0">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Orbit className="w-3 h-3 text-violet-400 animate-spin-slow" />
          <span className="text-slate-400">3 Planets</span>
        </div>
        <div className="flex items-center gap-1 text-cyan-300/90">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>{transitCount} Transits Logged</span>
        </div>
      </div>
    </div>
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

/**
 * Pure animated starfield — drifting star particles and occasional cosmic ray streaks.
 * Designed to run as a full background layer without any enclosing box.
 */
export function StarfieldCanvas({
  className = 'absolute inset-0 w-full h-full pointer-events-none'
}: {
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let cosmicRays: {
      x: number
      y: number
      vx: number
      vy: number
      length: number
      alpha: number
      color: string
    }[] = []
    let lastRayTime = Date.now()

    let width = canvas.offsetWidth || 288
    let height = canvas.offsetHeight || 900

    const colors = ['#38bdf8', '#c084fc', '#f472b6', '#22d3ee', '#a78bfa', '#ffffff', '#34d399']
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 0.32 + 0.1,
      speedX: (Math.random() - 0.5) * 0.08,
      alpha: Math.random() * 0.55 + 0.25,
      pulseSpeed: Math.random() * 0.005 + 0.002,
      pulseOffset: Math.random() * Math.PI * 2
    }))

    const handleResize = () => {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      width = canvas.offsetWidth || 288
      height = canvas.offsetHeight || 900
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.resetTransform?.()
      ctx.scale(dpr, dpr)
    }

    handleResize()
    const resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(canvas)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Drifting starfield particles
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

      // Occasional cosmic ray streak
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

      ctx.globalAlpha = 1
      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block' }}
    />
  )
}

