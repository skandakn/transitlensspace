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

/** Soft sprite shared by the distant structures so point clouds never read as squares. */
function useCosmicSprite() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d')
    if (context) {
      const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32)
      glow.addColorStop(0, 'rgba(255,255,255,1)')
      glow.addColorStop(0.18, 'rgba(255,255,255,0.9)')
      glow.addColorStop(0.55, 'rgba(255,255,255,0.22)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = glow
      context.fillRect(0, 0, 64, 64)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
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
  particleCount = 1100
}: {
  position?: [number, number, number]
  scale?: number
  colorCore?: string
  colorArms?: string
  armCount?: number
  particleCount?: number
}) {
  const galaxyRef = useRef<THREE.Points>(null)
  const sprite = useCosmicSprite()

  const { positions, colors } = useMemo(() => {
    const rand = createPRNG(1001)
    const pos = new Float32Array(particleCount * 3)
    const col = new Float32Array(particleCount * 3)
    const cCore = new THREE.Color(colorCore)
    const cArms = new THREE.Color(colorArms)

    for (let i = 0; i < particleCount; i++) {
      const inCore = i < particleCount * 0.18
      const r = inCore ? Math.pow(rand(), 2.8) * scale * 0.22 : (0.14 + Math.pow(rand(), 0.72) * 0.86) * scale
      const arm = Math.floor(rand() * armCount)
      const branchAngle = (arm * Math.PI * 2) / armCount
      const spiral = r * 0.19
      const spread = inCore ? scale * 0.055 : Math.max(0.45, r * 0.052)
      const jitter = (rand() - 0.5) * spread
      const angle = branchAngle + spiral + jitter / Math.max(r, 1)
      const radialJitter = (rand() - 0.5) * spread * 1.65

      pos[i * 3] = Math.cos(angle) * (r + radialJitter)
      pos[i * 3 + 1] = (rand() - 0.5) * (inCore ? scale * 0.055 : Math.max(0.25, r * 0.018))
      pos[i * 3 + 2] = Math.sin(angle) * (r + radialJitter)

      const mixedColor = cCore.clone().lerp(cArms, Math.min(1, r / scale))
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
      <sprite scale={[scale * 0.72, scale * 0.72, 1]}>
        <spriteMaterial map={sprite} color={colorCore} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <points ref={galaxyRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.08}
          map={sprite}
          vertexColors
          transparent
          opacity={0.68}
          alphaTest={0.03}
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
  particleCount = 560,
  scale = 65,
  enableMotion = true
}: NebulaProps) {
  const nebulaRef = useRef<THREE.Group>(null)
  const sprite = useCosmicSprite()

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
          size={3.2}
          map={sprite}
          vertexColors
          transparent
          opacity={0.22}
          alphaTest={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
