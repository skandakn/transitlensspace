import * as THREE from 'three'
import type { CelestialObject, CelestialPlanet } from '../../../types/universe'
import type { TwoHandData, HandLandmark2D } from '../../../types/gestures'
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
 * Calculates normalized hand aperture (extent of finger openness / closure).
 * Scale-invariant (normalized by palm distance from wrist to middle MCP joint).
 * - Open/expanded fingers: aperture is large (> 1.4)
 * - Closed fingers / fist / pinch: aperture is small (< 0.9)
 */
export function calculateHandAperture(
  landmarks: HandLandmark2D[] | undefined,
  fallbackPinchDist = 1.0
): number {
  if (!landmarks || landmarks.length < 21) {
    return fallbackPinchDist
  }

  const wrist = landmarks[0]
  // Stable palm scale: distance between wrist (0) and middle MCP (9)
  const palmScale = Math.hypot(landmarks[9].x - wrist.x, landmarks[9].y - wrist.y) || 0.15

  // Distances from 5 fingertips (Thumb 4, Index 8, Middle 12, Ring 16, Pinky 20) to wrist
  const tipIndices = [4, 8, 12, 16, 20]
  let sumDist = 0
  for (const idx of tipIndices) {
    sumDist += Math.hypot(landmarks[idx].x - wrist.x, landmarks[idx].y - wrist.y)
  }
  const avgTipDist = sumDist / tipIndices.length

  // Also include thumb-to-index pinch distance for precision
  const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y)

  return (avgTipDist * 0.7 + pinchDist * 0.3) / palmScale
}

/**
 * Single-hand finger closure / opening depth zoom.
 * When closing fingers (negative delta), camera zooms in (decreases radius).
 * When opening/expanding fingers (positive delta), camera zooms out (increases radius).
 */
export function calculateSingleHandDepthZoom(
  currentPinchOrDepthDelta: number,
  currentRadius: number,
  zoomSensitivity: number,
  minRadius = 6,
  maxRadius = 450
): number {
  const filteredDelta = applyDeadzone(currentPinchOrDepthDelta, 0.003)
  if (filteredDelta === 0) return currentRadius

  // Closing fingers (negative delta) zooms in
  // Opening fingers (positive delta) zooms out
  const zoomFactor = Math.max(0.4, Math.min(1.8, 1 + filteredDelta * zoomSensitivity * 2.4))
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

export interface SwipeDetectorState {
  accum: number
  lastSwipeTime: number
  lastSwipeDir: number
  isLocked: boolean
}

/**
 * Robust swipe processor with anti-recoil, momentum lockout, tremor suppression,
 * and stationary decay to guarantee celestial selection never snaps back.
 */
export function processSwipeDelta(
  deltaX: number,
  now: number,
  state: SwipeDetectorState,
  cooldownMs = 850,
  recoilLockMs = 1500,
  threshold = 22
): { triggeredDir: number | null; nextState: SwipeDetectorState } {
  const timeSinceLast = now - state.lastSwipeTime

  // 1. Mandatory Cooldown: Ignore all delta accumulation after a swipe
  if (timeSinceLast < cooldownMs) {
    return {
      triggeredDir: null,
      nextState: { ...state, accum: 0 }
    }
  }

  let isLocked = state.isLocked
  // 2. Anti-Recoil Directional Lockout:
  // If we recently swiped, reject motion opposing the previous swipe (natural hand recoil/return)
  if (isLocked) {
    if (timeSinceLast < recoilLockMs) {
      const opposesLastSwipe =
        (state.lastSwipeDir > 0 && deltaX < -0.8) ||
        (state.lastSwipeDir < 0 && deltaX > 0.8)
      if (opposesLastSwipe) {
        return {
          triggeredDir: null,
          nextState: { ...state, isLocked: true, accum: 0 }
        }
      }
      if (Math.abs(deltaX) < 0.6) {
        isLocked = false
      }
    } else {
      isLocked = false
    }
  }

  // 3. Noise Filter & Tremor Suppression:
  // Discard micro-tremors below 0.8 and decay existing accumulation when stationary
  if (Math.abs(deltaX) < 0.8) {
    const decayed = state.accum * 0.75
    return {
      triggeredDir: null,
      nextState: {
        ...state,
        isLocked,
        accum: Math.abs(decayed) < 0.5 ? 0 : decayed
      }
    }
  }

  // 4. Directional Consistency & Leakage Damping:
  let newAccum = state.accum
  if ((newAccum > 0 && deltaX < 0) || (newAccum < 0 && deltaX > 0)) {
    newAccum *= 0.4
  }
  newAccum += deltaX

  // 5. Swipe Stroke Threshold Execution:
  if (Math.abs(newAccum) >= threshold) {
    const dir = newAccum > 0 ? 1 : -1
    return {
      triggeredDir: dir,
      nextState: {
        accum: 0,
        lastSwipeTime: now,
        lastSwipeDir: dir,
        isLocked: true
      }
    }
  }

  return {
    triggeredDir: null,
    nextState: {
      ...state,
      isLocked,
      accum: newAccum
    }
  }
}
