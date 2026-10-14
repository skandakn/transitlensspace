import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import {
  applyDeadzone,
  calculateSphericalRotation,
  calculateTwoHandZoom,
  calculateSingleHandDepthZoom,
  projectWorldToScreen,
  findTargetFromFingertip,
  shouldTriggerSelection,
  calculateCameraFlightTarget
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
    it('zooms in when two hands move apart (positive distance delta)', () => {
      const currentRadius = 100
      const twoHandData: TwoHandData = {
        distance: 0.6,
        prevDistance: 0.5,
        distanceDelta: 0.1,
        zoomFactor: 1.2
      }

      const newRadius = calculateTwoHandZoom(twoHandData, currentRadius, settings.zoomSensitivity)
      expect(newRadius).toBeLessThan(currentRadius)
    })

    it('zooms out when two hands move closer together (negative distance delta)', () => {
      const currentRadius = 100
      const twoHandData: TwoHandData = {
        distance: 0.4,
        prevDistance: 0.5,
        distanceDelta: -0.1,
        zoomFactor: 0.8
      }

      const newRadius = calculateTwoHandZoom(twoHandData, currentRadius, settings.zoomSensitivity)
      expect(newRadius).toBeGreaterThan(currentRadius)
    })

    it('clamps zoom distance within minimum and maximum bounds', () => {
      const extremeZoomIn: TwoHandData = {
        distance: 1.5,
        prevDistance: 0.2,
        distanceDelta: 1.3,
        zoomFactor: 7.5
      }
      const clampedMin = calculateTwoHandZoom(extremeZoomIn, 20, 5.0, 10, 380)
      expect(clampedMin).toBeGreaterThanOrEqual(10)

      const extremeZoomOut: TwoHandData = {
        distance: 0.1,
        prevDistance: 1.0,
        distanceDelta: -0.9,
        zoomFactor: 0.1
      }
      const clampedMax = calculateTwoHandZoom(extremeZoomOut, 350, 5.0, 10, 380)
      expect(clampedMax).toBeLessThanOrEqual(380)
    })

    it('supports single-hand depth/pinch zoom fallback', () => {
      const currentRadius = 120
      const zoomedIn = calculateSingleHandDepthZoom(0.05, currentRadius, settings.zoomSensitivity)
      expect(zoomedIn).toBeLessThan(currentRadius)

      const zoomedOut = calculateSingleHandDepthZoom(-0.05, currentRadius, settings.zoomSensitivity)
      expect(zoomedOut).toBeGreaterThan(currentRadius)
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
})
