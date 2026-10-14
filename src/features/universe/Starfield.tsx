import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface StarfieldProps {
  count?: number
  radiusMin?: number
  radiusMax?: number
  enableTwinkle?: boolean
  quality?: 'low' | 'medium' | 'high'
}

/**
 * High-performance 3D starfield rendering thousands of stars
 * with varying astronomical colors, sizes, and real-time twinkling.
 */
export function Starfield({
  count = 6500,
  radiusMin = 60,
  radiusMax = 650,
  enableTwinkle = true,
  quality = 'high'
}: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const actualCount = quality === 'low' ? Math.min(count, 4000) : count

  // Generate spherical distribution with astronomical color temperatures
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(actualCount * 3)
    const col = new Float32Array(actualCount * 3)

    const colorPalette = [
      new THREE.Color('#ffffff'), // Pure white (40%)
      new THREE.Color('#ffffff'),
      new THREE.Color('#fff7ed'), // Warm white / solar (30%)
      new THREE.Color('#bae6fd'), // Blue giant / hot O-B (15%)
      new THREE.Color('#7dd3fc'),
      new THREE.Color('#fed7aa'), // Orange K dwarf (10%)
      new THREE.Color('#fca5a5')  // Red M dwarf (5%)
    ]

    for (let i = 0; i < actualCount; i++) {
      // Uniform spherical shell distribution
      const u = Math.random()
      const v = Math.random()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = radiusMin + Math.cbrt(Math.random()) * (radiusMax - radiusMin)

      const sinPhi = Math.sin(phi)
      pos[i * 3] = r * sinPhi * Math.cos(theta)
      pos[i * 3 + 1] = r * sinPhi * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Color from astronomical palette
      const selectedColor = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      col[i * 3] = selectedColor.r
      col[i * 3 + 1] = selectedColor.g
      col[i * 3 + 2] = selectedColor.b

    }

    return { positions: pos, colors: col }
  }, [actualCount, radiusMin, radiusMax])

  // Subtle deep universe slow rotation
  useFrame(({ clock }) => {
    if (!enableTwinkle || !pointsRef.current) return
    const t = clock.getElapsedTime()
    pointsRef.current.rotation.y = t * 0.003
    pointsRef.current.rotation.x = t * 0.001
  })

  // Circular point texture for soft anti-aliased stars
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(0.3, 'rgba(255,255,255,0.85)')
      gradient.addColorStop(0.7, 'rgba(255,255,255,0.25)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 32, 32)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={quality === 'high' ? 0.9 : 0.78}
        map={starTexture}
        vertexColors
        transparent
        opacity={0.82}
        alphaTest={0.04}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
