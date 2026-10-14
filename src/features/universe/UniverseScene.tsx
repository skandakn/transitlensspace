import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  Sparkles,
  Compass,
  Eye,
  Sliders,
  RotateCcw,
  Layers,
  AlertTriangle,
  Search,
  X,
  Sun,
  Globe
} from 'lucide-react'
import { Starfield } from './Starfield'
import { Nebula, DistantGalaxy } from './Nebula'
import { StarSystem } from './StarSystem'
import { CelestialDetailsPanel } from './CelestialDetailsPanel'
import { searchCelestialCatalog } from '../../data/astronomyData'
import type {
  UniverseSceneProps,
  CelestialObject,
  CelestialPlanet,
  SelectedTarget
} from '../../types/universe'

/**
 * Checks browser WebGL availability
 */
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/**
 * Camera Controller that smoothly flies to and focuses on selected star systems or planets
 */
function CameraController({
  targetPosition,
  initialPosition = [0, 45, 120],
  resetTrigger = 0
}: {
  targetPosition?: [number, number, number] | null
  initialPosition?: [number, number, number]
  resetTrigger?: number
}) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const isResetting = useRef(false)

  useEffect(() => {
    if (resetTrigger > 0) {
      targetLookAt.current.set(0, 0, 0)
      isResetting.current = true
    }
  }, [resetTrigger])

  useEffect(() => {
    if (targetPosition) {
      isResetting.current = false
      targetLookAt.current.set(...targetPosition)
    }
  }, [targetPosition])

  useFrame((_, delta) => {
    if (!controlsRef.current) return

    // Smoothly interpolate look-at target
    controlsRef.current.target.lerp(targetLookAt.current, delta * 3.5)

    // Smoothly restore initial camera position on reset
    if (isResetting.current) {
      const initVec = new THREE.Vector3(...initialPosition)
      camera.position.lerp(initVec, delta * 2.5)
      if (camera.position.distanceTo(initVec) < 0.5) {
        isResetting.current = false
      }
    }

    controlsRef.current.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={6}
      maxDistance={450}
      maxPolarAngle={Math.PI / 2 + 0.3}
    />
  )
}

/**
 * Loading Experience Fallback
 */
function UniverseLoader() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#070b14] text-slate-200">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <Sparkles className="w-6 h-6 text-cyan-400 absolute" />
      </div>
      <p className="mt-4 text-xs font-mono text-cyan-300 tracking-widest uppercase">
        Initializing 3D Universe Engine...
      </p>
      <span className="text-[11px] text-slate-500 font-mono mt-1">
        Compiling astronomical starfields and nebulae
      </span>
    </div>
  )
}

/**
 * WebGL Unavailable Fallback Component
 */
function WebGLFallback() {
  return (
    <div className="w-full h-full min-h-[480px] rounded-2xl bg-[#090e1a] border border-rose-500/30 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-white">WebGL 3D Acceleration Unavailable</h3>
        <p className="text-xs text-slate-400 max-w-md">
          Your browser or graphics hardware does not currently support WebGL hardware acceleration.
          Please check your browser settings or graphics drivers to explore the real-time 3D universe.
        </p>
      </div>
    </div>
  )
}

export interface ExtendedUniverseSceneProps extends UniverseSceneProps {
  onAnalyzeLightCurve?: (star: CelestialObject) => void
}

/**
 * UniverseScene: The master 3D universe canvas for TransitLens.
 * 
 * Delivers an immersive, real-time cosmic environment with thousands of instanced stars,
 * volumetric nebulae, distant spiral galaxies, interactive star systems, and verified
 * astronomical data inspection.
 */
