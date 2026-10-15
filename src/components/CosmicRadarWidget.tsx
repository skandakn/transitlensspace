import React, { useEffect, useRef } from 'react'

interface CosmicRadarWidgetProps {
  isCollapsed?: boolean
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
  // If collapsed, render the compact animated radar orb
  if (isCollapsed) {
    return <MiniCosmicRadarOrb />
  }

  return (
    <div className="relative flex-1 min-h-[150px] my-1.5 rounded-2xl bg-gradient-to-b from-slate-950/80 via-purple-950/40 to-slate-950/90 border border-violet-500/35 backdrop-blur-md shadow-[0_0_24px_rgba(139,92,246,0.22)] overflow-hidden select-none">
      {/* Pure starfield canvas — no UI overlay */}
      <StarfieldCanvas />
    </div>
  )
}

/**
 * Pure animated starfield — drifting star particles and occasional cosmic ray streaks only.
 */
function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let cosmicRays: CosmicRay[] = []
    let lastRayTime = Date.now()

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
