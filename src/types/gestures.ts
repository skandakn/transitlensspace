/**
 * TransitLens Real-Time Hand Tracking & Gesture Recognition Types
 * 
 * Shared architecture interface for Member 1 (Gesture Engine),
 * Member 2 (3D Interaction Engine), and Member 3 (Exploration HUD).
 */

export type HandGestureType =
  | 'none'
  | 'open-palm'
  | 'closed-fist'
  | 'pinch'
  | 'pointing'
  | 'two-hand-zoom'
  | 'tracking-lost'

export type PinchState = 'none' | 'start' | 'held' | 'end'

export type HandTrackingStatus =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'no-camera'
  | 'loading-model'
  | 'model-error'
  | 'tracking'
  | 'tracking-lost'
  | 'disabled'

export interface HandLandmark2D {
  /** Normalized X coordinate (0.0 to 1.0, where 0 is left and 1 is right) */
  x: number
  /** Normalized Y coordinate (0.0 to 1.0, where 0 is top and 1 is bottom) */
  y: number
  /** Optional depth relative to wrist landmark */
  z?: number
}

export type HandSide = 'Left' | 'Right'

export interface SingleHandData {
  /** 21 raw normalized landmarks from MediaPipe HandLandmarker */
  landmarks: HandLandmark2D[]
  /** Exponential-moving-average smoothed landmarks to prevent jitter */
  smoothedLandmarks: HandLandmark2D[]
  /** Landmark 0: Wrist position */
  wrist: HandLandmark2D
  /** Landmark 8: Index finger tip */
  indexTip: HandLandmark2D
  /** Landmark 4: Thumb tip */
  thumbTip: HandLandmark2D
  /** Calculated centroid of palm landmarks [0, 5, 9, 17] */
  palmCenter: HandLandmark2D
  /** Euclidean distance between thumb tip and index tip normalized by hand scale */
  pinchDistance: number
  /** Whether the thumb and index finger are currently touching or within pinch threshold */
  isPinching: boolean
  /** Transition edge detection: 'start' on first frame, 'held', 'end' on release, 'none' */
  pinchState: PinchState
  /** Handedness detected by model ('Left' or 'Right') */
  handedness: HandSide
  /** Model detection confidence score (0.0 to 1.0) */
  confidence: number
  /** Recognized primary gesture for this hand */
  gesture: HandGestureType
  /** Estimated instantaneous velocity in normalized units/second {vx, vy} */
  velocity: {
    vx: number
    vy: number
  }
  /** Smoothed navigation delta for pan / orbit control {deltaX, deltaY} */
  navigationDelta: {
    deltaX: number
    deltaY: number
  }
}

export interface TwoHandData {
  /** Current distance between the two palm centers in normalized space */
  distance: number
  /** Previous distance between the two palm centers */
  prevDistance: number
  /** Change in distance (positive = moving apart / zoom in, negative = moving together / zoom out) */
  distanceDelta: number
  /** Proportional zoom scale multiplier */
  zoomFactor: number
}

export interface GestureFrame {
  /** High-resolution timestamp of the captured frame */
  timestamp: number
  /** Array of tracked hands in the current frame (up to 2) */
  hands: SingleHandData[]
  /** Primary hand used for single-hand navigation & selection (default: right hand or highest confidence) */
  primaryHand: SingleHandData | null
  /** Two-hand metrics when 2 hands are simultaneously in frame */
  twoHandData: TwoHandData | null
  /** Primary aggregate gesture recognized */
  gesture: HandGestureType
  /** Pinch transition state of primary hand */
  pinchState: PinchState
  /** True when at least one hand is actively detected and tracking */
  isTracking: boolean
  /** High-level tracking subsystem status */
  trackingStatus: HandTrackingStatus
  /** Human-readable error message if status is permission-denied, no-camera, or model-error */
  errorMessage: string | null
}

export interface HandTrackingConfig {
  /** Landmark exponential smoothing alpha (0.0 to 1.0; higher = faster response, lower = smoother) */
  smoothingFactor: number
  /** Normalized distance threshold below which thumb & index are considered pinching */
  pinchThreshold: number
  /** Normalized distance threshold above which pinch is released (hysteresis to prevent flickering) */
  pinchReleaseThreshold: number
  /** Fraction of finger curled to consider hand a closed fist */
  fistCurlThreshold: number
  /** Fraction of finger extension to consider hand an open palm */
  openPalmExtensionThreshold: number
  /** Minimum movement delta below which motion is treated as stationary (deadzone) */
  movementDeadzone: number
  /** Milliseconds without detected hand before switching status to 'tracking-lost' */
  trackingLostTimeoutMs: number
  /** Maximum number of hands to track simultaneously (default: 2) */
  numHands: number
  /** Preferred camera capture width */
  videoWidth: number
  /** Preferred camera capture height */
  videoHeight: number
  /** Preferred hardware acceleration delegate */
  delegate: 'GPU' | 'CPU'
  /** CDN or local path to MediaPipe vision WASM assets */
  wasmLoaderPath?: string
  /** URL or path to hand_landmarker.task model file */
  modelAssetPath?: string
}

export const DEFAULT_HAND_TRACKING_CONFIG: HandTrackingConfig = {
  smoothingFactor: 0.45,
  pinchThreshold: 0.36,
  pinchReleaseThreshold: 0.48,
  fistCurlThreshold: 0.72,
  openPalmExtensionThreshold: 1.08,
  movementDeadzone: 0.005,
  trackingLostTimeoutMs: 320,
  numHands: 2,
  videoWidth: 640,
  videoHeight: 480,
  delegate: 'GPU',
  wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm',
  modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
}
