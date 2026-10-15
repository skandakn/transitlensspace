import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { CelestialObject, CelestialPlanet, SelectedTarget } from '../../../types/universe'
import type { GestureFrame } from '../../../types/gestures'
import type { GestureNavigationMode, GestureNavigationSettings, GestureTarget } from './types'
import { DEFAULT_GESTURE_SETTINGS } from './types'
import {
  calculateSphericalRotation,
  calculateTwoHandZoom,
  calculateSingleHandDepthZoom,
  calculateHandAperture,
  findTargetFromFingertip,
  shouldTriggerSelection,
  calculateCameraFlightTarget
} from './gestureMath'

export interface GestureUniverseControllerProps {
  gestureFrame: GestureFrame
  mode: GestureNavigationMode
  celestialObjects: CelestialObject[]
  selectedTarget?: SelectedTarget
  onSelectStar?: (star: CelestialObject) => void
  onSelectPlanet?: (planet: CelestialPlanet, parentStar: CelestialObject) => void
  onHoverTarget?: (target: GestureTarget | null) => void
  onReturnToUniverse?: () => void
  settings?: Partial<GestureNavigationSettings>
  initialCameraPosition?: [number, number, number]
  resetTrigger?: number
}

/**
 * 3D R3F Universe Camera & Selection Controller driven by Hand Gestures
 * with seamless OrbitControls mouse/keyboard fallback.
 */
