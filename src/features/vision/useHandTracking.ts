import { useState, useEffect, useRef } from 'react'
import type { GestureType, HandTrackingState, Point2D, Point3D } from './types'

export interface UseHandTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isActive: boolean
  isDemoMode?: boolean
  externalHandTracking?: HandTrackingState
}

// MediaPipe hand landmark indices
const WRIST = 0
const THUMB_TIP = 4
const INDEX_FINGER_MCP = 5
const INDEX_FINGER_TIP = 8
const MIDDLE_FINGER_TIP = 12
const RING_FINGER_TIP = 16
const PINKY_TIP = 20

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

  const thumbTip = landmarks[THUMB_TIP]
  const indexTip = landmarks[INDEX_FINGER_TIP]
  const middleTip = landmarks[MIDDLE_FINGER_TIP]
  const ringTip = landmarks[RING_FINGER_TIP]
  const pinkyTip = landmarks[PINKY_TIP]
  const wrist = landmarks[WRIST]

  // Measure pinch distance between thumb tip and index tip
  const pinchDist = distance(thumbTip, indexTip)
  const isPinching = pinchDist < 0.075

  // Check finger extension relative to wrist
  const indexDist = distance(indexTip, wrist)
  const middleDist = distance(middleTip, wrist)
  const ringDist = distance(ringTip, wrist)
  const pinkyDist = distance(pinkyTip, wrist)
  const indexMcpDist = distance(landmarks[INDEX_FINGER_MCP], wrist)

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

  if (extendedCount === 0) {
    return { gesture: 'fist', pinchDistance: pinchDist, isPinching: false }
  }

  if (isIndexExtended && extendedCount === 1) {
    return { gesture: 'pointing', pinchDistance: pinchDist, isPinching: false }
  }

  return { gesture: 'none', pinchDistance: pinchDist, isPinching: false }
}

