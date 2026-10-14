import { describe, it, expect } from 'vitest'
import {
  calculatePalmCenter,
  calculateHandScale,
  smoothLandmarks,
  evaluatePinchTransition,
  classifyGesture,
  processHandLandmarks,
  calculateTwoHandMetrics
} from '../gestureClassifier'
import { DEFAULT_HAND_TRACKING_CONFIG, type HandLandmark2D, type SingleHandData } from '../../../types/gestures'

// Helper to generate a dummy 21-point hand skeleton
function createDummyLandmarks(baseX = 0.5, baseY = 0.5): HandLandmark2D[] {
  const landmarks: HandLandmark2D[] = []
  for (let i = 0; i < 21; i++) {
    landmarks.push({
      x: baseX + (i % 5) * 0.02,
      y: baseY - Math.floor(i / 4) * 0.05,
      z: 0
    })
  }
  return landmarks
}

// Helper to create an open palm pose (tips far from wrist)
function createOpenPalmLandmarks(): HandLandmark2D[] {
  const landmarks: HandLandmark2D[] = []
  // Wrist at (0.5, 0.8)
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 }

  // Thumb: 1, 2, 3, 4
  landmarks[1] = { x: 0.45, y: 0.75, z: 0 }
  landmarks[2] = { x: 0.40, y: 0.70, z: 0 }
  landmarks[3] = { x: 0.35, y: 0.65, z: 0 }
  landmarks[4] = { x: 0.30, y: 0.60, z: 0 } // Thumb extended outward

  // Index: 5(MCP), 6(PIP), 7(DIP), 8(Tip)
  landmarks[5] = { x: 0.46, y: 0.65, z: 0 }
  landmarks[6] = { x: 0.45, y: 0.55, z: 0 }
  landmarks[7] = { x: 0.44, y: 0.45, z: 0 }
  landmarks[8] = { x: 0.43, y: 0.35, z: 0 } // Extended

  // Middle: 9(MCP), 10(PIP), 11(DIP), 12(Tip)
  landmarks[9] = { x: 0.50, y: 0.65, z: 0 }
  landmarks[10] = { x: 0.50, y: 0.53, z: 0 }
  landmarks[11] = { x: 0.50, y: 0.43, z: 0 }
  landmarks[12] = { x: 0.50, y: 0.33, z: 0 } // Extended

  // Ring: 13(MCP), 14(PIP), 15(DIP), 16(Tip)
  landmarks[13] = { x: 0.54, y: 0.65, z: 0 }
  landmarks[14] = { x: 0.55, y: 0.55, z: 0 }
  landmarks[15] = { x: 0.56, y: 0.45, z: 0 }
  landmarks[16] = { x: 0.57, y: 0.35, z: 0 } // Extended

  // Pinky: 17(MCP), 18(PIP), 19(DIP), 20(Tip)
  landmarks[17] = { x: 0.58, y: 0.67, z: 0 }
  landmarks[18] = { x: 0.60, y: 0.57, z: 0 }
  landmarks[19] = { x: 0.61, y: 0.47, z: 0 }
  landmarks[20] = { x: 0.62, y: 0.38, z: 0 } // Extended

  return landmarks
}

// Helper to create a closed fist pose (tips curled down close to wrist)
function createClosedFistLandmarks(): HandLandmark2D[] {
  const landmarks = createOpenPalmLandmarks()
  // Curl finger tips towards palm (close to wrist)
  // Index
  landmarks[8] = { x: 0.46, y: 0.68, z: 0 }
  // Middle
  landmarks[12] = { x: 0.50, y: 0.68, z: 0 }
  // Ring
  landmarks[16] = { x: 0.54, y: 0.68, z: 0 }
  // Pinky
  landmarks[20] = { x: 0.58, y: 0.69, z: 0 }
  // Thumb curled
  landmarks[4] = { x: 0.46, y: 0.67, z: 0 }

  return landmarks
}