export function UniverseScene({
  celestialObjects,
  selectedObjectId,
  selectedPlanetId: controlledPlanetId,
  onSelectObject,
  onSelectPlanet,
  hoveredObjectId,
  onHoverObject,
  showOrbits: initialShowOrbits = true,
  showLabels: initialShowLabels = true,
  enableMotion: initialEnableMotion = true,
  quality: initialQuality = 'high',
  className = '',
  initialCameraPosition = [0, 40, 110],
  onAnalyzeLightCurve
}: ExtendedUniverseSceneProps) {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true)
  const [showOrbits, setShowOrbits] = useState(initialShowOrbits)
  const [showLabels, setShowLabels] = useState(initialShowLabels)
  const [enableMotion, setEnableMotion] = useState(initialEnableMotion)
  const [quality, setQuality] = useState<'low' | 'high'>(initialQuality === 'low' ? 'low' : 'high')

  // Search and Camera Focus State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)

  // Target selection state
  const [activeTarget, setActiveTarget] = useState<SelectedTarget>(null)
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | undefined>(controlledPlanetId)

  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHasWebGL(checkWebGLSupport())
  }, [])

  // Synchronize incoming controlled target
  useEffect(() => {
    if (selectedObjectId) {
      const star = celestialObjects.find((s) => s.id === selectedObjectId)
      if (star) {
        if (controlledPlanetId && star.planets) {
          const planet = star.planets.find((p) => p.id === controlledPlanetId)
          if (planet) {
            setActiveTarget({ type: 'planet', planet, parentStar: star })
            setSelectedPlanetId(planet.id)
            return
          }
        }
        setActiveTarget({ type: 'star', star })
        setSelectedPlanetId(undefined)
      }
    }
  }, [selectedObjectId, controlledPlanetId, celestialObjects])

  // Handle outside click to close search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Catalog search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchCelestialCatalog(searchQuery)
  }, [searchQuery])

  // Target camera focus position
  const targetCameraPos = useMemo<[number, number, number] | null>(() => {
    if (!activeTarget) return null
    if (activeTarget.type === 'star') {
      return activeTarget.star.position
    }
    return activeTarget.parentStar.position
  }, [activeTarget])

  const handleSelectStar = (star: CelestialObject) => {
    setActiveTarget({ type: 'star', star })
    setSelectedPlanetId(undefined)
    onSelectObject?.(star)
  }

  const handleSelectPlanet = (planet: CelestialPlanet, parentStar: CelestialObject) => {
    setActiveTarget({ type: 'planet', planet, parentStar })
    setSelectedPlanetId(planet.id)
    onSelectPlanet?.(planet, parentStar)
  }

  const handleResetCamera = () => {
    setActiveTarget(null)
    setSelectedPlanetId(undefined)
    setResetTrigger((prev) => prev + 1)
  }

  const handleSearchResultClick = (result: ReturnType<typeof searchCelestialCatalog>[number]) => {
    if (result.type === 'star') {
      handleSelectStar(result.star)
    } else if (result.planet) {
      handleSelectPlanet(result.planet, result.star)
    }
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  if (!hasWebGL) {
    return <WebGLFallback />
  }

  return (
    <div className={`relative w-full h-full min-h-[550px] overflow-hidden rounded-2xl bg-[#040711] border border-slate-800/80 shadow-2xl ${className}`}>
      {/* 3D Canvas Scene */}
      <Suspense fallback={<UniverseLoader />}>
        <Canvas
          camera={{
            position: initialCameraPosition,
            fov: 50,
            near: 0.5,
            far: 1200
          }}
          gl={{
            antialias: quality === 'high',
            powerPreference: 'high-performance'
          }}
          className="w-full h-full"
        >
          {/* Deep Space Cosmic Fog */}
          <color attach="background" args={['#040711']} />
          <fog attach="fog" args={['#040711', 120, 950]} />

          {/* Ambient Cosmic Lighting */}
          <ambientLight intensity={0.45} />
          <directionalLight position={[100, 80, 50]} intensity={0.6} color="#e0f2fe" />

          {/* Interactive Camera Controller */}
          <CameraController
            targetPosition={targetCameraPos}
            initialPosition={initialCameraPosition}
            resetTrigger={resetTrigger}
          />

          {/* 1. Large 3D Starfield (Thousands of Stars) */}
          <Starfield
            count={quality === 'high' ? 10000 : 4500}
            quality={quality}
            enableTwinkle={enableMotion}
          />

          {/* 2. Procedural Nebulae Clouds */}
          <Nebula
            position={[-140, -30, -180]}
            colorA="#6366f1"
            colorB="#06b6d4"
            scale={75}
            enableMotion={enableMotion}
          />
          <Nebula
            position={[160, 45, -160]}
            colorA="#8b5cf6"
            colorB="#ec4899"
            scale={65}
            enableMotion={enableMotion}
          />

          {/* 3. Distant Spiral Galaxies */}
          <DistantGalaxy position={[220, 80, -260]} scale={40} />
          <DistantGalaxy position={[-200, 60, -220]} scale={32} colorArms="#38bdf8" />

          {/* 4. Multiple Visually Separated Star Systems with Clickable Planets */}
          {celestialObjects.map((system) => {
            const isSystemSelected =
              activeTarget?.type === 'star'
                ? activeTarget.star.id === system.id
                : activeTarget?.parentStar.id === system.id

            return (
              <StarSystem
                key={system.id}
                system={system}
                isSelected={isSystemSelected}
                isHovered={system.id === hoveredObjectId}
                selectedPlanetId={selectedPlanetId}
                onSelect={handleSelectStar}
                onSelectPlanet={handleSelectPlanet}
                onHover={onHoverObject}
                showOrbits={showOrbits}
                showLabels={showLabels}
                enableMotion={enableMotion}
              />
            )
          })}
        </Canvas>
      </Suspense>

      {/* Floating 3D HUD Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 max-w-[calc(100%-2rem)]">
        <div className="px-3 py-1.5 rounded-lg bg-[#070b14]/90 border border-slate-750 backdrop-blur-md flex items-center gap-2 text-xs font-mono text-cyan-300">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">3D Celestial Universe</span>
        </div>

        {/* Catalog Search Input & Results Dropdown */}
        <div ref={searchContainerRef} className="relative">
          <div className="flex items-center rounded-lg bg-[#070b14]/90 border border-slate-700/80 px-2.5 py-1 backdrop-blur-md focus-within:border-cyan-400 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearchOpen(true)
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search catalog (e.g. TOI-700, Kepler-90)..."
              className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-44 sm:w-56 font-mono"
              aria-label="Search celestial catalog"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchOpen(false)
                }}
                className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dropdown Menu */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 mt-1 w-72 max-h-64 overflow-y-auto rounded-xl bg-[#070b14]/98 border border-cyan-800/60 shadow-2xl backdrop-blur-xl z-50 divide-y divide-slate-800/60 font-mono text-xs">
              {searchResults.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSearchResultClick(item)}
                  className="p-2.5 hover:bg-slate-800/70 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.type === 'star' ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="font-bold text-white group-hover:text-cyan-300 block truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.type === 'star'
                          ? `${item.star.spectralType || 'Star'} · ${item.star.planets?.length || 0} Planets`
                          : `Host: ${item.hostStarName}`}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono shrink-0 ml-2 ${
                    item.type === 'star'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                  }`}>
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset Camera View Button */}
        <button
          onClick={handleResetCamera}
          className="px-2.5 py-1.5 rounded-lg bg-[#070b14]/85 hover:bg-slate-800/80 border border-slate-750 text-slate-300 hover:text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Reset Camera View to Default"
          aria-label="Reset Camera View"
        >
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">Reset View</span>
        </button>

        {/* Quality Mode Toggle */}
        <button
          onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}
          className="px-2.5 py-1.5 rounded-lg bg-[#070b14]/85 hover:bg-slate-800/80 border border-slate-750 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Toggle high performance mode for student laptops"
        >
          <Sliders className="w-3 h-3 text-cyan-400" />
          <span className="hidden md:inline">{quality === 'high' ? 'High' : 'Eco'}</span>
        </button>

        {/* Orbit Lines Toggle */}
        <button
          onClick={() => setShowOrbits(!showOrbits)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
            showOrbits
              ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
              : 'bg-[#070b14]/85 border-slate-750 text-slate-400'
          }`}
          title="Toggle planetary orbit lines"
        >
          <Layers className="w-3 h-3" />
          <span className="hidden sm:inline">Orbits</span>
        </button>

        {/* Star Labels Toggle */}
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
            showLabels
              ? 'bg-violet-950/70 border-violet-500/50 text-violet-300'
              : 'bg-[#070b14]/85 border-slate-750 text-slate-400'
          }`}
          title="Toggle star billboard labels"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">Labels</span>
        </button>
      </div>

      {/* Target Quick Switcher Bar at Bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Focus System:
          </span>
          {celestialObjects.map((obj) => {
            const isSelected =
              activeTarget?.type === 'star'
                ? activeTarget.star.id === obj.id
                : activeTarget?.parentStar.id === obj.id

            return (
              <button
                key={obj.id}
                onClick={() => handleSelectStar(obj)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-[#070b14]/85 text-slate-300 border-slate-750 hover:border-cyan-500/50 hover:text-white'
                }`}
              >
                {obj.name}
              </button>
            )
          })}
        </div>

        <div className="text-[10px] font-mono text-slate-400 bg-[#070b14]/80 px-2 py-1 rounded border border-slate-800 hidden md:block">
          Click Star/Planet: Inspect · Drag: Rotate · Scroll: Zoom
        </div>
      </div>

      {/* Interactive Celestial Details Panel */}
      <CelestialDetailsPanel
        target={activeTarget}
        onClose={() => {
          setActiveTarget(null)
          setSelectedPlanetId(undefined)
        }}
        onSelectStar={handleSelectStar}
        onSelectPlanet={handleSelectPlanet}
        onAnalyzeLightCurve={onAnalyzeLightCurve}
        onResetView={handleResetCamera}
      />
    </div>
  )
}
