/**
 * useHandTracking React Hook
 * 
 * Manages webcam lifecycle, MediaPipe HandLandmarker inference loop via requestAnimationFrame,
 * exponential smoothing, hysteresis pinch detection, tracking lost handling, and typed event dispatch.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  GestureFrame,
  HandTrackingConfig,
  HandTrackingStatus,
  SingleHandData,
  TwoHandData
} from '../../types/gestures'
import { DEFAULT_HAND_TRACKING_CONFIG } from '../../types/gestures'
import { startWebcam, stopWebcam, CameraError } from './webcamController'
import { HandLandmarkerService } from './handLandmarkerService'
import {
  processHandLandmarks,
  calculateTwoHandMetrics
} from './gestureClassifier'

export interface UseHandTrackingOptions {
  /** Automatically request camera on mount (default: false - user must press Enable Camera) */
  autoStart?: boolean
  /** Optional custom thresholds and model settings */
  config?: Partial<HandTrackingConfig>
  /** Callback fired on every inference frame with full gesture telemetry */
  onGestureFrame?: (frame: GestureFrame) => void
  /** Fired once strictly on transition to pinch (rising edge) */
  onPinchStart?: (hand: SingleHandData) => void
  /** Fired once strictly when pinch is released (falling edge) */
  onPinchEnd?: (hand: SingleHandData) => void
  /** Fired during open palm movement */
  onNavigationMove?: (deltaX: number, deltaY: number, hand: SingleHandData) => void
  /** Fired when two hands change separation distance */
  onZoomDelta?: (zoomFactor: number, distanceDelta: number, twoHandData: TwoHandData) => void
}

const EMPTY_FRAME: GestureFrame = {
  timestamp: 0,
  hands: [],
  primaryHand: null,
  twoHandData: null,
  gesture: 'none',
  pinchState: 'none',
  isTracking: false,
  trackingStatus: 'idle',
  errorMessage: null
}

export interface UseHandTrackingReturn {
  /** Underlying video element ref */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Active webcam MediaStream */
  stream: MediaStream | null
  /** High-level tracking status */
  status: HandTrackingStatus
  /** Current gesture state frame */
  currentFrame: GestureFrame | null
  /** Current gesture state frame (non-null for compatibility) */
  frame: GestureFrame
  /** User-facing error message if permission or hardware fails */
  errorMessage: string | null
  /** Error message alias */
  error: string | null
  /** Whether the webcam stream is currently active */
  isCameraActive: boolean
  /** Webcam stream active alias */
  isWebcamActive: boolean
  /** Whether hands are actively being tracked */
  isTracking: boolean
  /** Whether model or camera is initializing */
  isLoading: boolean
  /** Measured inference frames per second */
  fps: number
  /** Request camera permission and begin tracking */
  enableCamera: () => Promise<void>
  /** Start tracking alias */
  startTracking: () => Promise<void>
  /** Stop webcam hardware tracks and clear state */
  disableCamera: () => void
  /** Stop tracking alias */
  stopTracking: () => void
  /** Toggle camera state */
  toggleCamera: () => Promise<void>
  /** Toggle tracking alias */
  toggleTracking: () => void
}

export type UseHandTrackingResult = UseHandTrackingReturn

