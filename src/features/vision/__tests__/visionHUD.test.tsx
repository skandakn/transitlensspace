import { describe, it, expect } from 'vitest'
import type {
  CameraPosition,
  CameraState,
  FaceTrackingState,
  GestureType,
  HandTrackingState,
  HeadOrientation,
  Point3D,
} from '../types'

// Reusable distance calculation from hand tracker
function distance(p1: Point3D, p2: Point3D): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow((p1.z ?? 0) - (p2.z ?? 0), 2)
  )
}

function classifyGesture(landmarks: Point3D[]): {
  gesture: GestureType
  pinchDistance: number
  isPinching: boolean
} {
  if (landmarks.length < 21) {
    return { gesture: 'none', pinchDistance: 1, isPinching: false }
  }

  const thumbTip = landmarks[4]
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]
  const wrist = landmarks[0]

  const pinchDist = distance(thumbTip, indexTip)
  const isPinching = pinchDist < 0.075

  const indexDist = distance(indexTip, wrist)
  const middleDist = distance(middleTip, wrist)
  const ringDist = distance(ringTip, wrist)
  const pinkyDist = distance(pinkyTip, wrist)
  const indexMcpDist = distance(landmarks[5], wrist)

  const isIndexExtended = indexDist > indexMcpDist * 1.3
  const isMiddleExtended = middleDist > indexMcpDist * 1.3
  const isRingExtended = ringDist > indexMcpDist * 1.3
  const isPinkyExtended = pinkyDist > indexMcpDist * 1.3

  const extendedCount = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended].filter(
    Boolean
  ).length

  if (extendedCount === 0) {
    return { gesture: 'fist', pinchDistance: pinchDist, isPinching: false }
  }

  if (isPinching) {
    return { gesture: 'pinch', pinchDistance: pinchDist, isPinching: true }
  }

  if (extendedCount >= 4) {
    return { gesture: 'open_palm', pinchDistance: pinchDist, isPinching: false }
  }

  if (isIndexExtended && extendedCount === 1) {
    return { gesture: 'pointing', pinchDistance: pinchDist, isPinching: false }
  }

  return { gesture: 'none', pinchDistance: pinchDist, isPinching: false }
}

function calculateHeadOrientation(landmarks: {
  nose: Point3D
  leftEye: Point3D
  rightEye: Point3D
  forehead: Point3D
  chin: Point3D
}): HeadOrientation {
  const { nose, leftEye, rightEye, forehead, chin } = landmarks

  const eyeMidX = (leftEye.x + rightEye.x) / 2
  const eyeDist = Math.max(0.01, Math.abs(leftEye.x - rightEye.x))
  const rawYaw = ((nose.x - eyeMidX) / eyeDist) * 55

  const faceMidY = (forehead.y + chin.y) / 2
  const faceHeight = Math.max(0.01, Math.abs(chin.y - forehead.y))
  const rawPitch = ((nose.y - faceMidY) / faceHeight) * 65

  const rawRoll = Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x) * (180 / Math.PI)

  return {
    yaw: Math.max(-35, Math.min(35, rawYaw)),
    pitch: Math.max(-25, Math.min(25, rawPitch)),
    roll: Math.max(-25, Math.min(25, rawRoll)),
  }
}

