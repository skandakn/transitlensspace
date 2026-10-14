import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import { Vector3 } from 'three'

export interface OrbitPathProps {
  /** Radius in the same world-space units used by the parent system. */
  radius: number
  /** Tilt of the orbital plane, in radians. */
  inclination?: number
  /** Optional phase that keeps path markers aligned with the body motion. */
  phase?: number
  color?: string
  opacity?: number
  segments?: number
}

/** A lightweight circular orbit positioned by its parent group. */
export function OrbitPath({
  radius,
  inclination = 0,
  phase = 0,
  color = '#3b627a',
  opacity = 0.42,
  segments = 96,
}: OrbitPathProps) {
  const points = useMemo(() => {
    return Array.from({ length: segments + 1 }, (_, index) => {
      const theta = (index / segments) * Math.PI * 2
      return new Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius)
    })
  }, [radius, segments])

  return (
    <group rotation={[inclination, phase, 0]}>
      <Line
        points={points}
        color={color}
        transparent
        opacity={opacity}
        lineWidth={0.7}
        toneMapped={false}
      />
    </group>
  )
}
