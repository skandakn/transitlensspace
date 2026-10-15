import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import {
  applyDeadzone,
  calculateSphericalRotation,
  calculateTwoHandZoom,
  calculateSingleHandDepthZoom,
  calculateHandAperture,
  projectWorldToScreen,
  findTargetFromFingertip,
  shouldTriggerSelection,
  calculateCameraFlightTarget,
  processSwipeDelta,
  type SwipeDetectorState
} from '../gestures/gestureMath'
import { DEFAULT_GESTURE_SETTINGS } from '../gestures/types'
import type { CelestialObject } from '../../../types/universe'
import type { TwoHandData } from '../../../types/gestures'

describe('Gesture Navigation Engine Suite (Member 2)', () => {
  const settings = DEFAULT_GESTURE_SETTINGS

  describe('1. Deadzone Tremor Suppression', () => {
    it('suppresses micro-tremors below the movement deadzone', () => {
      expect(applyDeadzone(0.002, 0.005)).toBe(0)
      expect(applyDeadzone(-0.004, 0.005)).toBe(0)
      expect(applyDeadzone(0, 0.005)).toBe(0)
    })

    it('passes through significant hand movement with smooth transition', () => {
      const positiveDelta = applyDeadzone(0.015, 0.005)
      expect(positiveDelta).toBeCloseTo(0.01, 5)

      const negativeDelta = applyDeadzone(-0.02, 0.005)
      expect(negativeDelta).toBeCloseTo(-0.015, 5)
    })
  })

  describe('2. Hand-Driven Spherical Camera Rotation', () => {
    it('rotates camera horizontally (azimuthal theta) with hand movement', () => {
      const initialTheta = 0
      const initialPhi = Math.PI / 3 // 60 degrees

      // Move hand to the right (deltaX > 0)
      const rotatedRight = calculateSphericalRotation(0.03, 0, initialTheta, initialPhi, settings)
      expect(rotatedRight.theta).toBeLessThan(initialTheta) // Left/right camera orbit
      expect(rotatedRight.phi).toBeCloseTo(initialPhi, 3)

      // Move hand to the left (deltaX < 0)
      const rotatedLeft = calculateSphericalRotation(-0.03, 0, initialTheta, initialPhi, settings)
      expect(rotatedLeft.theta).toBeGreaterThan(initialTheta)
    })

    it('adjusts vertical viewing angle (polar phi) with up/down hand movement', () => {
      const initialTheta = 0
      const initialPhi = Math.PI / 2 // Equator (90 degrees)

      // Move hand upward (deltaY < 0 in screen space)
      const tiltedUp = calculateSphericalRotation(0, -0.04, initialTheta, initialPhi, settings)
      expect(tiltedUp.phi).toBeLessThan(initialPhi) // Look from above

      // Move hand downward (deltaY > 0 in screen space)
      const tiltedDown = calculateSphericalRotation(0, 0.04, initialTheta, initialPhi, settings)
      expect(tiltedDown.phi).toBeGreaterThan(initialPhi)
    })

    it('clamps polar elevation to prevent camera flip at gimbal poles', () => {
      // Extremely high upward displacement
      const clampedTop = calculateSphericalRotation(0, -10.0, 0, Math.PI / 2, settings)
      expect(clampedTop.phi).toBeGreaterThanOrEqual(0.08)

      // Extremely high downward displacement
      const clampedBottom = calculateSphericalRotation(0, 10.0, 0, Math.PI / 2, settings)
      expect(clampedBottom.phi).toBeLessThanOrEqual(Math.PI - 0.08)
    })

    it('freezes rotation when hand movement is below deadzone', () => {
      const initialTheta = 1.25
      const initialPhi = 1.15
      const result = calculateSphericalRotation(0.001, 0.002, initialTheta, initialPhi, settings)
      expect(result.theta).toBe(initialTheta)
      expect(result.phi).toBe(initialPhi)
    })
  })

  describe('3. Two-Hand Distance Zoom & Single-Hand Depth', () => {
    it('zooms in when two hands move closer together (negative distance delta)', () => {
      const currentRadius = 100
      const twoHandData: TwoHandData = {
        distance: 0.4,
        prevDistance: 0.5,
        distanceDelta: -0.1,
        zoomFactor: 0.8
      }

      const newRadius = calculateTwoHandZoom(twoHandData, currentRadius, settings.zoomSensitivity)
      expect(newRadius).toBeLessThan(currentRadius)
    })

    it('zooms out when two hands expand apart (positive distance delta)', () => {
      const currentRadius = 100
      const twoHandData: TwoHandData = {
        distance: 0.6,
        prevDistance: 0.5,
        distanceDelta: 0.1,
        zoomFactor: 1.2
      }

      const newRadius = calculateTwoHandZoom(twoHandData, currentRadius, settings.zoomSensitivity)
      expect(newRadius).toBeGreaterThan(currentRadius)
    })

    it('clamps zoom distance within minimum and maximum bounds', () => {
      const extremeZoomIn: TwoHandData = {
        distance: 0.1,
        prevDistance: 1.0,
        distanceDelta: -0.9,
        zoomFactor: 0.1
      }
      const clampedMin = calculateTwoHandZoom(extremeZoomIn, 20, 5.0, 10, 380)
      expect(clampedMin).toBeGreaterThanOrEqual(10)

      const extremeZoomOut: TwoHandData = {
        distance: 1.5,
        prevDistance: 0.2,
        distanceDelta: 1.3,
        zoomFactor: 7.5
      }
      const clampedMax = calculateTwoHandZoom(extremeZoomOut, 350, 5.0, 10, 380)
      expect(clampedMax).toBeLessThanOrEqual(380)
    })

    it('supports single-hand depth/pinch zoom fallback', () => {
      const currentRadius = 120
      const zoomedIn = calculateSingleHandDepthZoom(-0.05, currentRadius, settings.zoomSensitivity)
      expect(zoomedIn).toBeLessThan(currentRadius)

      const zoomedOut = calculateSingleHandDepthZoom(0.05, currentRadius, settings.zoomSensitivity)
      expect(zoomedOut).toBeGreaterThan(currentRadius)
    })

    it('zooms in when closing fingers (negative aperture delta) and zooms out when opening fingers', () => {
      const currentRadius = 80

      // When closing fingers: aperture decreases (e.g. delta = -0.06) -> radius decreases (zooms in)
      const zoomedIn = calculateSingleHandDepthZoom(-0.06, currentRadius, settings.zoomSensitivity)
      expect(zoomedIn).toBeLessThan(currentRadius)

      // When opening/expanding fingers: aperture increases (e.g. delta = +0.06) -> radius increases (zooms out)
      const zoomedOut = calculateSingleHandDepthZoom(0.06, currentRadius, settings.zoomSensitivity)
      expect(zoomedOut).toBeGreaterThan(currentRadius)
    })

    it('calculates scale-invariant hand aperture reflecting finger openness and closure', () => {
      // Create mock open hand landmarks (all fingertips extended far from wrist)
      const mockOpenHand = Array.from({ length: 21 }, (_, i) => ({ x: 0.5, y: 0.5, z: 0 }))
      mockOpenHand[0] = { x: 0.5, y: 0.8, z: 0 }  // Wrist
      mockOpenHand[9] = { x: 0.5, y: 0.6, z: 0 }  // Middle MCP (palm scale = 0.2)
      mockOpenHand[4] = { x: 0.3, y: 0.5, z: 0 }  // Thumb tip
      mockOpenHand[8] = { x: 0.45, y: 0.2, z: 0 } // Index tip (extended)
      mockOpenHand[12] = { x: 0.5, y: 0.18, z: 0 } // Middle tip (extended)
      mockOpenHand[16] = { x: 0.55, y: 0.22, z: 0 } // Ring tip (extended)
      mockOpenHand[20] = { x: 0.65, y: 0.3, z: 0 }  // Pinky tip (extended)

      const openAperture = calculateHandAperture(mockOpenHand)

      // Create mock closed hand (fingertips curled close to wrist / palm)
      const mockClosedHand = Array.from({ length: 21 }, (_, i) => ({ x: 0.5, y: 0.5, z: 0 }))
      mockClosedHand[0] = { x: 0.5, y: 0.8, z: 0 }
      mockClosedHand[9] = { x: 0.5, y: 0.6, z: 0 }
      mockClosedHand[4] = { x: 0.48, y: 0.62, z: 0 }
      mockClosedHand[8] = { x: 0.5, y: 0.6, z: 0 }  // Curled in
      mockClosedHand[12] = { x: 0.5, y: 0.61, z: 0 }
      mockClosedHand[16] = { x: 0.51, y: 0.62, z: 0 }
      mockClosedHand[20] = { x: 0.52, y: 0.65, z: 0 }

      const closedAperture = calculateHandAperture(mockClosedHand)

      // Verify closed fingers produce smaller aperture than open fingers
      expect(closedAperture).toBeLessThan(openAperture)
    })
  })

  describe('4. Planet & Star Raycast Selection', () => {
    const mockCamera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 1000)
    mockCamera.position.set(0, 0, 100)
    mockCamera.lookAt(0, 0, 0)
    mockCamera.updateMatrixWorld()

    const mockSystems: CelestialObject[] = [
      {
        id: 'TOI-700',
        name: 'TOI-700',
        type: 'system',
        position: [0, 0, 0], // Center of screen
        radius: 2,
        color: '#ff6644',
        coronaColor: '#cc2200',
        temperature: 3480,
        planets: [
          {
            id: 'toi-700-d',
            name: 'TOI-700 d',
            radius: 0.5,
            distanceFromStar: 6,
            orbitSpeed: 1,
            color: '#38bdf8'
          }
        ]
      },
      {
        id: 'Kepler-90',
        name: 'Kepler-90',
        type: 'system',
        position: [60, 20, -50], // Off to the right
        radius: 2.5,
        color: '#fbbf24',
        coronaColor: '#d97706',
        temperature: 6080
      }
    ]

    it('projects 3D world coordinate to normalized screen space (0..1)', () => {
      const centerScreen = projectWorldToScreen([0, 0, 0], mockCamera)
      expect(centerScreen.inFront).toBe(true)
      expect(centerScreen.x).toBeCloseTo(0.5, 2)
      expect(centerScreen.y).toBeCloseTo(0.5, 2)
    })

    it('targets planet or star when fingertip points near it', () => {
      // Point directly near center screen (0.5, 0.5)
      const target = findTargetFromFingertip({ x: 0.5, y: 0.5 }, mockSystems, mockCamera, 0.1)
      expect(target).toBeDefined()
      expect(target?.star.id).toBe('TOI-700')
    })

    it('returns null when fingertip points into empty space', () => {
      // Point at bottom-left corner where no stars exist
      const target = findTargetFromFingertip({ x: 0.05, y: 0.95 }, mockSystems, mockCamera, 0.05)
      expect(target).toBeNull()
    })

    it('prevents accidental selection until target is stable across frames', () => {
      const now = 5000
      const lastSelection = 1000
      const cooldown = 650

      // Hovered only 1 frame: unstable -> false
      expect(shouldTriggerSelection('start', 1, 3, lastSelection, now, cooldown)).toBe(false)

      // Hovered 3+ frames: stable -> true
      expect(shouldTriggerSelection('start', 3, 3, lastSelection, now, cooldown)).toBe(true)
    })

    it('prevents repeat selections during cooldown period', () => {
      const now = 5000
      const lastSelection = 4800 // Only 200ms ago (< 650ms cooldown)
      const cooldown = 650

      expect(shouldTriggerSelection('start', 5, 3, lastSelection, now, cooldown)).toBe(false)
    })

    it('only triggers selection on new pinch transition ("start"), not held pinches', () => {
      const now = 5000
      const lastSelection = 1000
      const cooldown = 650

      expect(shouldTriggerSelection('held', 5, 3, lastSelection, now, cooldown)).toBe(false)
      expect(shouldTriggerSelection('none', 5, 3, lastSelection, now, cooldown)).toBe(false)
      expect(shouldTriggerSelection('end', 5, 3, lastSelection, now, cooldown)).toBe(false)
      expect(shouldTriggerSelection('start', 5, 3, lastSelection, now, cooldown)).toBe(true)
    })
  })

  describe('5. Camera Flight & Orbital Framing', () => {
    it('calculates camera position that keeps planet and parent star in view', () => {
      const planetTarget = {
        type: 'planet' as const,
        id: 'toi-700-d',
        name: 'TOI-700 d',
        star: {
          id: 'TOI-700',
          name: 'TOI-700',
          type: 'system' as const,
          position: [0, 0, 0] as [number, number, number],
          radius: 2,
          color: '#ff6644',
          coronaColor: '#cc2200',
          temperature: 3480
        },
        planet: {
          id: 'toi-700-d',
          name: 'TOI-700 d',
          radius: 0.5,
          distanceFromStar: 8,
          orbitSpeed: 1,
          color: '#38bdf8'
        },
        worldPosition: [8, 0, 0] as [number, number, number],
        screenX: 0.6,
        screenY: 0.5,
        distanceToFingertip: 0.02
      }

      const flight = calculateCameraFlightTarget(planetTarget)
      expect(flight.lookAt).toEqual([8, 0, 0]) // Focuses directly on planet
      // Camera positioned with offset so planet is clearly visible
      expect(flight.cameraPosition[0]).toBeGreaterThan(8)
    })

    it('returns to wide universe coordinate when target is null', () => {
      const flight = calculateCameraFlightTarget(null, [0, 45, 120])
      expect(flight.lookAt).toEqual([0, 0, 0])
      expect(flight.cameraPosition).toEqual([0, 45, 120])
    })
  })

  describe('6. Anti-Recoil Swipe Navigation & Snapback Prevention', () => {
    const initialState: SwipeDetectorState = {
      accum: 0,
      lastSwipeTime: 0,
      lastSwipeDir: 0,
      isLocked: false
    }

    it('triggers forward swipe when intentional displacement threshold is reached', () => {
      let state = { ...initialState }
      let result = processSwipeDelta(8, 1000, state)
      expect(result.triggeredDir).toBeNull()
      expect(result.nextState.accum).toBe(8)

      result = processSwipeDelta(16, 1050, result.nextState)
      expect(result.triggeredDir).toBe(1) // +1 Forward next planet
      expect(result.nextState.accum).toBe(0)
      expect(result.nextState.isLocked).toBe(true)
      expect(result.nextState.lastSwipeDir).toBe(1)
      expect(result.nextState.lastSwipeTime).toBe(1050)
    })

    it('completely suppresses reverse recoil motion during cooldown window (no snapback)', () => {
      const justSwipedState: SwipeDetectorState = {
        accum: 0,
        lastSwipeTime: 2000,
        lastSwipeDir: 1,
        isLocked: true
      }

      // Hand stops / recoils backwards (-12) at 2400ms (within 850ms cooldown)
      const recoilResult = processSwipeDelta(-12, 2400, justSwipedState)
      expect(recoilResult.triggeredDir).toBeNull()
      expect(recoilResult.nextState.accum).toBe(0) // Rejected and discarded
    })

    it('suppresses return motion opposing previous swipe during recoil lock window', () => {
      const pastCooldownState: SwipeDetectorState = {
        accum: 0,
        lastSwipeTime: 2000,
        lastSwipeDir: 1,
        isLocked: true
      }

      // Hand returning to center (-15 delta) at 2950ms (> 850ms cooldown, but within 1500ms recoil lock)
      const returnResult = processSwipeDelta(-15, 2950, pastCooldownState)
      expect(returnResult.triggeredDir).toBeNull()
      expect(returnResult.nextState.accum).toBe(0) // Opposing recoil suppressed
    })

    it('decays stationary tremors so micro-drift never accumulates to trigger accidental jumps', () => {
      let state: SwipeDetectorState = {
        accum: 5,
        lastSwipeTime: 1000,
        lastSwipeDir: 1,
        isLocked: false
      }

      // Hand resting / small webcam noise (0.3)
      const restingResult = processSwipeDelta(0.3, 3000, state)
      expect(restingResult.triggeredDir).toBeNull()
      expect(restingResult.nextState.accum).toBeLessThan(5) // Decayed exponentially
    })

    it('unlocks after hand settles to rest and allows next intentional swipe', () => {
      let state: SwipeDetectorState = {
        accum: 0,
        lastSwipeTime: 2000,
        lastSwipeDir: 1,
        isLocked: true
      }

      // Hand settles to rest at 3100ms (|deltaX| < 0.6)
      const restResult = processSwipeDelta(0.2, 3100, state)
      expect(restResult.nextState.isLocked).toBe(false) // Unlocked!

      // New fresh swipe left (-25) at 3200ms
      const freshSwipeResult = processSwipeDelta(-25, 3200, restResult.nextState)
      expect(freshSwipeResult.triggeredDir).toBe(-1) // Previous planet triggered intentionally
    })
  })
})