export function useHandTracking(
  options: UseHandTrackingOptions = {}
): UseHandTrackingReturn {
  const {
    autoStart = false,
    config: userConfig,
    onGestureFrame,
    onPinchStart,
    onPinchEnd,
    onNavigationMove,
    onZoomDelta
  } = options

  const configRef = useRef<HandTrackingConfig>({
    ...DEFAULT_HAND_TRACKING_CONFIG,
    ...userConfig
  })

  useEffect(() => {
    configRef.current = {
      ...DEFAULT_HAND_TRACKING_CONFIG,
      ...userConfig
    }
  }, [userConfig])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const masterVideoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const isRunningRef = useRef<boolean>(false)

  // Tracking history refs
  const prevHandsRef = useRef<{ [key: string]: SingleHandData }>({})
  const prevTwoHandRef = useRef<TwoHandData | null>(null)
  const lastDetectionTimeRef = useRef<number>(0)
  const lastFrameTimestampRef = useRef<number>(0)
  const fpsFrameCountRef = useRef<number>(0)
  const fpsLastCalculatedRef = useRef<number>(0)

  // React states
  const [status, setStatus] = useState<HandTrackingStatus>('idle')
  const [currentFrame, setCurrentFrame] = useState<GestureFrame | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fps, setFps] = useState<number>(0)

  const isCameraActive =
    status === 'tracking' ||
    status === 'tracking-lost' ||
    status === 'loading-model' ||
    status === 'requesting-permission'

  const isTracking = status === 'tracking'
  const isLoading = status === 'requesting-permission' || status === 'loading-model'

  // Stable callbacks refs to avoid re-triggering loops
  const callbacksRef = useRef({
    onGestureFrame,
    onPinchStart,
    onPinchEnd,
    onNavigationMove,
    onZoomDelta
  })

  useEffect(() => {
    callbacksRef.current = {
      onGestureFrame,
      onPinchStart,
      onPinchEnd,
      onNavigationMove,
      onZoomDelta
    }
  }, [onGestureFrame, onPinchStart, onPinchEnd, onNavigationMove, onZoomDelta])

  // Stable frame loop ref to eliminate circular initialization
  const loopRef = useRef<(timestamp: number) => void>(() => {})

  useEffect(() => {
    loopRef.current = (timestamp: number) => {
    if (!isRunningRef.current) return

    // Ensure display videoRef has stream attached if it mounted after camera started
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.muted = true
      videoRef.current.defaultMuted = true
      videoRef.current.playsInline = true
      videoRef.current.autoplay = true
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }

    const video = (masterVideoRef.current && masterVideoRef.current.readyState >= 2)
      ? masterVideoRef.current
      : videoRef.current

    if (!video || video.readyState < 2) {
      rafIdRef.current = requestAnimationFrame((ts) => loopRef.current(ts))
      return
    }

    // Calculate delta time
    const lastTime = lastFrameTimestampRef.current || timestamp
    const deltaTimeSec = Math.max(0.001, (timestamp - lastTime) / 1000)
    lastFrameTimestampRef.current = timestamp

    // Calculate rolling FPS
    fpsFrameCountRef.current++
    if (timestamp - fpsLastCalculatedRef.current >= 1000) {
      setFps(fpsFrameCountRef.current)
      fpsFrameCountRef.current = 0
      fpsLastCalculatedRef.current = timestamp
    }

    const landmarkerService = HandLandmarkerService.getInstance()
    const detectionResult = landmarkerService.detectForVideo(video, timestamp)

    const hasHands =
      detectionResult &&
      detectionResult.landmarks &&
      detectionResult.landmarks.length > 0

    const now = performance.now()
    const currentConfig = configRef.current

    if (hasHands && detectionResult.landmarks.length > 0) {
      lastDetectionTimeRef.current = now

      const currentHands: SingleHandData[] = []
      const newPrevHands: { [key: string]: SingleHandData } = {}

      for (let i = 0; i < detectionResult.landmarks.length; i++) {
        const rawLandmarks = detectionResult.landmarks[i]
        const handednessInfo = detectionResult.handednesses?.[i]?.[0]
        const handedness = (handednessInfo?.categoryName as 'Left' | 'Right') || (i === 0 ? 'Right' : 'Left')
        const confidence = handednessInfo?.score ?? 0.85

        const prevHand = prevHandsRef.current[handedness] || null
        const handData = processHandLandmarks(
          rawLandmarks,
          prevHand,
          handedness,
          confidence,
          deltaTimeSec,
          currentConfig
        )

        currentHands.push(handData)
        newPrevHands[handedness] = handData
      }

      prevHandsRef.current = newPrevHands

      // Two-hand metrics if 2 hands are visible
      let twoHandData: TwoHandData | null = null
      if (currentHands.length >= 2) {
        twoHandData = calculateTwoHandMetrics(
          currentHands[0],
          currentHands[1],
          prevTwoHandRef.current
        )
        prevTwoHandRef.current = twoHandData
      } else {
        prevTwoHandRef.current = null
      }

      // Primary hand: prefer Right hand, or hand with highest confidence
      const primaryHand =
        currentHands.find((h) => h.handedness === 'Right') ||
        currentHands[0] ||
        null

      // Primary gesture determination
      let aggregateGesture = primaryHand?.gesture || 'none'
      if (twoHandData && Math.abs(twoHandData.distanceDelta) > 0.015) {
        aggregateGesture = 'two-hand-zoom'
      }

      const frame: GestureFrame = {
        timestamp,
        hands: currentHands,
        primaryHand,
        twoHandData,
        gesture: aggregateGesture,
        pinchState: primaryHand?.pinchState || 'none',
        isTracking: true,
        trackingStatus: 'tracking',
        errorMessage: null
      }

      setStatus('tracking')
      setCurrentFrame(frame)

      // Dispatch typed events to callbacks
      const callbacks = callbacksRef.current
      callbacks.onGestureFrame?.(frame)

      if (primaryHand) {
        if (primaryHand.pinchState === 'start') {
          callbacks.onPinchStart?.(primaryHand)
        } else if (primaryHand.pinchState === 'end') {
          callbacks.onPinchEnd?.(primaryHand)
        }

        if (
          (primaryHand.gesture === 'open-palm' || primaryHand.gesture === 'none') &&
          (primaryHand.navigationDelta.deltaX !== 0 ||
            primaryHand.navigationDelta.deltaY !== 0)
        ) {
          callbacks.onNavigationMove?.(
            primaryHand.navigationDelta.deltaX,
            primaryHand.navigationDelta.deltaY,
            primaryHand
          )
        }
      }

      if (twoHandData && Math.abs(twoHandData.distanceDelta) > 0.005) {
        callbacks.onZoomDelta?.(
          twoHandData.zoomFactor,
          twoHandData.distanceDelta,
          twoHandData
        )
      }
    } else {
      // No hands in this frame: check if tracking lost threshold reached
      const timeSinceLastDetection = now - lastDetectionTimeRef.current
      const isTrackingLost =
        lastDetectionTimeRef.current > 0 &&
        timeSinceLastDetection > currentConfig.trackingLostTimeoutMs

      if (isTrackingLost) {
        prevHandsRef.current = {}
        prevTwoHandRef.current = null

        const lostFrame: GestureFrame = {
          timestamp,
          hands: [],
          primaryHand: null,
          twoHandData: null,
          gesture: 'tracking-lost',
          pinchState: 'none',
          isTracking: false,
          trackingStatus: 'tracking-lost',
          errorMessage: null
        }

        setStatus('tracking-lost')
        setCurrentFrame(lostFrame)
        callbacksRef.current.onGestureFrame?.(lostFrame)
      }
    }

    if (isRunningRef.current) {
      rafIdRef.current = requestAnimationFrame((ts) => loopRef.current(ts))
    }
  }
  })

  /**
   * Starts webcam hardware and loads vision model
   */
  const enableCamera = useCallback(async () => {
    setErrorMessage(null)
    setStatus('requesting-permission')

    try {
      if (!masterVideoRef.current) {
        const v = document.createElement('video')
        v.setAttribute('playsinline', 'true')
        v.muted = true
        v.defaultMuted = true
        v.autoplay = true
        v.style.position = 'fixed'
        v.style.bottom = '0px'
        v.style.left = '0px'
        v.style.width = '160px'
        v.style.height = '120px'
        v.style.opacity = '0.001'
        v.style.pointerEvents = 'none'
        v.style.zIndex = '-1000'
        document.body.appendChild(v)
        masterVideoRef.current = v
      }

      const activeConfig = configRef.current

      // 1. Request hardware video stream
      const activeStream = await startWebcam(masterVideoRef.current, activeConfig.videoWidth, activeConfig.videoHeight)
      streamRef.current = activeStream
      setStream(activeStream)

      // Also attach to display videoRef if already in DOM
      if (videoRef.current) {
        videoRef.current.muted = true
        videoRef.current.defaultMuted = true
        videoRef.current.playsInline = true
        videoRef.current.autoplay = true
        videoRef.current.srcObject = activeStream
        videoRef.current.play().catch(() => {})
      }

      // 2. Start RAF loop immediately so video feed is active and visible to user
      isRunningRef.current = true
      lastDetectionTimeRef.current = performance.now()
      lastFrameTimestampRef.current = performance.now()
      fpsFrameCountRef.current = 0
      fpsLastCalculatedRef.current = performance.now()
      setStatus('tracking-lost') // Camera is LIVE and awaiting hands
      rafIdRef.current = requestAnimationFrame((ts) => loopRef.current(ts))

      // 3. Load and initialize MediaPipe HandLandmarker in background
      try {
        const landmarkerService = HandLandmarkerService.getInstance()
        await landmarkerService.initialize(activeConfig)
      } catch (modelErr: any) {
        console.warn('[HandTracking] MediaPipe model initialization warning (camera remains active):', modelErr)
      }
    } catch (err: any) {
      isRunningRef.current = false
      if (err instanceof CameraError) {
        if (err.code === 'PERMISSION_DENIED') {
          setStatus('permission-denied')
        } else if (err.code === 'NO_CAMERA') {
          setStatus('no-camera')
        } else {
          setStatus('model-error')
        }
        setErrorMessage(err.message)
      } else {
        setStatus('model-error')
        setErrorMessage(
          err?.message || 'Failed to initialize vision tracking model.'
        )
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {
            // ignore
          }
        })
        streamRef.current = null
      }
      setStream(null)
      if (masterVideoRef.current) {
        stopWebcam(masterVideoRef.current)
      }
      if (videoRef.current) {
        stopWebcam(videoRef.current)
      }
    }
  }, [])

  /**
   * Disables camera, stops all active hardware tracks and clears state
   */
  const disableCamera = useCallback(() => {
    isRunningRef.current = false
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {
          // ignore
        }
      })
      streamRef.current = null
    }
    setStream(null)

    if (masterVideoRef.current) {
      stopWebcam(masterVideoRef.current)
      masterVideoRef.current.remove()
      masterVideoRef.current = null
    }

    if (videoRef.current) {
      stopWebcam(videoRef.current)
    }

    prevHandsRef.current = {}
    prevTwoHandRef.current = null
    lastDetectionTimeRef.current = 0

    setStatus('disabled')
    setCurrentFrame(null)
    setFps(0)
  }, [])

  const toggleCamera = useCallback(async () => {
    if (isCameraActive) {
      disableCamera()
    } else {
      await enableCamera()
    }
  }, [isCameraActive, disableCamera, enableCamera])

  const toggleTracking = useCallback(() => {
    void toggleCamera()
  }, [toggleCamera])

  // Optional autoStart delayed slightly to avoid render-phase state transitions
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        void enableCamera()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [autoStart, enableCamera])

  // Teardown hardware tracks on component unmount
  useEffect(() => {
    const activeVideo = videoRef.current
    return () => {
      isRunningRef.current = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {
            // ignore
          }
        })
        streamRef.current = null
      }
      if (masterVideoRef.current) {
        stopWebcam(masterVideoRef.current)
        masterVideoRef.current.remove()
        masterVideoRef.current = null
      }
      if (activeVideo) {
        stopWebcam(activeVideo)
      }
    }
  }, [])

  return {
    videoRef,
    stream,
    status,
    currentFrame,
    frame: currentFrame ?? EMPTY_FRAME,
    errorMessage,
    error: errorMessage,
    isCameraActive,
    isWebcamActive: isCameraActive,
    isTracking,
    isLoading,
    fps,
    enableCamera,
    startTracking: enableCamera,
    disableCamera,
    stopTracking: disableCamera,
    toggleCamera,
    toggleTracking
  }
}