describe('Hand Tracking & Gesture Recognition Engine (Member 1)', () => {
  describe('Geometry and Palm Center Calculation', () => {
    it('calculates weighted centroid of palm joints correctly', () => {
      const landmarks = createDummyLandmarks(0.5, 0.5)
      const center = calculatePalmCenter(landmarks)

      expect(center.x).toBeGreaterThan(0.4)
      expect(center.x).toBeLessThan(0.6)
      expect(center.y).toBeCloseTo(0.4, 2)
    })

    it('returns default fallback when fewer than 21 landmarks exist', () => {
      const center = calculatePalmCenter([])
      expect(center).toEqual({ x: 0.5, y: 0.5, z: 0 })
    })

    it('calculates invariant palm scale between wrist and middle MCP', () => {
      const landmarks = createOpenPalmLandmarks()
      const scale = calculateHandScale(landmarks)

      // Distance from wrist (0.5, 0.8) to middle MCP (0.50, 0.65) is 0.15
      expect(scale).toBeCloseTo(0.15, 2)
    })
  })

  describe('Landmark Smoothing (EMA)', () => {
    it('returns copy of current landmarks on first frame', () => {
      const current = createDummyLandmarks(0.5, 0.5)
      const smoothed = smoothLandmarks(current, undefined, 0.45)

      expect(smoothed[0].x).toBe(current[0].x)
      expect(smoothed[0].y).toBe(current[0].y)
    })

    it('smooths position using exponential moving average factor', () => {
      const prev: HandLandmark2D[] = [{ x: 0.0, y: 0.0 }]
      const curr: HandLandmark2D[] = [{ x: 1.0, y: 1.0 }]
      const alpha = 0.4

      const smoothed = smoothLandmarks(curr, prev, alpha)
      // expected: prev + alpha * (curr - prev) = 0 + 0.4 * 1.0 = 0.4
      expect(smoothed[0].x).toBeCloseTo(0.4, 5)
      expect(smoothed[0].y).toBeCloseTo(0.4, 5)
    })
  })

  describe('Pinch Transition Detection with Hysteresis', () => {
    it('transitions from none -> start on initial finger contact', () => {
      const config = DEFAULT_HAND_TRACKING_CONFIG
      // Initial distance above pinchThreshold (0.36)
      const state1 = evaluatePinchTransition(0.50, false, config)
      expect(state1.isPinching).toBe(false)
      expect(state1.pinchState).toBe('none')

      // Distance drops below threshold (0.30 < 0.36) -> rising edge
      const state2 = evaluatePinchTransition(0.30, false, config)
      expect(state2.isPinching).toBe(true)
      expect(state2.pinchState).toBe('start')
    })

    it('maintains held state while fingers remain pinched', () => {
      const config = DEFAULT_HAND_TRACKING_CONFIG
      const state = evaluatePinchTransition(0.25, true, config)
      expect(state.isPinching).toBe(true)
      expect(state.pinchState).toBe('held')
    })

    it('prevents jitter/flutter between pinchThreshold and releaseThreshold (hysteresis)', () => {
      const config = DEFAULT_HAND_TRACKING_CONFIG
      // pinchThreshold = 0.36, pinchReleaseThreshold = 0.48
      // When already pinching, distance increases to 0.42 (above 0.36, but below 0.48)
      const state = evaluatePinchTransition(0.42, true, config)
      // Must remain pinching to prevent flutter!
      expect(state.isPinching).toBe(true)
      expect(state.pinchState).toBe('held')
    })

    it('transitions from held -> end when fingers exceed release threshold', () => {
      const config = DEFAULT_HAND_TRACKING_CONFIG
      // Distance opens past release threshold (0.55 > 0.48)
      const state = evaluatePinchTransition(0.55, true, config)
      expect(state.isPinching).toBe(false)
      expect(state.pinchState).toBe('end')

      // Subsequent frame returns to none
      const stateNext = evaluatePinchTransition(0.55, false, config)
      expect(stateNext.isPinching).toBe(false)
      expect(stateNext.pinchState).toBe('none')
    })
  })

  describe('Gesture Classification', () => {
    it('classifies open-palm when all fingers are extended', () => {
      const landmarks = createOpenPalmLandmarks()
      const scale = calculateHandScale(landmarks)
      const gesture = classifyGesture(landmarks, false, scale, DEFAULT_HAND_TRACKING_CONFIG)

      expect(gesture).toBe('open-palm')
    })

    it('classifies closed-fist when all fingers are curled', () => {
      const landmarks = createClosedFistLandmarks()
      const scale = calculateHandScale(landmarks)
      const gesture = classifyGesture(landmarks, false, scale, DEFAULT_HAND_TRACKING_CONFIG)

      expect(gesture).toBe('closed-fist')
    })

    it('prioritizes pinch when isPinching is true', () => {
      const landmarks = createOpenPalmLandmarks()
      const scale = calculateHandScale(landmarks)
      const gesture = classifyGesture(landmarks, true, scale, DEFAULT_HAND_TRACKING_CONFIG)

      expect(gesture).toBe('pinch')
    })

    it('classifies pointing when index is extended and others are curled', () => {
      const landmarks = createClosedFistLandmarks()
      // Extend only index finger (tip 8 and PIP 6)
      landmarks[6] = { x: 0.45, y: 0.55, z: 0 }
      landmarks[7] = { x: 0.44, y: 0.45, z: 0 }
      landmarks[8] = { x: 0.43, y: 0.35, z: 0 }

      const scale = calculateHandScale(landmarks)
      const gesture = classifyGesture(landmarks, false, scale, DEFAULT_HAND_TRACKING_CONFIG)

      expect(gesture).toBe('pointing')
    })
  })

  describe('processHandLandmarks & Motion Deadzone', () => {
    it('filters microscopic tremors below movementDeadzone', () => {
      const landmarks = createOpenPalmLandmarks()
      const config = DEFAULT_HAND_TRACKING_CONFIG

      const hand1 = processHandLandmarks(landmarks, null, 'Right', 0.9, 0.016, config)

      // Move landmarks by tiny delta (0.002 < deadzone 0.005)
      const shiftedLandmarks = landmarks.map((p) => ({
        ...p,
        x: p.x + 0.002,
        y: p.y + 0.002
      }))

      const hand2 = processHandLandmarks(shiftedLandmarks, hand1, 'Right', 0.9, 0.016, config)

      // Deadzone must suppress motion to 0
      expect(hand2.navigationDelta.deltaX).toBe(0)
      expect(hand2.navigationDelta.deltaY).toBe(0)
    })

    it('registers valid movement above movementDeadzone and computes velocity', () => {
      const landmarks = createOpenPalmLandmarks()
      const config = DEFAULT_HAND_TRACKING_CONFIG

      const hand1 = processHandLandmarks(landmarks, null, 'Right', 0.9, 0.016, config)

      // Move landmarks by significant delta (0.04 > deadzone 0.005)
      const shiftedLandmarks = landmarks.map((p) => ({
        ...p,
        x: p.x + 0.04,
        y: p.y - 0.03
      }))

      const hand2 = processHandLandmarks(shiftedLandmarks, hand1, 'Right', 0.9, 0.1, config)

      expect(hand2.navigationDelta.deltaX).toBeGreaterThan(0)
      expect(hand2.navigationDelta.deltaY).toBeLessThan(0)
      expect(hand2.velocity.vx).toBeGreaterThan(0)
      expect(hand2.velocity.vy).toBeLessThan(0)
    })
  })

  describe('Two-Hand Distance and Zoom Calculation', () => {
    it('computes distance between hands and zoomFactor', () => {
      const hand1: SingleHandData = {
        landmarks: [],
        smoothedLandmarks: [],
        wrist: { x: 0.2, y: 0.5 },
        indexTip: { x: 0.2, y: 0.3 },
        thumbTip: { x: 0.25, y: 0.35 },
        palmCenter: { x: 0.2, y: 0.5 },
        pinchDistance: 1.0,
        isPinching: false,
        pinchState: 'none',
        handedness: 'Left',
        confidence: 0.95,
        gesture: 'open-palm',
        velocity: { vx: 0, vy: 0 },
        navigationDelta: { deltaX: 0, deltaY: 0 }
      }

      const hand2: SingleHandData = {
        landmarks: [],
        smoothedLandmarks: [],
        wrist: { x: 0.6, y: 0.5 },
        indexTip: { x: 0.6, y: 0.3 },
        thumbTip: { x: 0.55, y: 0.35 },
        palmCenter: { x: 0.6, y: 0.5 },
        pinchDistance: 1.0,
        isPinching: false,
        pinchState: 'none',
        handedness: 'Right',
        confidence: 0.95,
        gesture: 'open-palm',
        velocity: { vx: 0, vy: 0 },
        navigationDelta: { deltaX: 0, deltaY: 0 }
      }

      // Initial distance: 0.6 - 0.2 = 0.4
      const metrics1 = calculateTwoHandMetrics(hand1, hand2, null)
      expect(metrics1.distance).toBeCloseTo(0.4, 2)
      expect(metrics1.zoomFactor).toBe(1.0)

      // Move hands further apart to 0.6 distance (zoom in)
      const hand2Moved = {
        ...hand2,
        palmCenter: { x: 0.8, y: 0.5 }
      }

      const metrics2 = calculateTwoHandMetrics(hand1, hand2Moved, metrics1)
      expect(metrics2.distance).toBeCloseTo(0.6, 2)
      expect(metrics2.distanceDelta).toBeCloseTo(0.2, 2)
      // zoomFactor: 0.6 / 0.4 = 1.5
      expect(metrics2.zoomFactor).toBeCloseTo(1.5, 2)
    })
  })
})
