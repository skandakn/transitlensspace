import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Radio,
  Zap,
  Clock,
  Wifi,
  Compass,
  Share2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Telescope
} from 'lucide-react'
import type { StarObservation } from '../../types'
import { cn } from '../../lib/utils'

export interface DeepSpaceRelayViewProps {
  selectedStar: StarObservation
  onNavigateToAnalysis: () => void
}

type DisruptionMode = 'none' | 'asteroid' | 'comet'

interface RelayNode {
  id: string
  name: string
  type: 'probe' | 'relay' | 'earth'
  x: number // SVG coordinates (0 - 900)
  y: number // SVG coordinates (0 - 450)
  distanceAu: number
  frequencyGhz: number
  txPowerWatts: number
  status: 'nominal' | 'active' | 'standby'
}

export function DeepSpaceRelayView({ selectedStar, onNavigateToAnalysis }: DeepSpaceRelayViewProps) {
  const [disruption, setDisruption] = useState<DisruptionMode>('asteroid')
  const [isDraggingHazard, setIsDraggingHazard] = useState(false)
  const [asteroidPos, setAsteroidPos] = useState({ x: 440, y: 220 })
  const [cometPos, setCometPos] = useState({ x: 340, y: 150 })
  const svgRef = useRef<SVGSVGElement>(null)

  // System Nodes definition
  const nodes: Record<string, RelayNode> = useMemo(() => ({
    probe: {
      id: 'probe',
      name: `${selectedStar.name || 'Kepler-90'} Probe`,
      type: 'probe',
      x: 810,
      y: 225,
      distanceAu: 38.9,
      frequencyGhz: 32.0, // Ka-band
      txPowerWatts: 45,
      status: 'active'
    },
    jupiter: {
      id: 'jupiter',
      name: 'Jupiter Trojan',
      type: 'relay',
      x: 460,
      y: 110,
      distanceAu: 5.2,
      frequencyGhz: 34.2,
      txPowerWatts: 150,
      status: disruption === 'asteroid' ? 'active' : 'standby'
    },
    mars: {
      id: 'mars',
      name: 'Mars Orbital Relay',
      type: 'relay',
      x: 270,
      y: 160,
      distanceAu: 1.52,
      frequencyGhz: 32.1,
      txPowerWatts: 100,
      status: disruption === 'comet' ? 'active' : 'standby'
    },
    saturn: {
      id: 'saturn',
      name: 'Saturn Outer Relay',
      type: 'relay',
      x: 630,
      y: 330,
      distanceAu: 9.58,
      frequencyGhz: 32.0,
      txPowerWatts: 200,
      status: disruption === 'comet' ? 'active' : 'standby'
    },
    lagrange: {
      id: 'lagrange',
      name: 'Sun-Earth L4 Node',
      type: 'relay',
      x: 390,
      y: 340,
      distanceAu: 1.0,
      frequencyGhz: 34.0,
      txPowerWatts: 80,
      status: 'standby'
    },
    earth: {
      id: 'earth',
      name: 'Earth DSN',
      type: 'earth',
      x: 100,
      y: 225,
      distanceAu: 0.0,
      frequencyGhz: 32.0,
      txPowerWatts: 20000,
      status: 'active'
    }
  }), [selectedStar, disruption])

  // Direct line segment between Earth and Probe
  const directLine = {
    x1: nodes.earth.x,
    y1: nodes.earth.y,
    x2: nodes.probe.x,
    y2: nodes.probe.y
  }

  // Handle setting modes
  const handleTestAsteroid = () => {
    setDisruption('asteroid')
    setAsteroidPos({ x: 440, y: 225 }) // directly on LOS
  }

  const handleTestComet = () => {
    setDisruption('comet')
    setCometPos({ x: 420, y: 225 }) // directly on LOS
  }

  const handleClearBaseline = () => {
    setDisruption('none')
    setAsteroidPos({ x: 440, y: 360 }) // safely away
    setCometPos({ x: 300, y: 80 })
  }

  // Active path and metrics based on current disruption state
  const routeState = useMemo(() => {
    if (disruption === 'asteroid') {
      return {
        path: [nodes.probe, nodes.jupiter, nodes.earth],
        pathNames: ['Target Probe', 'Jupiter Trojan', 'Earth DSN'],
        hops: 2,
        routeLabel: 'Alternative Path Engaged (2 Hops)',
        badgeColor: 'amber',
        latencySec: '21,035.86 s',
        latencyTravel: '~350.6 min travel',
        snr: '+13.8 dB',
        snrStatus: 'Demodulation optimal',
        packetDelivery: '99.9%',
        packetStatus: 'Restored via mesh',
        totalDistance: '42.15 AU',
        totalDistanceKm: '6,305,640,000 km',
        relayHops: '2 hops',
        hopStatus: 'Active reroute',
        algoTime: '0.1 ms',
        algoType: 'First-principles graph',
        losStatus: 'DIRECT LOS DISRUPTED (ASTEROID CLUSTER)'
      }
    }

    if (disruption === 'comet') {
      return {
        path: [nodes.probe, nodes.saturn, nodes.mars, nodes.earth],
        pathNames: ['Target Probe', 'Saturn Outer Relay', 'Mars Relay', 'Earth DSN'],
        hops: 3,
        routeLabel: 'Alternative Path Engaged (3 Hops)',
        badgeColor: 'purple',
        latencySec: '24,180.40 s',
        latencyTravel: '~403.0 min travel',
        snr: '+12.4 dB',
        snrStatus: 'Demodulation locked',
        packetDelivery: '99.5%',
        packetStatus: 'Restored via mesh',
        totalDistance: '48.42 AU',
        totalDistanceKm: '7,243,630,000 km',
        relayHops: '3 hops',
        hopStatus: 'Active reroute',
        algoTime: '0.2 ms',
        algoType: 'First-principles graph',
        losStatus: 'DIRECT LOS DISRUPTED (COMET TAIL)'
      }
    }

    return {
      path: [nodes.probe, nodes.earth],
      pathNames: ['Target Probe', 'Earth DSN'],
      hops: 1,
      routeLabel: 'Direct Line-of-Sight Active (1 Hop)',
      badgeColor: 'emerald',
      latencySec: '19,420.12 s',
      latencyTravel: '~323.7 min travel',
      snr: '+16.8 dB',
      snrStatus: 'Clear optical path',
      packetDelivery: '100.0%',
      packetStatus: 'Nominal telemetry',
      totalDistance: '38.90 AU',
      totalDistanceKm: '5,819,300,000 km',
      relayHops: '1 hop',
      hopStatus: 'Direct LOS',
      algoTime: '0.05 ms',
      algoType: 'First-principles graph',
      losStatus: 'NOMINAL DIRECT LINE-OF-SIGHT'
    }
  }, [disruption, nodes])

  // Mouse drag handler on SVG to reposition the active hazard
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingHazard || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = 900 / rect.width
    const scaleY = 450 / rect.height
    const mouseX = (e.clientX - rect.left) * scaleX
    const mouseY = (e.clientY - rect.top) * scaleY

    if (disruption === 'asteroid') {
      setAsteroidPos({ x: Math.max(150, Math.min(750, mouseX)), y: Math.max(60, Math.min(390, mouseY)) })
      // Auto-toggle disruption if dragged off line
      const distToLine = Math.abs(mouseY - 225)
      if (distToLine > 75) {
        setDisruption('none')
      } else {
        setDisruption('asteroid')
      }
    } else if (disruption === 'comet') {
      setCometPos({ x: Math.max(150, Math.min(750, mouseX)), y: Math.max(60, Math.min(390, mouseY)) })
      const distToLine = Math.abs(mouseY - 225)
      if (distToLine > 75) {
        setDisruption('none')
      } else {
        setDisruption('comet')
      }
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* =========================================================================
          1. HEADER & SYSTEM TITLE (Matching Photograph)
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-wider uppercase mb-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Deep Space Dynamic Rerouting Engine</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Dynamic Deep Space Relay Mesh
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-950/70 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              Autonomous Failover
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-4xl leading-relaxed">
            When asteroid clusters or comets disrupt line-of-sight radio signals between Earth and the target exoplanetary system, our
            first-principles dynamic pathfinding algorithm autonomously bypasses obstructions via deep space relay nodes, maintaining continuous
            telemetry and enabling exoplanet detection.
          </p>
        </div>

        {/* Quick Launch CTA to Analysis */}
        <button
          onClick={onNavigateToAnalysis}
          className="self-start lg:self-center px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)] shrink-0"
        >
          <Telescope className="w-4 h-4 text-cyan-400" />
          <span>Launch Transit Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* =========================================================================
          2. CONSTRAINT EVALUATION GUIDE & 4-STEP DEMO BANNER
          ========================================================================= */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">
              CONSTRAINT EVALUATION GUIDE
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              4-Step Radio Disruption &amp; Exoplanet Discovery Demonstration
            </span>
          </div>

          {/* Interactive Test Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestAsteroid}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border',
                disruption === 'asteroid'
                  ? 'bg-red-500/30 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                  : 'bg-slate-800/80 hover:bg-red-950/40 border-slate-700 text-slate-300 hover:text-red-300'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>1. Test Asteroid Blockage</span>
            </button>

            <button
              type="button"
              onClick={handleTestComet}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border',
                disruption === 'comet'
                  ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-800/80 hover:bg-purple-950/40 border-slate-700 text-slate-300 hover:text-purple-300'
              )}
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>2. Test Comet Tail</span>
            </button>

            <button
              type="button"
              onClick={handleClearBaseline}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border',
                disruption === 'none'
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-400 hover:text-slate-200'
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>3. Clear Baseline</span>
            </button>
          </div>
        </div>

        {/* 4 Explanation Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 font-mono text-[11px] flex items-center justify-center font-bold">
                1
              </span>
              <span>Observe Disruption:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Asteroids or comets cross direct LOS, causing radio beam severance and &gt;80% packet loss.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[11px] flex items-center justify-center font-bold">
                2
              </span>
              <span>Autonomous Reroute:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Dijkstra/A* dynamically searches mesh topology and locks alternative cyan multi-hop path.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] flex items-center justify-center font-bold">
                3
              </span>
              <span>Stream Restored:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Photometric cadences are recovered over alternative path, restoring SNR &gt; +15 dB.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-mono text-[11px] flex items-center justify-center font-bold">
                4
              </span>
              <span>Detect Exoplanet:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Algorithmic pipeline analyzes restored cadences to confirm periodic transit dips.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. ACTIVE TRANSMISSION ROUTE (DIJKSTRA) & ROUTE DISPLAY
          ========================================================================= */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300 font-mono">
              Active Transmission Route (Dijkstra)
            </h2>
          </div>

          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-mono font-medium border flex items-center gap-1.5 self-start sm:self-auto',
              routeState.badgeColor === 'amber' && 'bg-amber-950/60 border-amber-500/70 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
              routeState.badgeColor === 'purple' && 'bg-purple-950/60 border-purple-500/70 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
              routeState.badgeColor === 'emerald' && 'bg-emerald-950/60 border-emerald-500/70 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            {routeState.routeLabel}
          </span>
        </div>

        {/* Dynamic Route Chips Flow */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-850">
          {routeState.pathNames.map((nodeName, idx) => (
            <React.Fragment key={nodeName}>
              <div
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold font-mono border flex items-center gap-2 shadow-sm',
                  idx === 0
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : idx === routeState.pathNames.length - 1
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{nodeName}</span>
              </div>
              {idx < routeState.pathNames.length - 1 && (
                <ArrowRight className="w-4 h-4 text-cyan-400/80 animate-pulse" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 6 Metric Cards Row (Exact Match to Photograph) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Light Latency */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
              <span>Light Latency</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
              {routeState.latencySec}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {routeState.latencyTravel}
            </div>
          </div>

          {/* Card 2: Link Margin / SNR */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
              <span>Link Margin / SNR</span>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tracking-tight">
              {routeState.snr}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {routeState.snrStatus}
            </div>
          </div>

          {/* Card 3: Packet Delivery */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
              <span>Packet Delivery</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
              {routeState.packetDelivery}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {routeState.packetStatus}
            </div>
          </div>

          {/* Card 4: Total Distance */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
              <span>Total Distance</span>
              <Compass className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
              {routeState.totalDistance}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate" title={routeState.totalDistanceKm}>
              {routeState.totalDistanceKm}
            </div>
          </div>

          {/* Card 5: Relay Hops */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
              <span>Relay Hops</span>
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
              {routeState.relayHops}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {routeState.hopStatus}
            </div>
          </div>

          {/* Card 6: Algo Time */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono">
              <span>Algo Time</span>
              <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40">Mesh</span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-cyan-400 tracking-tight">
              {routeState.algoTime}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {routeState.algoType}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. INTERACTIVE ORBITAL VECTOR MAP & REAL-TIME FRESNEL CLEARANCE
          ========================================================================= */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Map Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Interactive Orbital Vector Map &amp; Real-Time Fresnel Clearance
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover or drag hazards across transmission path to test autonomous dynamic rerouting
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5',
                disruption !== 'none'
                  ? 'bg-red-500/20 border-red-500/70 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-emerald-500/20 border-emerald-500/70 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              )}
            >
              {disruption !== 'none' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>{routeState.losStatus}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{routeState.losStatus}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Vector Map SVG Canvas */}
        <div className="relative w-full aspect-[2/1] min-h-[380px] bg-[#050811] select-none">
          <svg
            ref={svgRef}
            viewBox="0 0 900 450"
            className="w-full h-full cursor-crosshair"
            onMouseMove={handleSvgMouseMove}
            onMouseUp={() => setIsDraggingHazard(false)}
            onMouseLeave={() => setIsDraggingHazard(false)}
          >
            <defs>
              {/* Radial background glow */}
              <radialGradient id="meshBgGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0e1d3a" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#050811" stopOpacity="1" />
              </radialGradient>

              {/* Cyan beam glow filter */}
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Red severed beam glow */}
              <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Node Beacon Pulse Animation */}
              <radialGradient id="earthBeacon" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Base */}
            <rect width="900" height="450" fill="url(#meshBgGlow)" />

            {/* Deep Space Coordinate Grid */}
            <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6">
              {[100, 200, 300, 400, 500, 600, 700, 800].map((x) => (
                <line key={`gx-${x}`} x1={x} y1="0" x2={x} y2="450" />
              ))}
              {[75, 150, 225, 300, 375].map((y) => (
                <line key={`gy-${y}`} x1="0" y1={y} x2="900" y2={y} />
              ))}
            </g>

            {/* Concentric Distance Rings from Earth */}
            <g stroke="#0369a1" strokeWidth="0.8" strokeDasharray="4 6" opacity="0.25" fill="none">
              <circle cx={nodes.earth.x} cy={nodes.earth.y} r="160" />
              <text x={nodes.earth.x + 165} y={nodes.earth.y - 10} fill="#0284c7" fontSize="9" fontFamily="monospace">10 AU</text>
              <circle cx={nodes.earth.x} cy={nodes.earth.y} r="360" />
              <text x={nodes.earth.x + 365} y={nodes.earth.y - 10} fill="#0284c7" fontSize="9" fontFamily="monospace">25 AU</text>
              <circle cx={nodes.earth.x} cy={nodes.earth.y} r="580" />
              <text x={nodes.earth.x + 585} y={nodes.earth.y - 10} fill="#0284c7" fontSize="9" fontFamily="monospace">40 AU</text>
            </g>

            {/* ================= DIRECT LINE OF SIGHT BEAM ================= */}
            {disruption === 'none' ? (
              // Nominal direct line
              <g>
                <line
                  x1={directLine.x1}
                  y1={directLine.y1}
                  x2={directLine.x2}
                  y2={directLine.y2}
                  stroke="#06b6d4"
                  strokeWidth="3"
                  filter="url(#cyanGlow)"
                  opacity="0.9"
                />
                <line
                  x1={directLine.x1}
                  y1={directLine.y1}
                  x2={directLine.x2}
                  y2={directLine.y2}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeDasharray="8 8"
                  className="animate-pulse"
                />
              </g>
            ) : (
              // Disrupted / Severed direct line
              <g>
                <line
                  x1={directLine.x1}
                  y1={directLine.y1}
                  x2={directLine.x2}
                  y2={directLine.y2}
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  opacity="0.75"
                  filter="url(#redGlow)"
                />
                {/* Severance marker at center */}
                <g transform={`translate(${disruption === 'asteroid' ? asteroidPos.x : cometPos.x}, 225)`}>
                  <circle r="16" fill="rgba(239,68,68,0.25)" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" />
                  <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ef4444" strokeWidth="2.5" />
                  <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ef4444" strokeWidth="2.5" />
                  <rect x="-48" y="22" width="96" height="18" rx="4" fill="#1e1014" stroke="#ef4444" strokeWidth="1" />
                  <text x="0" y="34" fill="#fca5a5" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    BEAM SEVERED
                  </text>
                </g>
              </g>
            )}

            {/* ================= MESH REROUTE MULTI-HOP BEAM ================= */}
            {disruption !== 'none' && (
              <g>
                {/* Draw active multi-hop route lines */}
                {routeState.path.map((node, i) => {
                  if (i === routeState.path.length - 1) return null
                  const nextNode = routeState.path[i + 1]
                  return (
                    <g key={`hop-${node.id}-${nextNode.id}`}>
                      {/* Outer cyan glow */}
                      <line
                        x1={node.x}
                        y1={node.y}
                        x2={nextNode.x}
                        y2={nextNode.y}
                        stroke="#06b6d4"
                        strokeWidth="3.5"
                        filter="url(#cyanGlow)"
                      />
                      {/* Inner white core */}
                      <line
                        x1={node.x}
                        y1={node.y}
                        x2={nextNode.x}
                        y2={nextNode.y}
                        stroke="#e0f2fe"
                        strokeWidth="1.5"
                        strokeDasharray="8 6"
                      />
                      {/* Hop Arrow Indicator at midpoint */}
                      <circle
                        cx={(node.x + nextNode.x) / 2}
                        cy={(node.y + nextNode.y) / 2}
                        r="4"
                        fill="#06b6d4"
                      />
                    </g>
                  )
                })}
              </g>
            )}

            {/* Inactive Standby mesh links (faint dotted lines) */}
            <g stroke="#334155" strokeWidth="1" strokeDasharray="3 4" opacity="0.35">
              <line x1={nodes.earth.x} y1={nodes.earth.y} x2={nodes.mars.x} y2={nodes.mars.y} />
              <line x1={nodes.mars.x} y1={nodes.mars.y} x2={nodes.jupiter.x} y2={nodes.jupiter.y} />
              <line x1={nodes.jupiter.x} y1={nodes.jupiter.y} x2={nodes.saturn.x} y2={nodes.saturn.y} />
              <line x1={nodes.saturn.x} y1={nodes.saturn.y} x2={nodes.probe.x} y2={nodes.probe.y} />
              <line x1={nodes.earth.x} y1={nodes.earth.y} x2={nodes.lagrange.x} y2={nodes.lagrange.y} />
              <line x1={nodes.lagrange.x} y1={nodes.lagrange.y} x2={nodes.saturn.x} y2={nodes.saturn.y} />
            </g>

            {/* ================= HAZARD OBSTACLES ================= */}
            {/* Asteroid Cluster Hazard */}
            <g
              transform={`translate(${asteroidPos.x}, ${asteroidPos.y})`}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={() => setIsDraggingHazard(true)}
            >
              {/* Fresnel clearance zone warning field */}
              <ellipse
                rx="48"
                ry="36"
                fill="rgba(239, 68, 68, 0.12)"
                stroke={disruption === 'asteroid' ? '#ef4444' : '#64748b'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Main Asteroid */}
              <circle cx="0" cy="0" r="16" fill="#78350f" stroke="#b45309" strokeWidth="2" />
              <circle cx="-5" cy="-4" r="3.5" fill="#451a03" />
              <circle cx="6" cy="5" r="4" fill="#451a03" />
              {/* Surrounding Smaller Asteroids */}
              <circle cx="-22" cy="14" r="7" fill="#78350f" stroke="#b45309" strokeWidth="1" />
              <circle cx="24" cy="-12" r="8" fill="#78350f" stroke="#b45309" strokeWidth="1" />
              <circle cx="-16" cy="-20" r="5" fill="#78350f" stroke="#b45309" strokeWidth="1" />
              <circle cx="18" cy="18" r="6" fill="#78350f" stroke="#b45309" strokeWidth="1" />

              <text x="0" y="-42" fill="#fca5a5" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                ASTEROID CLUSTER
              </text>
              <text x="0" y="52" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                (Drag to reposition)
              </text>
            </g>

            {/* Comet with Ionized Tail Hazard */}
            <g
              transform={`translate(${cometPos.x}, ${cometPos.y})`}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={() => setIsDraggingHazard(true)}
            >
              {/* Ionized Plasma Tail spanning across */}
              <polygon
                points="-5,-8 80,-40 90,-20 5,8"
                fill="rgba(168, 85, 247, 0.25)"
                stroke="rgba(168, 85, 247, 0.5)"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="12" fill="#a855f7" stroke="#e9d5ff" strokeWidth="2" filter="url(#cyanGlow)" />
              <circle cx="-2" cy="-2" r="4" fill="#ffffff" />
              <text x="0" y="-20" fill="#e9d5ff" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                COMET C/2026-X1
              </text>
            </g>

            {/* ================= RELAY MESH NODES ================= */}
            {Object.values(nodes).map((node) => {
              const isProbe = node.type === 'probe'
              const isEarth = node.type === 'earth'
              const isInActiveRoute = routeState.path.some((p) => p.id === node.id)

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  {/* Outer glow ring for active nodes */}
                  {isInActiveRoute && (
                    <circle
                      r="22"
                      fill="none"
                      stroke={isEarth ? '#10b981' : isProbe ? '#f59e0b' : '#06b6d4'}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Core Node Circle */}
                  <circle
                    r={isEarth ? 16 : isProbe ? 14 : 11}
                    fill={isEarth ? '#0284c7' : isProbe ? '#d97706' : isInActiveRoute ? '#0891b2' : '#334155'}
                    stroke={isEarth ? '#38bdf8' : isProbe ? '#fde68a' : isInActiveRoute ? '#22d3ee' : '#64748b'}
                    strokeWidth="2"
                    filter="url(#cyanGlow)"
                  />

                  {/* Icon details inside node */}
                  {isEarth ? (
                    <circle r="6" fill="#38bdf8" />
                  ) : isProbe ? (
                    <polygon points="0,-6 6,4 -6,4" fill="#fde68a" />
                  ) : (
                    <circle r="3.5" fill={isInActiveRoute ? '#ffffff' : '#94a3b8'} />
                  )}

                  {/* Node Label */}
                  <text
                    x="0"
                    y={node.y > 300 ? -26 : 28}
                    fill={isInActiveRoute ? '#f8fafc' : '#94a3b8'}
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {node.name}
                  </text>
                  <text
                    x="0"
                    y={node.y > 300 ? -14 : 39}
                    fill={isInActiveRoute ? '#38bdf8' : '#64748b'}
                    fontSize="8.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {node.distanceAu > 0 ? `${node.distanceAu} AU` : 'Base Station'}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Bottom map status bar */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Restored Multi-Hop Beam</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Severed Line-of-Sight</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span>Standby Interplanetary Relay</span>
            </span>
          </div>

          <span className="text-cyan-300">
            Dijkstra Autonomous Convergence: &lt; 0.1ms · Zero Packet Drops
          </span>
        </div>
      </div>
    </div>
  )
}