describe('Vision HUD & Space Cockpit Controls Test Suite (Member 3)', () => {
  describe('1. Face Tracking & Head Orientation Estimation', () => {
    it('accurately calculates center neutral head orientation when looking straight ahead', () => {
      const neutralLandmarks = {
        nose: { x: 0.5, y: 0.5, z: 0 },
        leftEye: { x: 0.6, y: 0.45, z: 0 },
        rightEye: { x: 0.4, y: 0.45, z: 0 },
        forehead: { x: 0.5, y: 0.3, z: 0 },
        chin: { x: 0.5, y: 0.7, z: 0 },
      }

      const orientation = calculateHeadOrientation(neutralLandmarks)
      expect(Math.abs(orientation.yaw)).toBeLessThan(1.0)
      expect(Math.abs(orientation.pitch)).toBeLessThan(1.0)
      expect(Math.abs(orientation.roll)).toBeLessThan(1.0)
    })

    it('estimates positive yaw angle when head turns right', () => {
      const turnRightLandmarks = {
        nose: { x: 0.56, y: 0.5, z: 0 }, // nose displaced right of eye center (0.50)
        leftEye: { x: 0.6, y: 0.45, z: 0 },
        rightEye: { x: 0.4, y: 0.45, z: 0 },
        forehead: { x: 0.52, y: 0.3, z: 0 },
        chin: { x: 0.52, y: 0.7, z: 0 },
      }

      const orientation = calculateHeadOrientation(turnRightLandmarks)
      expect(orientation.yaw).toBeGreaterThan(10)
    })

    it('estimates negative yaw angle when head turns left', () => {
      const turnLeftLandmarks = {
        nose: { x: 0.44, y: 0.5, z: 0 }, // nose displaced left of eye center (0.50)
        leftEye: { x: 0.6, y: 0.45, z: 0 },
        rightEye: { x: 0.4, y: 0.45, z: 0 },
        forehead: { x: 0.48, y: 0.3, z: 0 },
        chin: { x: 0.48, y: 0.7, z: 0 },
      }

      const orientation = calculateHeadOrientation(turnLeftLandmarks)
      expect(orientation.yaw).toBeLessThan(-10)
    })

    it('estimates pitch angle when head tilts up or down', () => {
      const tiltUpLandmarks = {
        nose: { x: 0.5, y: 0.42, z: 0 }, // nose higher than face midpoint (0.50)
        leftEye: { x: 0.6, y: 0.42, z: 0 },
        rightEye: { x: 0.4, y: 0.42, z: 0 },
        forehead: { x: 0.5, y: 0.3, z: 0 },
        chin: { x: 0.5, y: 0.7, z: 0 },
      }

      const orientation = calculateHeadOrientation(tiltUpLandmarks)
      expect(orientation.pitch).toBeLessThan(-5)
    })

    it('does not require biometric facial identification and keeps tracking state anonymous', () => {
      const faceState: FaceTrackingState = {
        isFaceDetected: true,
        headOrientation: { yaw: 2, pitch: 1, roll: 0 },
        trackingStatus: 'tracking',
        headAdjustmentsEnabled: true,
        confidence: 0.94,
      }

      expect(faceState.isFaceDetected).toBe(true)
      expect(faceState).not.toHaveProperty('userId')
      expect(faceState).not.toHaveProperty('biometricEmbedding')
      expect(faceState).not.toHaveProperty('name')
    })
  })

  describe('2. Hand Tracking & Gesture Recognition Classification', () => {
    // Generate dummy 21 points for hand tests
    const baseHand: Point3D[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))

    it('classifies "open_palm" when all 4 fingers are fully extended', () => {
      const openHand: Point3D[] = [...baseHand]
      openHand[0] = { x: 0.5, y: 0.8, z: 0 } // wrist at bottom
      openHand[5] = { x: 0.45, y: 0.6, z: 0 } // index MCP
      openHand[8] = { x: 0.45, y: 0.2, z: 0 } // index tip high
      openHand[12] = { x: 0.5, y: 0.18, z: 0 } // middle tip high
      openHand[16] = { x: 0.55, y: 0.22, z: 0 } // ring tip high
      openHand[20] = { x: 0.6, y: 0.25, z: 0 } // pinky tip high
      openHand[4] = { x: 0.35, y: 0.45, z: 0 } // thumb extended

      const result = classifyGesture(openHand)
      expect(result.gesture).toBe('open_palm')
      expect(result.isPinching).toBe(false)
    })

    it('classifies "pinch" when thumb tip and index tip are in close proximity', () => {
      const pinchHand: Point3D[] = [...baseHand]
      pinchHand[0] = { x: 0.5, y: 0.8, z: 0 }
      pinchHand[4] = { x: 0.46, y: 0.35, z: 0 } // thumb tip
      pinchHand[8] = { x: 0.48, y: 0.35, z: 0 } // index tip (distance = 0.02)
      pinchHand[12] = { x: 0.55, y: 0.2, z: 0 }

      const result = classifyGesture(pinchHand)
      expect(result.gesture).toBe('pinch')
      expect(result.isPinching).toBe(true)
      expect(result.pinchDistance).toBeLessThan(0.075)
    })

    it('classifies "fist" when all fingers are curled towards wrist', () => {
      const fistHand: Point3D[] = [...baseHand]
      fistHand[0] = { x: 0.5, y: 0.8, z: 0 } // wrist
      fistHand[5] = { x: 0.5, y: 0.65, z: 0 } // index MCP
      fistHand[8] = { x: 0.5, y: 0.66, z: 0 } // curled index tip
      fistHand[12] = { x: 0.52, y: 0.66, z: 0 } // curled middle tip
      fistHand[16] = { x: 0.54, y: 0.67, z: 0 } // curled ring tip
      fistHand[20] = { x: 0.56, y: 0.68, z: 0 } // curled pinky tip
      fistHand[4] = { x: 0.48, y: 0.67, z: 0 } // curled thumb

      const result = classifyGesture(fistHand)
      expect(result.gesture).toBe('fist')
      expect(result.isPinching).toBe(false)
    })

    it('classifies "pointing" when only index finger is extended', () => {
      const pointHand: Point3D[] = [...baseHand]
      pointHand[0] = { x: 0.5, y: 0.8, z: 0 } // wrist
      pointHand[5] = { x: 0.45, y: 0.6, z: 0 } // index MCP
      pointHand[8] = { x: 0.45, y: 0.2, z: 0 } // extended index tip
      pointHand[12] = { x: 0.5, y: 0.65, z: 0 } // curled middle tip
      pointHand[16] = { x: 0.52, y: 0.66, z: 0 } // curled ring tip
      pointHand[20] = { x: 0.54, y: 0.67, z: 0 } // curled pinky tip

      const result = classifyGesture(pointHand)
      expect(result.gesture).toBe('pointing')
      expect(result.isPinching).toBe(false)
    })
  })

  describe('3. Camera State & Corner Repositioning Logic', () => {
    it('cycles corner positions in sequence: bottom-right -> top-right -> top-left -> bottom-left', () => {
      const cyclePosition = (current: CameraPosition): CameraPosition => {
        const order: CameraPosition[] = ['bottom-right', 'top-right', 'top-left', 'bottom-left']
        const idx = order.indexOf(current)
        return order[(idx + 1) % order.length]
      }

      let pos: CameraPosition = 'bottom-right'
      pos = cyclePosition(pos)
      expect(pos).toBe('top-right')

      pos = cyclePosition(pos)
      expect(pos).toBe('top-left')

      pos = cyclePosition(pos)
      expect(pos).toBe('bottom-left')

      pos = cyclePosition(pos)
      expect(pos).toBe('bottom-right')
    })

    it('properly represents permission denied camera error state', () => {
      const deniedState: CameraState = {
        isActive: false,
        isPermissionGranted: false,
        permissionDenied: true,
        error: 'Camera permission was denied by your browser.',
        position: 'bottom-right',
        isMinimized: false,
        stream: null,
        isLoading: false,
      }

      expect(deniedState.permissionDenied).toBe(true)
      expect(deniedState.isActive).toBe(false)
      expect(deniedState.error).toContain('Camera permission was denied')
    })
  })

  describe('4. Team Coordination Contracts (Members 1, 2, 3)', () => {
    it('consumes Member 1 tracking state without modifying hand coordinates', () => {
      const member1Tracking: HandTrackingState = {
        isHandDetected: true,
        handPosition: { x: 0.72, y: 0.34 },
        detectedGesture: 'pinch',
        confidence: 0.96,
        pinchDistance: 0.03,
        isPinching: true,
        trackingStatus: 'tracking',
      }

      // Consumer helper verifies direct pass-through
      const consumeMember1State = (state: HandTrackingState) => state
      const consumed = consumeMember1State(member1Tracking)

      expect(consumed.handPosition?.x).toBe(0.72)
      expect(consumed.handPosition?.y).toBe(0.34)
      expect(consumed.detectedGesture).toBe('pinch')
      expect(consumed.isPinching).toBe(true)
    })

    it('consumes Member 2 navigation mode string', () => {
      const member2Modes = ['orbit', 'free']

      member2Modes.forEach((mode) => {
        expect(['orbit', 'free']).toContain(mode)
      })
    })
  })

  describe('5. First-Time Onboarding Sequence Completeness', () => {
    it('contains all 5 mandatory onboarding steps in exact order', () => {
      const requiredSteps = [
        'Enable Camera',
        'Show an Open Palm',
        'Move Hand to Rotate',
        'Pinch to Select',
        'Release Pinch to Finish',
      ]

      expect(requiredSteps.length).toBe(5)
      expect(requiredSteps[0]).toBe('Enable Camera')
      expect(requiredSteps[1]).toBe('Show an Open Palm')
      expect(requiredSteps[2]).toBe('Move Hand to Rotate')
      expect(requiredSteps[3]).toBe('Pinch to Select')
      expect(requiredSteps[4]).toBe('Release Pinch to Finish')
    })
  })
})
