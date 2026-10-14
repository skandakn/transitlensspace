/**
 * TransitLens Gesture Navigation Architecture Types (Member 2)
 *
 * Interfaces for hand-driven rotation, pinch-to-grab, two-hand zoom,
 * planet raycasting, camera flight, and navigation modes.
 */

import type { CelestialObject, CelestialPlanet } from '../../../types/universe'
import type { HandGestureType, PinchState, SingleHandData } from '../../../types/gestures'

export type GestureNavigationMode = 'explore' | 'grab' | 'select' | 'paused'

export interface GestureTarget {
  type: 'star' | 'planet'
  id: string
  name: string
  star: CelestialObject
  planet?: CelestialPlanet
  worldPosition: [number, number, number]
  screenX: number
  screenY: number
  distanceToFingertip: number
}

export interface GestureNavigationSettings {
  /** Azimuthal (horizontal) camera rotation sensitivity multiplier */
  rotationSensitivity: number
  /** Polar (vertical) camera elevation sensitivity multiplier */
  verticalSensitivity: number
  /** Zoom distance sensitivity multiplier */
  zoomSensitivity: number
  /** Minimum normalized movement delta to ignore tremors (dead zone) */
  movementDeadzone: number
  /** Cooldown in milliseconds between consecutive selections to prevent accidental triggers */
  selectionCooldownMs: number
  /** Minimum consecutive frames hovering a planet before pinch selection is armed */
  minHoverFramesBeforeSelect: number
  /** Camera flight smoothing interpolation factor (0.0 to 1.0) */
  flightLerpSpeed: number
  /** Invert X rotation direction */
  invertX: boolean
  /** Invert Y rotation direction */
  invertY: boolean
}

export const DEFAULT_GESTURE_SETTINGS: GestureNavigationSettings = {
  rotationSensitivity: 2.4,
  verticalSensitivity: 1.8,
  zoomSensitivity: 2.2,
  movementDeadzone: 0.005,
  selectionCooldownMs: 650,
  minHoverFramesBeforeSelect: 3,
  flightLerpSpeed: 4.6,
  invertX: false,
  invertY: false
}

export interface GestureNavigationState {
  mode: GestureNavigationMode
  isTracking: boolean
  gesture: HandGestureType
  pinchState: PinchState
  primaryHand: SingleHandData | null
  hoveredTarget: GestureTarget | null
  selectedTarget: GestureTarget | null
  isGrabActive: boolean
  isFlying: boolean
  settings: GestureNavigationSettings
  cameraTarget: [number, number, number] | null
  lastSelectionTimestamp: number
  stableHoverFrameCount: number
}
