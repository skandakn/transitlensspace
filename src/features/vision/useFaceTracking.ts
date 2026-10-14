import { useState, useEffect, useRef, useCallback } from 'react'
import type { FaceTrackingState, HeadOrientation, Point3D } from './types'

export interface UseFaceTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isActive: boolean
  isDemoMode?: boolean
}

// MediaPipe landmark indices for face orientation
const NOSE_TIP_IDX = 1
const CHIN_IDX = 152
const FOREHEAD_IDX = 10
const LEFT_EYE_IDX = 263
const RIGHT_EYE_IDX = 33

/** Exponential smoothing helper */
function smooth(current: number, target: number, factor: number): number {
  return current + (target - current) * factor
}

export function useFaceTracking({
  videoRef,
  isActive,
  isDemoMode = false,
}: UseFaceTrackingOptions) {
  const [state, setState] = useState<FaceTrackingState>({
    isFaceDetected: false,
    landmarks: undefined,
    headOrientation: { yaw: 0, pitch: 0, roll: 0 },
    trackingStatus: 'idle',
    headAdjustmentsEnabled: true,
    confidence: 0,
  })

  const landmarkerRef = useRef<any>(null)
  const animFrameRef = useRef<number | null>(null)
  const smoothedOrientation = useRef<HeadOrientation>({ yaw: 0, pitch: 0, roll: 0 })
  const lastVideoTimeRef = useRef<number>(-1)
  const lastDetectTimeRef = useRef<number>(0)
  const isProcessingRef = useRef<boolean>(false)

  // Toggle head adjustment
  const toggleHeadAdjustments = useCallback(() => {
    setState((prev) => ({
      ...prev,
      headAdjustmentsEnabled: !prev.headAdjustmentsEnabled,
    }))
  }, [])

  // Initialize MediaPipe Face Landmarker with timeout safety
  useEffect(() => {
    let isCancelled = false

    async function initFaceLandmarker() {
      if (!isActive || isDemoMode) return

      try {
        setState((prev) => ({ ...prev, trackingStatus: 'loading' }))

        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
        
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )

        if (isCancelled) return

        const loadModelPromise = FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('MediaPipe Face Landmarker load timeout')), 7000)
        )

        const faceLandmarker = await Promise.race([loadModelPromise, timeoutPromise])

        if (!isCancelled) {
          landmarkerRef.current = faceLandmarker
          setState((prev) => ({ ...prev, trackingStatus: 'searching' }))
        }
      } catch (err) {
        console.warn('FaceLandmarker load fallback:', err)
        if (!isCancelled) {
          // Graceful fallback: universe remains fully usable!
          setState((prev) => ({
            ...prev,
            trackingStatus: 'error',
            isFaceDetected: false,
          }))
        }
      }
    }

    if (isActive && !isDemoMode) {
      initFaceLandmarker()
    } else {
      const timer = setTimeout(() => {
        if (isCancelled) return
        if (isDemoMode) {
          setState((prev) => ({
            ...prev,
            trackingStatus: 'tracking',
            isFaceDetected: true,
            confidence: 0.95,
            headOrientation: { yaw: 0, pitch: 0, roll: 0 },
          }))
        } else {
          setState((prev) => ({
            ...prev,
            trackingStatus: 'idle',
            isFaceDetected: false,
            landmarks: undefined,
            headOrientation: { yaw: 0, pitch: 0, roll: 0 },
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
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close()
        } catch {
          // cleanup
        }
        landmarkerRef.current = null
      }
    }
  }, [isActive, isDemoMode])

  // Processing loop using throttled requestAnimationFrame (~12-14 FPS for zero thread lag)
  useEffect(() => {
    if (!isActive) {
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
      // Throttle to 80ms (12.5 FPS) so main thread stays 100% responsive and never freezes
      if (now - lastDetectTimeRef.current < 80) {
        animFrameRef.current = requestAnimationFrame(processFrame)
        return
      }
      lastDetectTimeRef.current = now

      if (isDemoMode) {
        // Subtle simulated breath / idle orientation for demo testing
        const time = Date.now() * 0.001
        const targetYaw = Math.sin(time * 0.8) * 3.5
        const targetPitch = Math.cos(time * 0.6) * 2.0
        
        smoothedOrientation.current.yaw = smooth(smoothedOrientation.current.yaw, targetYaw, 0.1)
        smoothedOrientation.current.pitch = smooth(smoothedOrientation.current.pitch, targetPitch, 0.1)

        setState((prev) => ({
          ...prev,
          isFaceDetected: true,
          trackingStatus: 'tracking',
          confidence: 0.98,
          headOrientation: {
            yaw: smoothedOrientation.current.yaw,
            pitch: smoothedOrientation.current.pitch,
            roll: 0,
          },
        }))

        animFrameRef.current = requestAnimationFrame(processFrame)
        return
      }

      const video = videoRef.current
      const landmarker = landmarkerRef.current

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

          if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0]
            
            // Extract key points
            const nose = landmarks[NOSE_TIP_IDX]
            const chin = landmarks[CHIN_IDX]
            const forehead = landmarks[FOREHEAD_IDX]
            const leftEye = landmarks[LEFT_EYE_IDX]
            const rightEye = landmarks[RIGHT_EYE_IDX]

            if (nose && chin && forehead && leftEye && rightEye) {
              // Calculate yaw (horizontal head angle)
              const eyeMidX = (leftEye.x + rightEye.x) / 2
              const eyeDist = Math.max(0.01, Math.abs(leftEye.x - rightEye.x))
              const rawYaw = ((nose.x - eyeMidX) / eyeDist) * 55

              // Calculate pitch (vertical head angle)
              const faceMidY = (forehead.y + chin.y) / 2
              const faceHeight = Math.max(0.01, Math.abs(chin.y - forehead.y))
              const rawPitch = ((nose.y - faceMidY) / faceHeight) * 65

              // Calculate roll
              const rawRoll =
                Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x) * (180 / Math.PI)

              // Apply smoothing factor (0.2 for smooth camera adjustments without lag)
              smoothedOrientation.current.yaw = smooth(smoothedOrientation.current.yaw, rawYaw, 0.2)
              smoothedOrientation.current.pitch = smooth(smoothedOrientation.current.pitch, rawPitch, 0.2)
              smoothedOrientation.current.roll = smooth(smoothedOrientation.current.roll, rawRoll, 0.2)

              // Clamping to comfortable ranges
              const clampedYaw = Math.max(-35, Math.min(35, smoothedOrientation.current.yaw))
              const clampedPitch = Math.max(-25, Math.min(25, smoothedOrientation.current.pitch))
              const clampedRoll = Math.max(-25, Math.min(25, smoothedOrientation.current.roll))

              // 2D/3D landmarks subset for canvas drawing
              const keyLandmarks: Point3D[] = [nose, chin, forehead, leftEye, rightEye].map((p) => ({
                x: p.x,
                y: p.y,
                z: p.z ?? 0,
              }))

              setState((prev) => ({
                ...prev,
                isFaceDetected: true,
                trackingStatus: 'tracking',
                confidence: 0.94,
                landmarks: keyLandmarks,
                headOrientation: {
                  yaw: clampedYaw,
                  pitch: clampedPitch,
                  roll: clampedRoll,
                },
              }))
            }
          } else {
            // Face lost or not in frame - decay head orientation gracefully to zero
            smoothedOrientation.current.yaw = smooth(smoothedOrientation.current.yaw, 0, 0.1)
            smoothedOrientation.current.pitch = smooth(smoothedOrientation.current.pitch, 0, 0.1)

            setState((prev) => ({
              ...prev,
              isFaceDetected: false,
              trackingStatus: 'searching',
              landmarks: undefined,
              headOrientation: {
                yaw: smoothedOrientation.current.yaw,
                pitch: smoothedOrientation.current.pitch,
                roll: 0,
              },
            }))
          }
        } catch {
          // Detection frame dropped, continue gracefully
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
  }, [isActive, isDemoMode, videoRef])

  return {
    faceState: state,
    toggleHeadAdjustments,
  }
}