export function useHandTracking({
  videoRef,
  isActive,
  isDemoMode = false,
  externalHandTracking,
}: UseHandTrackingOptions) {
  const [internalState, setInternalState] = useState<HandTrackingState>({
    isHandDetected: false,
    handPosition: null,
    landmarks: undefined,
    detectedGesture: 'none',
    confidence: 0,
    pinchDistance: 1,
    isPinching: false,
    trackingStatus: 'idle',
  })

  const handLandmarkerRef = useRef<any>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef<number>(-1)
  const lastDetectTimeRef = useRef<number>(0)
  const isProcessingRef = useRef<boolean>(false)
  const smoothedPos = useRef<Point2D>({ x: 0.5, y: 0.5 })

  // Initialize MediaPipe HandLandmarker only if no external hand tracking is provided
  useEffect(() => {
    if (externalHandTracking) return
    let isCancelled = false

    async function initHandLandmarker() {
      if (!isActive || isDemoMode) return

      try {
        setInternalState((prev) => ({ ...prev, trackingStatus: 'loading' }))

        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )

        if (isCancelled) return

        const loadModelPromise = HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('MediaPipe Hand Landmarker load timeout')), 7000)
        )

        const handLandmarker = await Promise.race([loadModelPromise, timeoutPromise])

        if (!isCancelled) {
          handLandmarkerRef.current = handLandmarker
          setInternalState((prev) => ({ ...prev, trackingStatus: 'searching' }))
        }
      } catch (err) {
        console.warn('HandLandmarker fallback:', err)
        if (!isCancelled) {
          setInternalState((prev) => ({
            ...prev,
            trackingStatus: 'error',
            isHandDetected: false,
          }))
        }
      }
    }

    if (isActive && !isDemoMode) {
      initHandLandmarker()
    } else {
      const timer = setTimeout(() => {
        if (isCancelled) return
        if (isDemoMode) {
          setInternalState((prev) => ({
            ...prev,
            trackingStatus: 'tracking',
            isHandDetected: true,
            detectedGesture: 'open_palm',
            confidence: 0.95,
            handPosition: { x: 0.5, y: 0.5 },
          }))
        } else {
          setInternalState((prev) => ({
            ...prev,
            trackingStatus: 'idle',
            isHandDetected: false,
            handPosition: null,
            landmarks: undefined,
            detectedGesture: 'none',
          }))
        }
      }, 0)
      return () => {
        isCancelled = true
        clearTimeout(timer)
      }
    }

    return () => {
      isCancelled = true
      if (handLandmarkerRef.current) {
        try {
          handLandmarkerRef.current.close()
        } catch {
          // cleanup
        }
        handLandmarkerRef.current = null
      }
    }
  }, [isActive, isDemoMode, externalHandTracking])

  // Frame processing loop
  useEffect(() => {
    if (externalHandTracking || !isActive) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      return
    }

    let isRunning = true

    const processFrame = () => {
      if (!isRunning) return

      const now = performance.now()
      if (now - lastDetectTimeRef.current < 80) {
        animFrameRef.current = requestAnimationFrame(processFrame)
        return
      }
      lastDetectTimeRef.current = now

      if (isDemoMode) {
        const time = Date.now() * 0.001
        const x = 0.5 + Math.sin(time * 0.9) * 0.25
        const y = 0.5 + Math.cos(time * 0.7) * 0.18
        
        // Cycle gestures periodically in demo mode
        const cycle = Math.floor((time % 12) / 3)
        let gesture: GestureType = 'open_palm'
        let isPinch = false
        if (cycle === 1) {
          gesture = 'pointing'
        } else if (cycle === 2) {
          gesture = 'pinch'
          isPinch = true
        } else if (cycle === 3) {
          gesture = 'fist'
        }

        setInternalState((prev) => ({
          ...prev,
          isHandDetected: true,
          trackingStatus: 'tracking',
          handPosition: { x, y },
          detectedGesture: gesture,
          isPinching: isPinch,
          pinchDistance: isPinch ? 0.03 : 0.2,
          confidence: 0.97,
        }))

        animFrameRef.current = requestAnimationFrame(processFrame)
        return
      }

      const video = videoRef.current
      const landmarker = handLandmarkerRef.current

      if (
        video &&
        landmarker &&
        video.readyState >= 2 &&
        !video.paused &&
        !isProcessingRef.current &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastVideoTimeRef.current = video.currentTime
        isProcessingRef.current = true

        try {
          const startTimeMs = performance.now()
          const result = landmarker.detectForVideo(video, startTimeMs)

          if (result && result.landmarks && result.landmarks.length > 0) {
            const rawLandmarks = result.landmarks[0]
            const palmCenter = rawLandmarks[INDEX_FINGER_MCP] ?? rawLandmarks[0]

            // Mirror X coordinate because webcam is front-facing
            const targetX = 1 - palmCenter.x
            const targetY = palmCenter.y

            // Smooth position
            smoothedPos.current.x += (targetX - smoothedPos.current.x) * 0.3
            smoothedPos.current.y += (targetY - smoothedPos.current.y) * 0.3

            const { gesture, pinchDistance, isPinching } = classifyGesture(rawLandmarks)

            setInternalState((prev) => ({
              ...prev,
              isHandDetected: true,
              trackingStatus: 'tracking',
              handPosition: { x: smoothedPos.current.x, y: smoothedPos.current.y },
              landmarks: rawLandmarks,
              detectedGesture: gesture,
              pinchDistance,
              isPinching,
              confidence: 0.92,
            }))
          } else {
            setInternalState((prev) => ({
              ...prev,
              isHandDetected: false,
              trackingStatus: 'searching',
              handPosition: null,
              landmarks: undefined,
              detectedGesture: 'none',
              isPinching: false,
            }))
          }
        } catch {
          // Frame dropped gracefully
        } finally {
          isProcessingRef.current = false
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame)
    }

    animFrameRef.current = requestAnimationFrame(processFrame)

    return () => {
      isRunning = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [isActive, isDemoMode, videoRef, externalHandTracking])

  // Consume Member 1's tracking state if available; otherwise return internal pipeline
  return externalHandTracking ?? internalState
}
