import * as THREE from 'three'
import type { CelestialObject, CelestialPlanet } from '../../../types/universe'
import type { TwoHandData } from '../../../types/gestures'
import type { GestureTarget, GestureNavigationSettings } from './types'

/**
 * Filters out microscopic tremors by clamping deltas smaller than the deadzone to 0.
 */
export function applyDeadzone(delta: number, deadzone: number): number {
  if (Math.abs(delta) <= deadzone) {
    return 0
  }
  // Soft deadzone: subtract threshold to prevent sudden jumps at threshold edge
  const sign = Math.sign(delta)
  return sign * (Math.abs(delta) - deadzone)
}

/**
 * Calculates updated spherical angles (theta, phi) from hand movement deltas.
 */
export function calculateSphericalRotation(
  deltaX: number,
  deltaY: number,
  currentTheta: number,
  currentPhi: number,
  settings: GestureNavigationSettings
): { theta: number; phi: number } {
  const filteredDx = applyDeadzone(deltaX, settings.movementDeadzone)
  const filteredDy = applyDeadzone(deltaY, settings.movementDeadzone)

  const xSign = settings.invertX ? 1 : -1
  const ySign = settings.invertY ? -1 : 1

  // Update azimuthal angle (horizontal rotation)
  const newTheta = currentTheta + filteredDx * settings.rotationSensitivity * xSign * Math.PI

  // Update polar angle (elevation, clamped between 0.05 and PI - 0.05 to avoid gimbal flip)
  const targetPhi = currentPhi + filteredDy * settings.verticalSensitivity * ySign * Math.PI
  const clampedPhi = Math.max(0.08, Math.min(Math.PI - 0.08, targetPhi))

  return {
    theta: newTheta,
    phi: clampedPhi
  }
}

/**
 * Computes updated camera radius based on two-hand distance change.
 */
export function calculateTwoHandZoom(
  twoHandData: TwoHandData | null,
  currentRadius: number,
  zoomSensitivity: number,
  minRadius = 10,
  maxRadius = 380
): number {
  if (!twoHandData || Math.abs(twoHandData.distanceDelta) < 0.002) {
    return currentRadius
  }

  // Closing hands together (negative delta) zooms in (decreases distance to target)
  // Expanding hands apart (positive delta) zooms out (increases distance to target)
  const zoomFactor = 1 + twoHandData.distanceDelta * zoomSensitivity * 2.8
  const newRadius = currentRadius * zoomFactor

  return Math.max(minRadius, Math.min(maxRadius, newRadius))
}

/**
 * Single-hand pinch/depth zoom fallback when only one hand is visible.
 * Closing fingers/pinch zooms in; opening/expanding hand zooms out.
 */
export function calculateSingleHandDepthZoom(
  currentPinchOrDepthDelta: number,
  currentRadius: number,
  zoomSensitivity: number,
  minRadius = 10,
  maxRadius = 380
): number {
  const filteredDelta = applyDeadzone(currentPinchOrDepthDelta, 0.004)
  if (filteredDelta === 0) return currentRadius

  // Closing fingers (negative delta) zooms in
  // Opening fingers (positive delta) zooms out
  const zoomFactor = 1 + filteredDelta * zoomSensitivity * 2.2
  const newRadius = currentRadius * zoomFactor

  return Math.max(minRadius, Math.min(maxRadius, newRadius))
}

/**
 * Computes world position of a planet at a specific time angle.
 */
export function getPlanetWorldPosition(
  planet: CelestialPlanet,
  systemPosition: [number, number, number],
  currentAngle: number
): [number, number, number] {
  const d = planet.distanceFromStar
  const inc = planet.orbitInclination || 0

  const relX = Math.cos(currentAngle) * d
  const relZ = Math.sin(currentAngle) * d
  const relY = Math.sin(currentAngle) * Math.sin(inc) * (d * 0.4)

  return [
    systemPosition[0] + relX,
    systemPosition[1] + relY,
    systemPosition[2] + relZ
  ]
}

/**
 * Projects a 3D world position to 2D normalized screen coordinates (0..1, where 0,0 is top-left).
 */
export function projectWorldToScreen(
  worldPos: [number, number, number],
  camera: THREE.Camera
): { x: number; y: number; inFront: boolean } {
  const vec = new THREE.Vector3(...worldPos)
  vec.project(camera)

  // In normalized device coordinates (NDC): -1 to +1
  // In front of camera check: -1 <= z <= 1
  const inFront = vec.z < 1.0

  // Convert to 0..1 top-left screen space
  const screenX = (vec.x + 1) / 2
  const screenY = (-vec.y + 1) / 2

  return { x: screenX, y: screenY, inFront }
}

