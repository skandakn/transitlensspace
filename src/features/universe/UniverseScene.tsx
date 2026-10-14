import React, { Suspense, useState, useEffect, useRef } from 'react'
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
  Loader2
} from 'lucide-react'
import { Starfield } from './Starfield'
import { Nebula, DistantGalaxy } from './Nebula'
import { StarSystem } from './StarSystem'
import type { UniverseSceneProps, CelestialObject } from '../../types/universe'

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
 * Camera Controller that smoothly flies to and focuses on selected star systems
 */
function CameraController({
  selectedObject,
  initialPosition = [0, 45, 120]
}: {
  selectedObject?: CelestialObject
  initialPosition?: [number, number, number]
}) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    if (selectedObject) {
      const [x, y, z] = selectedObject.position
      targetLookAt.current.set(x, y, z)
    }
  }, [selectedObject])

  useFrame((_, delta) => {
    if (!controlsRef.current) return

    // Smoothly interpolate target
    controlsRef.current.target.lerp(targetLookAt.current, delta * 3.5)
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

/**
 * UniverseScene: The master 3D universe canvas for TransitLens.
 * 
 * Delivers an immersive, real-time cosmic environment with thousands of instanced stars,
 * volumetric nebulae, distant spiral galaxies, and interactive star systems.
 */
export function UniverseScene({
  celestialObjects,
  selectedObjectId,
  onSelectObject,
  hoveredObjectId,
  onHoverObject,
  showOrbits: initialShowOrbits = true,
  showLabels: initialShowLabels = true,
  enableMotion: initialEnableMotion = true,
  hideDefaultControls = false,
  quality: initialQuality = 'high',
  className = '',
  initialCameraPosition = [0, 40, 110]
}: UniverseSceneProps) {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true)
  const [showOrbits, setShowOrbits] = useState(initialShowOrbits)
  const [showLabels, setShowLabels] = useState(initialShowLabels)
  const [enableMotion, setEnableMotion] = useState(initialEnableMotion)
  const [quality, setQuality] = useState<'low' | 'high'>(initialQuality === 'low' ? 'low' : 'high')

  useEffect(() => {
    setShowOrbits(initialShowOrbits)
  }, [initialShowOrbits])

  useEffect(() => {
    setShowLabels(initialShowLabels)
  }, [initialShowLabels])

  useEffect(() => {
    setEnableMotion(initialEnableMotion)
  }, [initialEnableMotion])

  useEffect(() => {
    setQuality(initialQuality === 'low' ? 'low' : 'high')
  }, [initialQuality])

  useEffect(() => {
    setHasWebGL(checkWebGLSupport())
  }, [])

  const selectedObject = celestialObjects.find((obj) => obj.id === selectedObjectId)

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
            selectedObject={selectedObject}
            initialPosition={initialCameraPosition}
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

          {/* 4. Multiple Visually Separated Star Systems */}
          {celestialObjects.map((system) => (
            <StarSystem
              key={system.id}
              system={system}
              isSelected={system.id === selectedObjectId}
              isHovered={system.id === hoveredObjectId}
              onSelect={onSelectObject}
              onHover={onHoverObject}
              showOrbits={showOrbits}
              showLabels={showLabels}
              enableMotion={enableMotion}
            />
          ))}
        </Canvas>
      </Suspense>

      {/* Floating 3D HUD Toolbar (fallback when external HUD is not managing controls) */}
      {!hideDefaultControls && (
        <>
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#070b14]/90 border border-slate-750 backdrop-blur-md flex items-center gap-2 text-xs font-mono text-cyan-300">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>Real-Time 3D Universe</span>
            </div>

            {/* Quality Mode Toggle (Student Laptop Optimization) */}
            <button
              onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}
              className="px-2.5 py-1.5 rounded-lg bg-[#070b14]/85 hover:bg-slate-800/80 border border-slate-750 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle high performance mode for student laptops"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>{quality === 'high' ? 'Quality: High' : 'Mode: Eco 60fps'}</span>
            </button>

            {/* Orbit Lines Toggle */}
            <button
              onClick={() => setShowOrbits(!showOrbits)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                showOrbits
                  ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                  : 'bg-[#070b14]/85 border-slate-750 text-slate-400'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Orbits</span>
            </button>

            {/* Star Labels Toggle */}
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                showLabels
                  ? 'bg-violet-950/70 border-violet-500/50 text-violet-300'
                  : 'bg-[#070b14]/85 border-slate-750 text-slate-400'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Labels</span>
            </button>
          </div>

          {/* Target Quick Switcher Bar at Bottom */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                Focus System:
              </span>
              {celestialObjects.map((obj) => {
                const isSelected = obj.id === selectedObjectId
                return (
                  <button
                    key={obj.id}
                    onClick={() => onSelectObject?.(obj)}
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
              Left Click + Drag: Rotate · Scroll: Zoom · Right Click: Pan
            </div>
          </div>
        </>
      )}
    </div>
  )
}
