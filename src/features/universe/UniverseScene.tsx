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
  Layers3,
  Navigation,
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
function planetPositionAtTime(parent: CelestialObject, planet: CelestialPlanet, elapsed: number) {
  const hash = Array.from(planet.id).reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 1000, 0)
  const angle = (hash / 1000) * Math.PI * 2 + planet.orbitSpeed * 0.4 * elapsed
  const distance = planet.distanceFromStar
  const inclination = planet.orbitInclination || 0
  return new THREE.Vector3(
    parent.position[0] + Math.cos(angle) * distance,
    parent.position[1] + Math.sin(angle) * Math.sin(inclination) * distance * 0.4,
    parent.position[2] + Math.sin(angle) * distance,
  )
}

function CameraController({
  target,
  initialPosition = [0, 45, 120],
  flightRequest = 0,
}: {
  target: SelectedTarget
  initialPosition?: [number, number, number]
  flightRequest?: number
}) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const desiredTarget = useRef(new THREE.Vector3())
  const desiredPosition = useRef(new THREE.Vector3(...initialPosition))
  const viewingDirection = useRef(new THREE.Vector3(0.35, 0.22, 1).normalize())
  const previousKey = useRef('')
  const previousFlightRequest = useRef(flightRequest)

  useFrame(({ clock }, delta) => {
    if (!controlsRef.current) return
    const key = target
      ? target.type === 'star'
        ? `star:${target.star.id}`
        : `planet:${target.planet.id}`
      : 'universe'
    const focusPosition = target
      ? target.type === 'star'
        ? new THREE.Vector3(...target.star.position)
        : planetPositionAtTime(target.parentStar, target.planet, clock.getElapsedTime())
      : new THREE.Vector3(0, 0, 0)

    if (previousKey.current !== key || previousFlightRequest.current !== flightRequest) {
      const offset = camera.position.clone().sub(focusPosition)
      if (offset.lengthSq() > 0.001) viewingDirection.current.copy(offset.normalize())
      previousKey.current = key
      previousFlightRequest.current = flightRequest
    }

    desiredTarget.current.copy(focusPosition)
    if (target) {
      const radius = target.type === 'star' ? target.star.radius : target.planet.radius
      const distance = THREE.MathUtils.clamp(Math.max(radius * 7.5, target.type === 'star' ? 13 : 5.5), 5.5, 32)
      desiredPosition.current.copy(focusPosition).addScaledVector(viewingDirection.current, distance)
    } else {
      desiredPosition.current.set(...initialPosition)
    }

    const smoothing = 1 - Math.exp(-3.2 * delta)
    camera.position.lerp(desiredPosition.current, smoothing)
    controlsRef.current.target.lerp(desiredTarget.current, smoothing)
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
      rotateSpeed={0.55}
      zoomSpeed={0.78}
      panSpeed={0.7}
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
  const [showPointClouds, setShowPointClouds] = useState(false)
  const [enableMotion] = useState(initialEnableMotion)
  const [quality, setQuality] = useState<'low' | 'high'>(initialQuality === 'low' ? 'low' : 'high')

  // Search and Camera Focus State
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [flightRequest, setFlightRequest] = useState(0)
  const [detailsVisible, setDetailsVisible] = useState(true)

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

  const handleSelectStar = (star: CelestialObject) => {
    setActiveTarget({ type: 'star', star })
    setSelectedPlanetId(undefined)
    setDetailsVisible(true)
    setFlightRequest((value) => value + 1)
    onSelectObject?.(star)
  }

  const handleSelectPlanet = (planet: CelestialPlanet, parentStar: CelestialObject) => {
    setActiveTarget({ type: 'planet', planet, parentStar })
    setSelectedPlanetId(planet.id)
    setDetailsVisible(true)
    setFlightRequest((value) => value + 1)
    onSelectPlanet?.(planet, parentStar)
  }

  const handleResetCamera = () => {
    setActiveTarget(null)
    setSelectedPlanetId(undefined)
    setDetailsVisible(false)
    setFlightRequest((value) => value + 1)
  }

  const handleDeselect = () => {
    setActiveTarget(null)
    setSelectedPlanetId(undefined)
    setDetailsVisible(false)
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
          onPointerMissed={handleDeselect}
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
            target={activeTarget}
            initialPosition={initialCameraPosition}
            flightRequest={flightRequest}
          />

          {/* 1. Large 3D Starfield (Thousands of Stars) */}
          <Starfield
            count={quality === 'high' ? 6500 : 2800}
            quality={quality}
            enableTwinkle={enableMotion}
          />

          {/* 2. Procedural Nebulae Clouds */}
          {showPointClouds && <Nebula
            position={[-140, -30, -180]}
            colorA="#6366f1"
            colorB="#06b6d4"
            scale={75}
            enableMotion={enableMotion}
          />}
          {showPointClouds && <Nebula
            position={[160, 45, -160]}
            colorA="#8b5cf6"
            colorB="#ec4899"
            scale={65}
            enableMotion={enableMotion}
          />}

          {/* 3. Distant Spiral Galaxies */}
          {showPointClouds && <DistantGalaxy position={[220, 80, -260]} scale={40} />}
          {showPointClouds && <DistantGalaxy position={[-200, 60, -220]} scale={32} colorArms="#38bdf8" />}

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
          onClick={() => setFlightRequest((value) => value + 1)}
          disabled={!activeTarget}
          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Smoothly fly to the selected object"
        >
          <Navigation className="w-3 h-3" />
          <span className="hidden sm:inline">Fly To</span>
        </button>

        <button
          onClick={() => setDetailsVisible((visible) => !visible)}
          disabled={!activeTarget}
          className="px-2.5 py-1.5 rounded-lg bg-[#070b14]/85 hover:bg-slate-800/80 border border-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Show or hide object details"
        >
          <Eye className="w-3 h-3 text-violet-300" />
          <span className="hidden sm:inline">Details</span>
        </button>

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
          onClick={() => setShowPointClouds(!showPointClouds)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
            showPointClouds ? 'bg-violet-950/70 border-violet-500/50 text-violet-200' : 'bg-[#070b14]/85 border-slate-750 text-slate-400'
          }`}
          title="Toggle distant galaxy and nebula point clouds"
        >
          <Layers3 className="w-3 h-3" />
          <span className="hidden lg:inline">Overlays</span>
        </button>

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

      {/* Compact flight status replaces the former row of destination buttons. */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto rounded-lg bg-[#070b14]/88 border border-slate-800 px-2.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,.85)]" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">View</span>
          <span className="text-xs font-mono text-slate-200">
            {activeTarget ? activeTarget.type === 'star' ? `System · ${activeTarget.star.name}` : `Planet · ${activeTarget.planet.name}` : 'Wide universe'}
          </span>
        </div>

        <div className="text-[10px] font-mono text-slate-400 bg-[#070b14]/80 px-2 py-1 rounded border border-slate-800 hidden md:block">
          Select: Focus · Drag: Rotate · Scroll: Zoom · Right drag: Pan
        </div>
      </div>

      {/* Interactive Celestial Details Panel */}
      {detailsVisible && <CelestialDetailsPanel
        target={activeTarget}
        onClose={handleDeselect}
        onSelectStar={handleSelectStar}
        onSelectPlanet={handleSelectPlanet}
        onAnalyzeLightCurve={onAnalyzeLightCurve}
        onResetView={handleResetCamera}
      />}
    </div>
  )
}
