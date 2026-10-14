import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface CentralStarProps {
  radius?: number
  color?: string
  coronaColor?: string
  lightIntensity?: number
  enableMotion?: boolean
}

/**
 * High-performance glowing star with physically-inspired color,
 * multi-layered additive corona glow, and omnidirectional point light.
 */
export function CentralStar({
  radius = 1.8,
  color = '#ffe599',
  coronaColor = '#ffaa00',
  lightIntensity = 2.5,
  enableMotion = true
}: CentralStarProps) {
  const coronaRef = useRef<THREE.Mesh>(null)
  const outerGlowRef = useRef<THREE.Mesh>(null)

  // Subtle real-time corona pulsation
  useFrame(({ clock }) => {
    if (!enableMotion) return
    const t = clock.getElapsedTime()
    if (coronaRef.current) {
      const scale = 1 + Math.sin(t * 1.8) * 0.04
      coronaRef.current.scale.set(scale, scale, scale)
    }
    if (outerGlowRef.current) {
      const outerScale = 1 + Math.cos(t * 1.2) * 0.06
      outerGlowRef.current.scale.set(outerScale, outerScale, outerScale)
    }
  })

  return (
    <group>
      {/* 1. Hot stellar photosphere: emissive enough to read at distance, shaded enough for depth nearby. */}
      <mesh>
        <sphereGeometry args={[radius, 48, 36]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          roughness={0.82}
          metalness={0}
          toneMapped={false}
        />
      </mesh>

      {/* 2. Inner Corona Layer (Additive Blending) */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[radius * 1.25, 24, 24]} />
        <meshBasicMaterial
          color={coronaColor}
          transparent
          opacity={0.33}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Outer Atmospheric Halo */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[radius * 1.7, 20, 20]} />
        <meshBasicMaterial
          color={coronaColor}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 4. Local Omnidirectional Star Light */}
      <pointLight
        color={color}
        intensity={lightIntensity * 12}
        distance={radius * 35}
        decay={1.8}
      />
    </group>
  )
}