export function GestureUniverseController({
  gestureFrame,
  mode,
  celestialObjects,
  selectedTarget,
  onSelectStar,
  onSelectPlanet,
  onHoverTarget,
  onReturnToUniverse,
  settings: customSettings,
  initialCameraPosition = [0, 45, 120],
  resetTrigger = 0
}: GestureUniverseControllerProps) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  const settings = useMemo<GestureNavigationSettings>(
    () => ({ ...DEFAULT_GESTURE_SETTINGS, ...customSettings }),
    [customSettings]
  )

  // Spherical camera orbit state
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const targetCamPos = useRef(new THREE.Vector3(...initialCameraPosition))
  const isFlying = useRef(false)
  const isResetting = useRef(false)

  // Grab mode state
  const isGrabbing = useRef(false)
  const grabAnchor = useRef<{ x: number; y: number } | null>(null)

  // Selection state
  const hoveredTargetRef = useRef<GestureTarget | null>(null)
  const stableHoverCountRef = useRef<number>(0)
  const lastSelectionTimeRef = useRef<number>(0)

  // Two-hand distance tracking
  const prevPinchDistRef = useRef<number | null>(null)

  // Fist gesture return-to-universe timer
  const fistStartTimestampRef = useRef<number | null>(null)

  // Synchronize camera flight when selectedTarget prop changes
  useEffect(() => {
    if (selectedTarget) {
      isResetting.current = false
      isFlying.current = true

      let mappedTarget: GestureTarget | null = null
      if (selectedTarget.type === 'star') {
        mappedTarget = {
          type: 'star',
          id: selectedTarget.star.id,
          name: selectedTarget.star.name,
          star: selectedTarget.star,
          worldPosition: selectedTarget.star.position,
          screenX: 0.5,
          screenY: 0.5,
          distanceToFingertip: 0
        }
      } else {
        mappedTarget = {
          type: 'planet',
          id: selectedTarget.planet.id,
          name: selectedTarget.planet.name,
          star: selectedTarget.parentStar,
          planet: selectedTarget.planet,
          worldPosition: [
            selectedTarget.parentStar.position[0] + selectedTarget.planet.distanceFromStar,
            selectedTarget.parentStar.position[1],
            selectedTarget.parentStar.position[2]
          ],
          screenX: 0.5,
          screenY: 0.5,
          distanceToFingertip: 0
        }
      }

      const flight = calculateCameraFlightTarget(mappedTarget, initialCameraPosition)
      targetLookAt.current.set(...flight.lookAt)
      targetCamPos.current.set(...flight.cameraPosition)
    }
  }, [selectedTarget, initialCameraPosition])

  // Handle external reset trigger
  useEffect(() => {
    if (resetTrigger > 0) {
      targetLookAt.current.set(0, 0, 0)
      targetCamPos.current.set(...initialCameraPosition)
      isResetting.current = true
      isFlying.current = true
    }
  }, [resetTrigger, initialCameraPosition])

  useFrame((_, delta) => {
    if (!controlsRef.current) return

    const now = performance.now()
    const controls = controlsRef.current
    const primaryHand = gestureFrame.primaryHand
    const isTracking = gestureFrame.isTracking && primaryHand !== null

    // ──────────────────────────────────────────────────────────────────────────
    // 1. CAMERA FLIGHT INTERPOLATION
    // ──────────────────────────────────────────────────────────────────────────
    if (isFlying.current) {
      controls.target.lerp(targetLookAt.current, delta * settings.flightLerpSpeed)
      camera.position.lerp(targetCamPos.current, delta * settings.flightLerpSpeed)

      if (
        controls.target.distanceTo(targetLookAt.current) < 0.2 &&
        camera.position.distanceTo(targetCamPos.current) < 0.6
      ) {
        controls.target.copy(targetLookAt.current)
        camera.position.copy(targetCamPos.current)
        isFlying.current = false
        isResetting.current = false
      }
      controls.update()
      return
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. TRACKING LOSS SAFEGUARD
    // ──────────────────────────────────────────────────────────────────────────
    // If hand disappeared or mode is paused, freeze gesture camera modifications
    if (!isTracking || mode === 'paused') {
      isGrabbing.current = false
      grabAnchor.current = null
      hoveredTargetRef.current = null
      stableHoverCountRef.current = 0
      onHoverTarget?.(null)
      fistStartTimestampRef.current = null
      controls.update()
      return
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. FIST GESTURE: RETURN TO WIDE UNIVERSE
    // ──────────────────────────────────────────────────────────────────────────
    if (gestureFrame.gesture === 'closed-fist') {
      if (!fistStartTimestampRef.current) {
        fistStartTimestampRef.current = now
      } else if (now - fistStartTimestampRef.current > 500) {
        // Closed fist held for > 500ms triggers return to universe
        fistStartTimestampRef.current = null
        targetLookAt.current.set(0, 0, 0)
        targetCamPos.current.set(...initialCameraPosition)
        isFlying.current = true
        onReturnToUniverse?.()
        return
      }
    } else {
      fistStartTimestampRef.current = null
    }

    // Current spherical parameters relative to lookAt target
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target)
    let currentRadius = offset.length()
    let currentTheta = Math.atan2(offset.x, offset.z)
    let currentPhi = Math.acos(Math.max(-1, Math.min(1, offset.y / currentRadius)))

    // ──────────────────────────────────────────────────────────────────────────
    // 4. ZOOM CONTROLS (Two-Hand Distance OR Single-Hand Finger Closure/Opening)
    // ──────────────────────────────────────────────────────────────────────────
    if (gestureFrame.twoHandData) {
      const newRadius = calculateTwoHandZoom(
        gestureFrame.twoHandData,
        currentRadius,
        settings.zoomSensitivity,
        controls.minDistance,
        controls.maxDistance
      )
      if (Math.abs(newRadius - currentRadius) > 0.05) {
        currentRadius = newRadius
      }
    } else if (primaryHand) {
      // Single-hand finger closure / opening zoom:
      // Closing fingers (negative delta) zooms in; opening fingers (positive delta) zooms out
      const aperture = calculateHandAperture(primaryHand.smoothedLandmarks, primaryHand.pinchDistance)
      if (prevPinchDistRef.current !== null) {
        const apertureDelta = aperture - prevPinchDistRef.current
        const newRadius = calculateSingleHandDepthZoom(
          apertureDelta,
          currentRadius,
          settings.zoomSensitivity,
          controls.minDistance,
          controls.maxDistance
        )
        if (Math.abs(newRadius - currentRadius) > 0.02) {
          currentRadius = newRadius
        }
      }
      prevPinchDistRef.current = aperture
    } else {
      prevPinchDistRef.current = null
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. NAVIGATION MODES
    // ──────────────────────────────────────────────────────────────────────────

    // ── MODE A: EXPLORE (Hand-driven camera rotation + Point-to-Select) ──
    if (mode === 'explore') {
      const isPointingOrPinching =
        primaryHand.gesture === 'pointing' ||
        primaryHand.isPinching ||
        primaryHand.pinchState === 'start'

      // Screen-space raycast to detect celestial target near fingertip (mirrored X to match screen coordinate)
      const screenFingertip = {
        x: 1 - primaryHand.indexTip.x,
        y: primaryHand.indexTip.y
      }
      const hitTarget = findTargetFromFingertip(screenFingertip, celestialObjects, camera)

      if (hitTarget) {
        if (hoveredTargetRef.current?.id === hitTarget.id) {
          stableHoverCountRef.current += 1
        } else {
          hoveredTargetRef.current = hitTarget
          stableHoverCountRef.current = 1
        }
      } else {
        hoveredTargetRef.current = null
        stableHoverCountRef.current = 0
      }

      onHoverTarget?.(hoveredTargetRef.current)

      // Evaluate pinch selection trigger with stability & cooldown
      const shouldSelect = shouldTriggerSelection(
        primaryHand.pinchState,
        stableHoverCountRef.current,
        settings.minHoverFramesBeforeSelect,
        lastSelectionTimeRef.current,
        now,
        settings.selectionCooldownMs
      )

      if (shouldSelect && hoveredTargetRef.current) {
        lastSelectionTimeRef.current = now
        const selected = hoveredTargetRef.current

        if (selected.type === 'planet' && selected.planet) {
          onSelectPlanet?.(selected.planet, selected.star)
        } else {
          onSelectStar?.(selected.star)
        }

        // Trigger camera flight
        const flight = calculateCameraFlightTarget(selected, initialCameraPosition)
        targetLookAt.current.set(...flight.lookAt)
        targetCamPos.current.set(...flight.cameraPosition)
        isFlying.current = true
      } else if (!isPointingOrPinching) {
        // Open hand camera rotation
        const dx = primaryHand.navigationDelta.deltaX
        const dy = primaryHand.navigationDelta.deltaY

        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
          const { theta, phi } = calculateSphericalRotation(
            dx,
            dy,
            currentTheta,
            currentPhi,
            settings
          )
          currentTheta = theta
          currentPhi = phi
        }
      }
    }

    // ── MODE B: GRAB (Pinch-to-grab camera drag) ──
    else if (mode === 'grab') {
      const isPinchActive = primaryHand.isPinching || primaryHand.pinchState === 'start' || primaryHand.pinchState === 'held'

      if (isPinchActive) {
        if (!isGrabbing.current || !grabAnchor.current) {
          isGrabbing.current = true
          grabAnchor.current = { x: primaryHand.palmCenter.x, y: primaryHand.palmCenter.y }
        } else {
          const dx = primaryHand.palmCenter.x - grabAnchor.current.x
          const dy = primaryHand.palmCenter.y - grabAnchor.current.y
          grabAnchor.current = { x: primaryHand.palmCenter.x, y: primaryHand.palmCenter.y }

          const { theta, phi } = calculateSphericalRotation(
            dx * 1.5,
            dy * 1.5,
            currentTheta,
            currentPhi,
            settings
          )
          currentTheta = theta
          currentPhi = phi
        }
      } else {
        isGrabbing.current = false
        grabAnchor.current = null
      }
    }

    // ── MODE C: SELECT (Planet Raycast & Pinch Selection) ──
    else if (mode === 'select') {
      const screenFingertip = {
        x: 1 - primaryHand.indexTip.x,
        y: primaryHand.indexTip.y
      }
      const hitTarget = findTargetFromFingertip(screenFingertip, celestialObjects, camera)

      if (hitTarget) {
        if (hoveredTargetRef.current?.id === hitTarget.id) {
          stableHoverCountRef.current += 1
        } else {
          hoveredTargetRef.current = hitTarget
          stableHoverCountRef.current = 1
        }
      } else {
        hoveredTargetRef.current = null
        stableHoverCountRef.current = 0
      }

      onHoverTarget?.(hoveredTargetRef.current)

      // Evaluate pinch selection trigger with stability & cooldown
      const shouldSelect = shouldTriggerSelection(
        primaryHand.pinchState,
        stableHoverCountRef.current,
        settings.minHoverFramesBeforeSelect,
        lastSelectionTimeRef.current,
        now,
        settings.selectionCooldownMs
      )

      if (shouldSelect && hoveredTargetRef.current) {
        lastSelectionTimeRef.current = now
        const selected = hoveredTargetRef.current

        if (selected.type === 'planet' && selected.planet) {
          onSelectPlanet?.(selected.planet, selected.star)
        } else {
          onSelectStar?.(selected.star)
        }

        // Trigger camera flight
        const flight = calculateCameraFlightTarget(selected, initialCameraPosition)
        targetLookAt.current.set(...flight.lookAt)
        targetCamPos.current.set(...flight.cameraPosition)
        isFlying.current = true
      }
    }

    // Reconstruct camera position from updated spherical coordinates
    offset.x = currentRadius * Math.sin(currentPhi) * Math.sin(currentTheta)
    offset.y = currentRadius * Math.cos(currentPhi)
    offset.z = currentRadius * Math.sin(currentPhi) * Math.cos(currentTheta)

    camera.position.copy(controls.target).add(offset)
    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={6}
      maxDistance={450}
      maxPolarAngle={Math.PI / 2 + 0.3}
    />
  )
}
