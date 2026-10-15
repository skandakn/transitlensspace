/**
 * Real-time Hand Gesture Classifier and Mathematics Engine
 * 
 * Performs geometric landmark analysis, exponential smoothing, pinch transition
 * detection with hysteresis, and velocity calculation without any hardcoded gesture events.
 */

import type {
  HandLandmark2D,
  SingleHandData,
  TwoHandData,
  HandGestureType,
  PinchState,
  HandTrackingConfig,
  HandSide
} from '../../types/gestures'

export function distance2D(a: HandLandmark2D, b: HandLandmark2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Calculates palm center as the weighted centroid of the wrist and metacarpal joints.
 */
export function calculatePalmCenter(landmarks: HandLandmark2D[]): HandLandmark2D {
  if (landmarks.length < 21) {
    return { x: 0.5, y: 0.5, z: 0 }
  }

  // Centroid of Wrist (0), Index MCP (5), Middle MCP (9), Ring MCP (13), Pinky MCP (17)
  const indices = [0, 5, 9, 13, 17]
  let sumX = 0
  let sumY = 0
  let sumZ = 0

  for (const idx of indices) {
    sumX += landmarks[idx].x
    sumY += landmarks[idx].y
    sumZ += landmarks[idx].z ?? 0
  }

  return {
    x: sumX / indices.length,
    y: sumY / indices.length,
    z: sumZ / indices.length
  }
}

/**
 * Stable palm length scale (distance between wrist and middle MCP joint).
 * Invariant to finger curling or pose changes.
 */
export function calculateHandScale(landmarks: HandLandmark2D[]): number {
  if (landmarks.length < 21) return 0.15
  const wrist = landmarks[0]
  const middleMcp = landmarks[9]
  const scale = distance2D(wrist, middleMcp)
  return Math.max(scale, 0.05)
}

/**
 * Checks if a finger is extended based on tip distance from wrist relative to PIP joint.
 */
function isFingerExtended(
  landmarks: HandLandmark2D[],
  tipIdx: number,
  pipIdx: number,
  thresholdRatio = 1.12
): boolean {
  const wrist = landmarks[0]
  const tipDist = distance2D(landmarks[tipIdx], wrist)
  const pipDist = distance2D(landmarks[pipIdx], wrist)
  return tipDist > pipDist * thresholdRatio
}

/**
 * Checks if a finger is curled into a fist based on tip distance from wrist relative to PIP joint.
 */
function isFingerCurled(
  landmarks: HandLandmark2D[],
  tipIdx: number,
  pipIdx: number,
  thresholdRatio = 0.94
): boolean {
  const wrist = landmarks[0]
  const tipDist = distance2D(landmarks[tipIdx], wrist)
  const pipDist = distance2D(landmarks[pipIdx], wrist)
  return tipDist < pipDist * thresholdRatio
}

/**
 * Checks if the thumb is extended outward from the hand.
 */
function isThumbExtended(landmarks: HandLandmark2D[], handScale: number): boolean {
  const thumbTip = landmarks[4]
  const pinkyMcp = landmarks[17]
  const indexMcp = landmarks[5]
  const distToPinky = distance2D(thumbTip, pinkyMcp)
  const distToIndexMcp = distance2D(thumbTip, indexMcp)
  return distToPinky > handScale * 0.85 && distToIndexMcp > handScale * 0.4
}

/**
 * Smooths landmark coordinates using an Exponential Moving Average (EMA) filter.
 */
export function smoothLandmarks(
  current: HandLandmark2D[],
  previous: HandLandmark2D[] | undefined,
  alpha: number
): HandLandmark2D[] {
  if (!previous || previous.length !== current.length) {
    return current.map((p) => ({ ...p }))
  }

  const factor = Math.max(0.01, Math.min(1.0, alpha))
  return current.map((curr, i) => {
    const prev = previous[i]
    return {
      x: prev.x + factor * (curr.x - prev.x),
      y: prev.y + factor * (curr.y - prev.y),
      z: curr.z !== undefined && prev.z !== undefined
        ? prev.z + factor * (curr.z - prev.z)
        : curr.z
    }
  })
}

/**
 * Evaluates pinch transition with hysteresis to eliminate flutter at threshold boundaries.
 */
export function evaluatePinchTransition(
  normalizedDistance: number,
  wasPinching: boolean,
  config: HandTrackingConfig
): { isPinching: boolean; pinchState: PinchState } {
  let isPinching = wasPinching

  if (wasPinching) {
    // Requires opening further than release threshold to unpinch
    if (normalizedDistance > config.pinchReleaseThreshold) {
      isPinching = false
    }
  } else {
    // Requires closing below threshold to pinch
    if (normalizedDistance < config.pinchThreshold) {
      isPinching = true
    }
  }

  let pinchState: PinchState = 'none'
  if (isPinching && !wasPinching) {
    pinchState = 'start'
  } else if (isPinching && wasPinching) {
    pinchState = 'held'
  } else if (!isPinching && wasPinching) {
    pinchState = 'end'
  } else {
    pinchState = 'none'
  }

  return { isPinching, pinchState }
}

/**
 * Classifies gesture type based on joint angles and relative landmark positions.
 */
export function classifyGesture(
  landmarks: HandLandmark2D[],
  isPinching: boolean,
  handScale: number,
  config: HandTrackingConfig
): HandGestureType {
  if (landmarks.length < 21) return 'none'

  // Priority 1: Thumb-index pinch
  if (isPinching) {
    return 'pinch'
  }

  // Analyze individual finger extension states
  const indexExtended = isFingerExtended(landmarks, 8, 6, config.openPalmExtensionThreshold)
  const middleExtended = isFingerExtended(landmarks, 12, 10, config.openPalmExtensionThreshold)
  const ringExtended = isFingerExtended(landmarks, 16, 14, config.openPalmExtensionThreshold)
  const pinkyExtended = isFingerExtended(landmarks, 20, 18, config.openPalmExtensionThreshold)
  const thumbExt = isThumbExtended(landmarks, handScale)

  // Analyze individual finger curled states
  const indexCurled = isFingerCurled(landmarks, 8, 6, config.fistCurlThreshold)
  const middleCurled = isFingerCurled(landmarks, 12, 10, config.fistCurlThreshold)
  const ringCurled = isFingerCurled(landmarks, 16, 14, config.fistCurlThreshold)
  const pinkyCurled = isFingerCurled(landmarks, 20, 18, config.fistCurlThreshold)

  // Priority 2: Closed fist (all 4 fingers curled)
  if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
    return 'closed-fist'
  }

  // Priority 3: Open palm (all 4 fingers extended + thumb extended)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExt) {
    return 'open-palm'
  }

  // Open palm fallback (4 main fingers extended even if thumb is neutral)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return 'open-palm'
  }

  // Priority 4: Pointing gesture (index extended, others curled)
  if (indexExtended && middleCurled && ringCurled && pinkyCurled) {
    return 'pointing'
  }

  return 'none'
}

