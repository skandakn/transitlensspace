import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { CentralStar } from './CentralStar'
import type { CelestialObject, CelestialPlanet } from '../../types/universe'

export interface StarSystemProps {
  system: CelestialObject
  isSelected?: boolean
  isHovered?: boolean
  onSelect?: (system: CelestialObject) => void
  onHover?: (system: CelestialObject | null) => void
  showOrbits?: boolean
  showLabels?: boolean
  enableMotion?: boolean
}

/**
 * Individual Exoplanet Orbiting Mesh
 */
function PlanetOrbiter({
  planet,
  starColor,
  enableMotion = true
}: {
  planet: CelestialPlanet
  starColor: string
  enableMotion?: boolean
}) {
  const planetRef = useRef<THREE.Group>(null)
  const angleRef = useRef<number>(Math.random() * Math.PI * 2)

  useFrame((_, delta) => {
    if (!enableMotion || !planetRef.current) return
    angleRef.current += planet.orbitSpeed * 0.4 * delta
    const d = planet.distanceFromStar
    const inc = planet.orbitInclination || 0

    const x = Math.cos(angleRef.current) * d
    const z = Math.sin(angleRef.current) * d
    const y = Math.sin(angleRef.current) * Math.sin(inc) * (d * 0.4)

    planetRef.current.position.set(x, y, z)
  })

  return (
    <group ref={planetRef}>
      {/* Planet Sphere */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[planet.radius, 20, 20]} />
        <meshStandardMaterial
          color={planet.color}
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>

      {/* Atmospheric Rim Glow */}
      {planet.atmosphereColor && (
        <mesh>
          <sphereGeometry args={[planet.radius * 1.15, 16, 16]} />
          <meshBasicMaterial
            color={planet.atmosphereColor}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Planetary Ring (e.g. for gas giants like Kepler-90 h) */}
      {planet.hasRings && (
        <mesh rotation={[-Math.PI / 3, 0.2, 0]}>
          <ringGeometry args={[planet.radius * 1.5, planet.radius * 2.3, 32]} />
          <meshStandardMaterial
            color={planet.color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}
    </group>
  )
}

/**
 * Circular Orbit Path Line
 */
function OrbitRing({ radius, color = '#38bdf8' }: { radius: number; color?: string }) {
  const points = React.useMemo(() => {
    const pts: THREE.Vector3[] = []
    const segments = 64
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius))
    }
    return pts
  }, [radius])

  const lineGeometry = React.useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.15
    }))} />
  )
}

/**
 * Visual Selection Target Reticle
 */
function SelectionReticle({ radius }: { radius: number }) {
  const reticleRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (reticleRef.current) {
      reticleRef.current.rotation.z += delta * 0.8
    }
  })

  return (
    <group ref={reticleRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 2.2, radius * 2.35, 48]} />
        <meshBasicMaterial
          color="#00f0ff"
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * Interactive Star System Component
 */
export function StarSystem({
  system,
  isSelected = false,
  isHovered = false,
  onSelect,
  onHover,
  showOrbits = true,
  showLabels = true,
  enableMotion = true
}: StarSystemProps) {
  const [localHovered, setLocalHovered] = useState(false)
  const activeHover = isHovered || localHovered

  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    setLocalHovered(true)
    document.body.style.cursor = 'pointer'
    onHover?.(system)
  }

  const handlePointerOut = () => {
    setLocalHovered(false)
    document.body.style.cursor = 'auto'
    onHover?.(null)
  }

  const handleClick = (e: any) => {
    e.stopPropagation()
    onSelect?.(system)
  }

  return (
    <group position={system.position}>
      {/* Click / Hover Target Sphere */}
      <mesh
        visible={false}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[system.radius * 2.5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Central Star with Physical Glow */}
      <CentralStar
        radius={system.radius}
        color={system.color}
        coronaColor={system.coronaColor}
        lightIntensity={system.lightIntensity}
        enableMotion={enableMotion}
      />

      {/* Selection Target Ring */}
      {(isSelected || activeHover) && (
        <SelectionReticle radius={system.radius} />
      )}

      {/* Orbit Paths and Orbiting Exoplanets */}
      {system.planets && system.planets.map((planet) => (
        <React.Fragment key={planet.id}>
          {showOrbits && (
            <OrbitRing
              radius={planet.distanceFromStar}
              color={isSelected ? '#22d3ee' : '#475569'}
            />
          )}
          <PlanetOrbiter
            planet={planet}
            starColor={system.color}
            enableMotion={enableMotion}
          />
        </React.Fragment>
      ))}

      {/* 3D Billboard Label */}
      {showLabels && (
        <Html
          position={[0, system.radius * 1.8 + 1.2, 0]}
          center
          distanceFactor={60}
          className="pointer-events-none select-none transition-all duration-200"
        >
          <div
            className={`px-2.5 py-1 rounded-md text-center whitespace-nowrap backdrop-blur-md border font-mono transition-all ${
              isSelected
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-110'
                : activeHover
                ? 'bg-slate-900/90 border-cyan-500/60 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-[#090e1a]/75 border-slate-700/60 text-slate-300'
            }`}
          >
            <div className="text-[11px] font-bold tracking-wide flex items-center justify-center gap-1.5">
              <span>{system.name}</span>
              {system.mission && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-sans">
                  {system.mission}
                </span>
              )}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {system.spectralType || 'Star'} · {system.temperature}K · {system.planets?.length || 0} Planets
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