/**
 * Raycast/screen-space targeting: finds the closest celestial object (planet or star)
 * matching the user's pointing index fingertip.
 */
export function findTargetFromFingertip(
  fingertip: { x: number; y: number },
  celestialObjects: CelestialObject[],
  camera: THREE.Camera,
  hitThreshold = 0.13 // Screen radius threshold (~13% of viewport for responsive targeting)
): GestureTarget | null {
  let closestTarget: GestureTarget | null = null
  let minDistance = hitThreshold

  for (const system of celestialObjects) {
    // 1. Check orbiting planets first (higher selection priority for fine exploration)
    if (system.planets && system.planets.length > 0) {
      for (const planet of system.planets) {
        // Approximate position from star (or use cached live world position)
        const planetPos: [number, number, number] = [
          system.position[0] + planet.distanceFromStar,
          system.position[1],
          system.position[2]
        ]
        const projected = projectWorldToScreen(planetPos, camera)

        if (projected.inFront) {
          const dist = Math.hypot(fingertip.x - projected.x, fingertip.y - projected.y)
          if (dist < minDistance) {
            minDistance = dist
            closestTarget = {
              type: 'planet',
              id: planet.id,
              name: planet.name,
              star: system,
              planet,
              worldPosition: planetPos,
              screenX: projected.x,
              screenY: projected.y,
              distanceToFingertip: dist
            }
          }
        }
      }
    }

    // 2. Check host star system center
    const starProjected = projectWorldToScreen(system.position, camera)
    if (starProjected.inFront) {
      const dist = Math.hypot(fingertip.x - starProjected.x, fingertip.y - starProjected.y)
      if (dist < minDistance) {
        minDistance = dist
        closestTarget = {
          type: 'star',
          id: system.id,
          name: system.name,
          star: system,
          worldPosition: system.position,
          screenX: starProjected.x,
          screenY: starProjected.y,
          distanceToFingertip: dist
        }
      }
    }
  }

  return closestTarget
}

/**
 * Determines whether a pinch should trigger selection, enforcing:
 * 1. Target stability (hovered across consecutive frames)
 * 2. New pinch transition ('start' edge detection)
 * 3. Cooldown timestamp expiration
 */
export function shouldTriggerSelection(
  pinchState: string,
  stableHoverFrameCount: number,
  minRequiredHoverFrames: number,
  lastSelectionTimestamp: number,
  nowTimestamp: number,
  cooldownMs: number
): boolean {
  const isPinchStart = pinchState === 'start'
  const isTargetStable = stableHoverFrameCount >= minRequiredHoverFrames
  const isCooldownExpired = nowTimestamp - lastSelectionTimestamp >= cooldownMs

  return isPinchStart && isTargetStable && isCooldownExpired
}

/**
 * Calculates camera position and look-at target for smooth camera flight.
 * Keeps host star and relevant orbital context in view.
 */
export function calculateCameraFlightTarget(
  target: GestureTarget | null,
  wideUniversePosition: [number, number, number] = [0, 45, 120]
): {
  lookAt: [number, number, number]
  cameraPosition: [number, number, number]
} {
  if (!target) {
    // Return to wide universe view
    return {
      lookAt: [0, 0, 0],
      cameraPosition: wideUniversePosition
    }
  }

  if (target.type === 'star') {
    const starPos = target.star.position
    const offsetDistance = Math.max(14, target.star.radius * 6.5 + 16)
    return {
      lookAt: starPos,
      cameraPosition: [
        starPos[0],
        starPos[1] + offsetDistance * 0.45,
        starPos[2] + offsetDistance
      ]
    }
  }

  // Target is a planet: frame the planet while keeping parent star visible
  const planetPos = target.worldPosition
  const starPos = target.star.position

  // Vector from star to planet
  const dx = planetPos[0] - starPos[0]
  const dy = planetPos[1] - starPos[1]
  const dz = planetPos[2] - starPos[2]
  const len = Math.hypot(dx, dy, dz) || 1

  // Position camera slightly offset from the planet, looking toward planet with star in backdrop
  const camOffsetDist = Math.max(8, (target.planet?.radius || 0.5) * 12 + 7)

  return {
    lookAt: planetPos,
    cameraPosition: [
      planetPos[0] + (dx / len) * camOffsetDist + 4,
      planetPos[1] + camOffsetDist * 0.6,
      planetPos[2] + (dz / len) * camOffsetDist + 6
    ]
  }
}