/**
 * Builds a processed SingleHandData packet from raw landmarks.
 */
export function processHandLandmarks(
  rawLandmarks: HandLandmark2D[],
  previousHand: SingleHandData | null,
  handedness: HandSide,
  confidence: number,
  deltaTimeSec: number,
  config: HandTrackingConfig
): SingleHandData {
  // 1. Smooth landmarks
  const smoothedLandmarks = smoothLandmarks(
    rawLandmarks,
    previousHand?.smoothedLandmarks,
    config.smoothingFactor
  )

  // 2. Compute key feature points
  const wrist = smoothedLandmarks[0]
  const indexTip = smoothedLandmarks[8]
  const thumbTip = smoothedLandmarks[4]
  const palmCenter = calculatePalmCenter(smoothedLandmarks)
  const handScale = calculateHandScale(smoothedLandmarks)

  // 3. Pinch measurement normalized by hand scale
  const pinchEuclideanDist = distance2D(thumbTip, indexTip)
  const normalizedPinchDist = pinchEuclideanDist / handScale
  // Handedness confidence is used as a final action gate. A landmark packet can
  // still be displayed below this threshold, but it must not pan, zoom, or select.
  const isConfidenceSufficient = confidence >= config.minGestureConfidence
  const wasPinching = isConfidenceSufficient && previousHand ? previousHand.isPinching : false
  const { isPinching, pinchState } = evaluatePinchTransition(
    normalizedPinchDist,
    wasPinching,
    config
  )

  // 4. Classify gesture
  const gesture = isConfidenceSufficient
    ? classifyGesture(smoothedLandmarks, isPinching, handScale, config)
    : 'none'

  // 5. Calculate motion deltas and velocity
  let deltaX = 0
  let deltaY = 0
  let vx = 0
  let vy = 0

  if (previousHand) {
    const rawDx = palmCenter.x - previousHand.palmCenter.x
    const rawDy = palmCenter.y - previousHand.palmCenter.y

    // Apply movement deadzone to filter out natural microscopic tremors
    deltaX = isConfidenceSufficient && Math.abs(rawDx) > config.movementDeadzone ? rawDx : 0
    deltaY = isConfidenceSufficient && Math.abs(rawDy) > config.movementDeadzone ? rawDy : 0

    if (deltaTimeSec > 0.001) {
      vx = deltaX / deltaTimeSec
      vy = deltaY / deltaTimeSec
    }
  }

  return {
    landmarks: rawLandmarks,
    smoothedLandmarks,
    wrist,
    indexTip,
    thumbTip,
    palmCenter,
    pinchDistance: normalizedPinchDist,
    isPinching,
    pinchState,
    handedness,
    confidence,
    gesture,
    velocity: { vx, vy },
    navigationDelta: { deltaX, deltaY }
  }
}

/**
 * Computes two-hand interaction parameters (distance, zoom delta, zoom scale).
 */
export function calculateTwoHandMetrics(
  hand1: SingleHandData,
  hand2: SingleHandData,
  previousTwoHand: TwoHandData | null
): TwoHandData {
  const currentDistance = distance2D(hand1.palmCenter, hand2.palmCenter)
  const prevDist = previousTwoHand ? previousTwoHand.distance : currentDistance
  const distanceDelta = currentDistance - prevDist

  // Proportional zoom factor
  const zoomFactor = prevDist > 0.01 ? currentDistance / prevDist : 1.0

  return {
    distance: currentDistance,
    prevDistance: prevDist,
    distanceDelta,
    zoomFactor
  }
}
