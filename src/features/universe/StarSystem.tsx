import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CentralStar } from './CentralStar'
import type { CelestialObject, CelestialPlanet } from '../../types/universe'

export interface StarSystemProps {
  system: CelestialObject
  isSelected?: boolean
  isHovered?: boolean
  selectedPlanetId?: string
  onSelect?: (system: CelestialObject) => void
  onSelectPlanet?: (planet: CelestialPlanet, parentStar: CelestialObject) => void
  onHover?: (system: CelestialObject | null) => void
  showOrbits?: boolean
  showLabels?: boolean
  enableMotion?: boolean
}

interface PlanetOrbiterProps {
  planet: CelestialPlanet
  starColor?: string
  enableMotion?: boolean
  isSelected?: boolean
  onSelectPlanet?: (planet: CelestialPlanet) => void
}

/**
 * Individual Exoplanet Orbiting Mesh with click interactions
 */
function PlanetOrbiter({
  planet,
  enableMotion = true,
  isSelected = false,
  onSelectPlanet
}: PlanetOrbiterProps) {
  const planetRef = useRef<THREE.Group>(null)
  const angleRef = useRef<number>(0)
  const [isHovered, setIsHovered] = useState(false)

  // Initialize deterministic starting phase based on planet distance/name
  React.useEffect(() => {
    let hash = 0
    for (let i = 0; i < planet.name.length; i++) {
      hash = (hash * 31 + planet.name.charCodeAt(i)) % 1000
    }
    angleRef.current = (hash / 1000) * Math.PI * 2
  }, [planet.name])

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
      {/* Click and hover target mesh */}
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation()
          onSelectPlanet?.(planet)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setIsHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setIsHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[planet.radius * (isHovered ? 1.15 : 1), 22, 22]} />
        <meshStandardMaterial
          color={planet.color}
          roughness={0.6}
          metalness={0.2}
          emissive={isSelected ? '#10b981' : isHovered ? '#38bdf8' : '#000000'}
          emissiveIntensity={isSelected ? 0.4 : isHovered ? 0.25 : 0}
        />
      </mesh>

      {/* Atmospheric Rim Glow */}
      {planet.atmosphereColor && (
        <mesh>
          <sphereGeometry args={[planet.radius * 1.18, 16, 16]} />
          <meshBasicMaterial
            color={planet.atmosphereColor}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Selected Target Ring for Planet */}
      {(isSelected || isHovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.radius * 1.6, planet.radius * 1.85, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#34d399' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
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
 * Native WebGL Sprite Label
 * Ultra-fast GPU-rendered billboard text without extra DOM roots or React 19 race conditions.
 */
function StarSpriteLabel({
  name,
  spectralType,
  temperature,
  planetsCount,
  isSelected,
  isHovered,
  yOffset = 3.8
}: {
  name: string
  spectralType?: string
  temperature: number
  planetsCount: number
  isSelected: boolean
  isHovered: boolean
  yOffset?: number
}) {
  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 140
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Rounded background container
      ctx.fillStyle = isSelected
        ? 'rgba(6, 78, 99, 0.92)'
        : isHovered
        ? 'rgba(15, 23, 42, 0.90)'
        : 'rgba(7, 11, 20, 0.78)'

      ctx.strokeStyle = isSelected
        ? '#06b6d4'
        : isHovered
        ? '#38bdf8'
        : '#1e293b'
      ctx.lineWidth = isSelected ? 6 : 3

      ctx.beginPath()
      ctx.roundRect(10, 10, 492, 120, 24)
      ctx.fill()
      ctx.stroke()

      // Star title
      ctx.font = 'bold 42px monospace'
      ctx.fillStyle = isSelected ? '#e0f2fe' : '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(name, 256, 62)

      // Subtitle metadata
      ctx.font = '26px monospace'
      ctx.fillStyle = isSelected ? '#67e8f9' : '#94a3b8'
      ctx.fillText(`${spectralType || 'Star'} · ${temperature}K · ${planetsCount} Planets`, 256, 104)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [name, spectralType, temperature, planetsCount, isSelected, isHovered])

  return (
    <sprite position={[0, yOffset, 0]} scale={[7.2, 1.95, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  )
}

/**
 * Interactive Star System Component
 */
export function StarSystem({
  system,
  isSelected = false,
  isHovered = false,
  selectedPlanetId,
  onSelect,
  onSelectPlanet,
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
            isSelected={planet.id === selectedPlanetId}
            onSelectPlanet={(p) => onSelectPlanet?.(p, system)}
          />
        </React.Fragment>
      ))}

      {/* Native WebGL 3D Billboard Sprite Label */}
      {showLabels && (
        <StarSpriteLabel
          name={system.name}
          spectralType={system.spectralType}
          temperature={system.temperature}
          planetsCount={system.planets?.length || 0}
          isSelected={isSelected}
          isHovered={activeHover}
          yOffset={system.radius * 1.6 + 1.8}
        />
      )}
    </group>
  )
}
