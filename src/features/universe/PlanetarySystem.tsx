import { useCallback, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, Vector3, type Group } from 'three'
import type { CelestialObject } from '../../types'
import { OrbitPath } from './OrbitPath'
import { Planet } from './Planet'

export interface PlanetarySystemProps {
  /** The star record and its `planets` collection from the shared registry. */
  star: CelestialObject
  selectedObjectId?: string
  onSelectObject?: (object: CelestialObject) => void
  onDeselect?: () => void
  showOrbits?: boolean
  enableMotion?: boolean
  /** Set false when the host scene already renders this star. */
  renderParentStar?: boolean
}

function StarModel({
  star,
  selected,
  onSelect,
}: Pick<PlanetarySystemProps, 'star'> & { selected: boolean; onSelect?: (object: CelestialObject) => void }) {
  const starRef = useRef<Group>(null)
  const pressPoint = useRef<[number, number] | null>(null)
  const starColor = useMemo(() => new Color(star.color), [star.color])

  useFrame((_, delta) => {
    if (starRef.current) starRef.current.rotation.y += delta * 0.045
  })

  const onPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    pressPoint.current = [event.clientX, event.clientY]
  }, [])

  const onClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    const press = pressPoint.current
    pressPoint.current = null
    if (press && Math.hypot(event.clientX - press[0], event.clientY - press[1]) > 7) return
    event.stopPropagation()
    if (!starRef.current || !onSelect) return
    const worldPosition = starRef.current.getWorldPosition(new Vector3())
    onSelect({ ...star, position: [worldPosition.x, worldPosition.y, worldPosition.z] })
  }, [onSelect, star])

  return (
    <group ref={starRef} onPointerDown={onPointerDown} onClick={onClick}>
      <pointLight color={star.coronaColor} intensity={star.lightIntensity ?? 2.2} distance={48} decay={1.6} />
      <mesh>
        <sphereGeometry args={[star.radius, 56, 40]} />
        <meshStandardMaterial color={starColor} emissive={starColor} emissiveIntensity={1.65} roughness={0.72} />
      </mesh>
      <mesh scale={1.28}>
        <sphereGeometry args={[star.radius, 40, 28]} />
        <meshBasicMaterial color={star.coronaColor} transparent opacity={0.12} side={BackSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh scale={1.5}>
          <sphereGeometry args={[star.radius, 40, 28]} />
          <meshBasicMaterial color="#74edff" transparent opacity={0.23} side={BackSide} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/**
 * Renders an independently animated star system at `star.position`.
 * Clicks emit the shared `CelestialObject` contract. Attach `onDeselect` to
 * the host Canvas `onPointerMissed` callback to clear a selection on empty space.
 */
export function PlanetarySystem({
  star,
  selectedObjectId,
  onSelectObject,
  onDeselect,
  showOrbits = true,
  enableMotion = true,
  renderParentStar = true,
}: PlanetarySystemProps) {
  const planets = star.planets ?? []

  return (
    <group position={star.position} onPointerMissed={onDeselect}>
      {renderParentStar && (
        <StarModel star={star} selected={selectedObjectId === star.id} onSelect={onSelectObject} />
      )}
      {planets.map((planet, index) => {
        const phase = (index / Math.max(planets.length, 1)) * Math.PI * 2 + Math.PI * 0.21
        return (
          <group key={planet.id}>
            {showOrbits && (
              <OrbitPath
                radius={planet.distanceFromStar}
                inclination={planet.orbitInclination}
                phase={phase}
                color={selectedObjectId === planet.id ? '#72e7ff' : '#315166'}
                opacity={selectedObjectId === planet.id ? 0.8 : 0.38}
              />
            )}
            <Planet
              planet={planet}
              parentStar={star}
              initialPhase={phase}
              enableMotion={enableMotion}
              selected={selectedObjectId === planet.id}
              onSelect={onSelectObject}
            />
          </group>
        )
      })}
    </group>
  )
}
