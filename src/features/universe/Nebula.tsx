import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface NebulaProps {
  position?: [number, number, number]
  colorA?: string
  colorB?: string
  particleCount?: number
  scale?: number
  enableMotion?: boolean
}

function createPRNG(seed = 42) {
  let s = seed
  return () => {
    s = (s * 16807 + 11) % 2147483647
    return (s & 0x7fffffff) / 2147483647
  }
}

/**
 * Distant Spiral Galaxy component
 */
export function DistantGalaxy({
  position = [180, 70, -220],
  scale = 35,
  colorCore = '#fffbeb',
  colorArms = '#818cf8',
  armCount = 2,
  particleCount = 1800
}: {
  position?: [number, number, number]
  scale?: number
  colorCore?: string
  colorArms?: string
  armCount?: number
  particleCount?: number
}) {
  const galaxyRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const rand = createPRNG(1001)
    const pos = new Float32Array(particleCount * 3)
    const col = new Float32Array(particleCount * 3)
    const cCore = new THREE.Color(colorCore)
    const cArms = new THREE.Color(colorArms)

    for (let i = 0; i < particleCount; i++) {
      // Logarithmic spiral r = a * exp(b * theta)
      const r = Math.pow(rand(), 2) * scale
      const branchAngle = ((i % armCount) * 2 * Math.PI) / armCount
      const spinAngle = r * 0.15

      // Random dispersion around arm
      const randomX = Math.pow(rand(), 3) * (rand() < 0.5 ? 1 : -1) * (r * 0.15 + 0.5)
      const randomY = Math.pow(rand(), 3) * (rand() < 0.5 ? 1 : -1) * (r * 0.08 + 0.3)
      const randomZ = Math.pow(rand(), 3) * (rand() < 0.5 ? 1 : -1) * (r * 0.15 + 0.5)

      pos[i * 3] = Math.cos(branchAngle + spinAngle) * r + randomX
      pos[i * 3 + 1] = randomY
      pos[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ

      // Color interpolation: core is bright yellow-white, arms are violet/cyan
      const mixedColor = cCore.clone().lerp(cArms, r / scale)
      col[i * 3] = mixedColor.r
      col[i * 3 + 1] = mixedColor.g
      col[i * 3 + 2] = mixedColor.b
    }

    return { positions: pos, colors: col }
  }, [scale, colorCore, colorArms, armCount, particleCount])

  useFrame((_, delta) => {
    if (galaxyRef.current) {
      galaxyRef.current.rotation.y += delta * 0.02
    }
  })

  return (
    <group position={position} rotation={[0.4, 0.3, 0.5]}>
      <points ref={galaxyRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={2.2}
          vertexColors
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

/**
 * Procedural Volumetric Nebula Cloud
 */
export function Nebula({
  position = [-120, -40, -180],
  colorA = '#6366f1', // Indigo / violet
  colorB = '#06b6d4', // Cyan
  particleCount = 1200,
  scale = 65,
  enableMotion = true
}: NebulaProps) {
  const nebulaRef = useRef<THREE.Group>(null)

  const { positions, colors } = useMemo(() => {
    const rand = createPRNG(2024)
    const pos = new Float32Array(particleCount * 3)
    const col = new Float32Array(particleCount * 3)
    const cA = new THREE.Color(colorA)
    const cB = new THREE.Color(colorB)

    for (let i = 0; i < particleCount; i++) {
      // Gaussian distribution for cloud-like cluster
      const u = rand()
      const v = rand()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = Math.pow(rand(), 0.7) * scale

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.6
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8
      pos[i * 3 + 2] = r * Math.cos(phi) * 1.2

      const blend = rand()
      const mixed = cA.clone().lerp(cB, blend)
      col[i * 3] = mixed.r
      col[i * 3 + 1] = mixed.g
      col[i * 3 + 2] = mixed.b
    }

    return { positions: pos, colors: col }
  }, [particleCount, scale, colorA, colorB])

  useFrame(({ clock }) => {
    if (!enableMotion || !nebulaRef.current) return
    const t = clock.getElapsedTime()
    nebulaRef.current.rotation.y = t * 0.005
    nebulaRef.current.rotation.z = Math.sin(t * 0.003) * 0.05
  })

  return (
    <group position={position} ref={nebulaRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={5.5}
          vertexColors
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
