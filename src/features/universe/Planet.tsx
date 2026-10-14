import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  Color,
  DataTexture,
  DoubleSide,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
  UnsignedByteType,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import type { CelestialObject, CelestialPlanet } from '../../types'

export interface PlanetProps {
  planet: CelestialPlanet
  parentStar: CelestialObject
  initialPhase?: number
  enableMotion?: boolean
  selected?: boolean
  onSelect?: (object: CelestialObject) => void
}

const clickTolerancePx = 7

function seedFrom(value: string) {
  return Array.from(value).reduce((seed, character) => ((seed * 31) ^ character.charCodeAt(0)) >>> 0, 2166136261)
}

function createRandom(seed: number) {
  let state = seed || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function createSurfaceTexture(baseColor: string, id: string, cloudLayer = false) {
  const width = 160
  const height = 80
  const pixels = new Uint8Array(width * height * 4)
  const random = createRandom(seedFrom(`${id}-${cloudLayer ? 'clouds' : 'surface'}`))
  const base = new Color(baseColor)
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)
  const shade = new Color()

  for (let y = 0; y < height; y += 1) {
    const latitude = y / (height - 1)
    for (let x = 0; x < width; x += 1) {
      const longitude = x / width
      const grain = random() - 0.5
      const wave = Math.sin(longitude * Math.PI * 10 + latitude * Math.PI * 4) * 0.5
      const cell = Math.sin(longitude * Math.PI * 27 + wave * 3) * Math.cos(latitude * Math.PI * 18)
      const index = (y * width + x) * 4

      if (cloudLayer) {
        const density = cell + grain * 1.5 > 0.34 ? 155 + Math.floor(random() * 80) : 0
        pixels[index] = 205
        pixels[index + 1] = 226
        pixels[index + 2] = 244
        pixels[index + 3] = density
        continue
      }

      const polarLight = Math.abs(latitude - 0.5) * 0.28
      const variation = grain * 0.17 + cell * 0.12 - polarLight
      shade.setHSL(
        MathUtils.euclideanModulo(hsl.h + variation * 0.08, 1),
        MathUtils.clamp(hsl.s + variation * 0.32, 0.18, 1),
        MathUtils.clamp(hsl.l + variation, 0.07, 0.78),
      )
      pixels[index] = Math.round(shade.r * 255)
      pixels[index + 1] = Math.round(shade.g * 255)
      pixels[index + 2] = Math.round(shade.b * 255)
      pixels[index + 3] = 255
    }
  }

  const texture = new DataTexture(pixels, width, height, undefined, UnsignedByteType)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.needsUpdate = true
  return texture
}

function atmosphereMaterial(color: string) {
  return {
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: BackSide,
    uniforms: { glowColor: { value: new Color(color) } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      void main() {
        float rim = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 3.2);
        gl_FragColor = vec4(glowColor, rim * 0.42);
      }
    `,
  }
}

/** A self-animating, selectable planetary body with a genuine world-space position. */
export function Planet({
  planet,
  parentStar,
  initialPhase = 0,
  enableMotion = true,
  selected = false,
  onSelect,
}: PlanetProps) {
  const orbitRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const cloudRef = useRef<Mesh>(null)
  const pressPoint = useRef<[number, number] | null>(null)
  const surfaceTexture = useMemo(() => createSurfaceTexture(planet.color, planet.id), [planet.color, planet.id])
  const cloudTexture = useMemo(() => createSurfaceTexture(planet.color, planet.id, true), [planet.color, planet.id])
  const atmosphere = useMemo(() => atmosphereMaterial(planet.atmosphereColor ?? '#57d8ff'), [planet.atmosphereColor])

  useEffect(() => () => {
    surfaceTexture.dispose()
    cloudTexture.dispose()
  }, [cloudTexture, surfaceTexture])

  const emitSelection = useCallback(() => {
    if (!bodyRef.current || !onSelect) return
    const worldPosition = bodyRef.current.getWorldPosition(new Vector3())
    onSelect({
      id: planet.id,
      name: planet.name,
      type: 'planet',
      position: [worldPosition.x, worldPosition.y, worldPosition.z],
      radius: planet.radius,
      color: planet.color,
      coronaColor: planet.atmosphereColor ?? planet.color,
      temperature: 0,
      description: `${planet.name} orbiting ${parentStar.name}.`,
    })
  }, [onSelect, parentStar.name, planet])

  const onPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    pressPoint.current = [event.clientX, event.clientY]
  }, [])

  const onClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    const origin = pressPoint.current
    const distance = origin ? Math.hypot(event.clientX - origin[0], event.clientY - origin[1]) : 0
    pressPoint.current = null
    if (distance > clickTolerancePx) return
    event.stopPropagation()
    emitSelection()
  }, [emitSelection])

  useFrame((_, delta) => {
    if (enableMotion && orbitRef.current) orbitRef.current.rotation.y += planet.orbitSpeed * delta
    if (bodyRef.current) bodyRef.current.rotation.y += delta * 0.28
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.08
  })

  const ringRadii = planet.ringRadius ?? [1.35, 2.15]
  const radius = Math.max(planet.radius, 0.05)

  return (
    <group rotation={[planet.orbitInclination ?? 0, 0, 0]}>
      <group ref={orbitRef} rotation={[0, initialPhase, 0]}>
        <group ref={bodyRef} position={[planet.distanceFromStar, 0, 0]} onPointerDown={onPointerDown} onClick={onClick}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[radius, 48, 32]} />
            <meshStandardMaterial map={surfaceTexture} roughness={0.62} metalness={0.04} />
          </mesh>
          <mesh ref={cloudRef} rotation={[0.04, 0, 0]}>
            <sphereGeometry args={[radius * 1.018, 48, 32]} />
            <meshStandardMaterial map={cloudTexture} transparent opacity={0.34} depthWrite={false} roughness={0.85} />
          </mesh>
          <mesh scale={1.11}>
            <sphereGeometry args={[radius, 48, 32]} />
            <shaderMaterial args={[atmosphere]} />
          </mesh>
          {planet.hasRings && (
            <mesh rotation={[Math.PI / 2.16, 0, 0]}>
              <ringGeometry args={[radius * ringRadii[0], radius * ringRadii[1], 96]} />
              <meshStandardMaterial color="#b8c9d5" emissive="#445f78" emissiveIntensity={0.25} transparent opacity={0.62} side={DoubleSide} roughness={0.48} />
            </mesh>
          )}
          {selected && (
            <mesh scale={1.19}>
              <sphereGeometry args={[radius, 36, 24]} />
              <meshBasicMaterial color="#73edff" transparent opacity={0.18} side={BackSide} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  )
}
