import React, { useState, useEffect, useRef } from 'react'
import { useWebcam } from './useWebcam'
import { useFaceTracking } from './useFaceTracking'
import { useHandTracking } from './useHandTracking'
import { useKeyboardControls } from './useKeyboardControls'
import { CameraOverlay } from './CameraOverlay'
import { GestureHUD } from './GestureHUD'
import { OnboardingModal } from './OnboardingModal'
import { PrivacyModal } from './PrivacyModal'
import type { HandTrackingState, VisionHUDProps } from './types'

export function VisionHUD({
  handTracking: externalHandTracking,
  hasSelectedTarget = false,
  onPinchSelect,
  onHandNavigate,
  onHeadOrient,
  className = '',
  isCameraActive: sharedIsCameraActive,
  isCameraLoading: sharedIsCameraLoading,
  cameraError: sharedCameraError,
  stream: sharedStream,
  videoRef: sharedVideoRef,
  onEnableCamera: sharedOnEnableCamera,
  onToggleCamera: sharedOnToggleCamera,
}: VisionHUDProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)

  // 1. Camera manager: fallback to useWebcam when shared camera is not provided
  const {
    state: internalCameraState,
    videoRef: internalVideoRef,
    isDemoMode,
    startCamera: internalStartCamera,
    toggleCamera: internalToggleCamera,
    cyclePosition,
    toggleMinimize,
    enableDemoMode,
  } = useWebcam({ initialPosition: 'bottom-left' })

  const isIntegrated = Boolean(sharedOnEnableCamera)
  const videoRef = isIntegrated && sharedVideoRef ? sharedVideoRef : internalVideoRef

  const cameraState: typeof internalCameraState = isIntegrated
    ? {
        isActive: Boolean(sharedIsCameraActive),
        isPermissionGranted: Boolean(sharedIsCameraActive),
        permissionDenied: Boolean(sharedCameraError?.toLowerCase().includes('denied')),
        error: sharedCameraError ?? null,
        position: internalCameraState.position,
        isMinimized: internalCameraState.isMinimized,
        stream: sharedStream ?? null,
        isLoading: Boolean(sharedIsCameraLoading),
      }
    : internalCameraState

  const startCamera = isIntegrated && sharedOnEnableCamera ? sharedOnEnableCamera : internalStartCamera
  const toggleCamera = isIntegrated && sharedOnToggleCamera ? sharedOnToggleCamera : internalToggleCamera

  // 2. Face tracking with MediaPipe
  const { faceState, toggleHeadAdjustments } = useFaceTracking({
    videoRef,
    isActive: cameraState.isActive,
    isDemoMode,
  })

  // 3. Hand tracking & gesture recognition (consumes Member 1 tracking or runs local pipeline)
  const handState: HandTrackingState = useHandTracking({
    videoRef,
    isActive: cameraState.isActive,
    isDemoMode,
    externalHandTracking,
  })

  // 4. Keyboard shortcuts (C = cam, M = minimize, P = position, H = head orient, G/? = guide)
  useKeyboardControls({
    onToggleCamera: toggleCamera,
    onToggleMinimize: toggleMinimize,
    onCyclePosition: cyclePosition,
    onToggleHeadAdjustments: toggleHeadAdjustments,
    onToggleGuide: () => setIsOnboardingOpen((prev) => !prev),
    onCloseModals: () => {
      setIsOnboardingOpen(false)
      setIsPrivacyOpen(false)
    },
  })

  // 5. Emit subtle head orientation to parent for camera parallax (thresholded for performance)
  const lastEmittedOrientRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 })
  useEffect(() => {
    if (!onHeadOrient) return
    const isEnabled = faceState.headAdjustmentsEnabled && faceState.isFaceDetected
    const targetYaw = isEnabled ? Math.round(faceState.headOrientation.yaw * 10) / 10 : 0
    const targetPitch = isEnabled ? Math.round(faceState.headOrientation.pitch * 10) / 10 : 0

    const dy = Math.abs(targetYaw - lastEmittedOrientRef.current.yaw)
    const dp = Math.abs(targetPitch - lastEmittedOrientRef.current.pitch)

    if (
      dy >= 0.4 ||
      dp >= 0.4 ||
      (!isEnabled &&
        (lastEmittedOrientRef.current.yaw !== 0 || lastEmittedOrientRef.current.pitch !== 0))
    ) {
      lastEmittedOrientRef.current = { yaw: targetYaw, pitch: targetPitch }
      onHeadOrient({ yaw: targetYaw, pitch: targetPitch, roll: 0 })
    }
  }, [
    faceState.headOrientation.yaw,
    faceState.headOrientation.pitch,
    faceState.headAdjustmentsEnabled,
    faceState.isFaceDetected,
    onHeadOrient,
  ])

  // 6. Handle Pinch Gesture -> Trigger celestial selection
  const lastPinchRef = useRef<boolean>(false)
  useEffect(() => {
    if (handState.isPinching && !lastPinchRef.current) {
      if (onPinchSelect) {
        onPinchSelect()
      }
    }
    lastPinchRef.current = handState.isPinching
  }, [handState.isPinching, onPinchSelect])

  // 7. Handle Open Palm Navigation -> Glide universe
  const lastHandPosRef = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    if (handState.detectedGesture === 'open_palm' && handState.handPosition) {
      if (lastHandPosRef.current && onHandNavigate) {
        const deltaX = (handState.handPosition.x - lastHandPosRef.current.x) * 120
        const deltaY = (handState.handPosition.y - lastHandPosRef.current.y) * 120
        if (Math.abs(deltaX) > 0.05 || Math.abs(deltaY) > 0.05) {
          onHandNavigate(deltaX, deltaY)
        }
      }
      lastHandPosRef.current = handState.handPosition
    } else {
      lastHandPosRef.current = null
    }
  }, [handState.detectedGesture, handState.handPosition, onHandNavigate])

  // Prompt onboarding on first camera activation if never shown
  const handleStartCameraWithPrivacy = () => {
    setIsPrivacyOpen(false)
    startCamera()
  }

  return (
    <div className={`contents ${className}`}>
      {/* Flight Telemetry Gesture HUD (Centered below top bar or reticle) */}
      <div
        className={`absolute left-1/2 transform -translate-x-1/2 z-25 pointer-events-none transition-all duration-300 ${
          hasSelectedTarget ? 'top-28' : 'top-16'
        }`}
      >
        <GestureHUD
          handState={handState}
          isCameraActive={cameraState.isActive}
        />
      </div>

      {/* Small Movable / Configurable Webcam Preview */}
      <CameraOverlay
        cameraState={cameraState}
        faceState={faceState}
        handState={handState}
        videoRef={videoRef}
        isDemoMode={isDemoMode}
        onToggleCamera={toggleCamera}
        onToggleMinimize={toggleMinimize}
        onCyclePosition={cyclePosition}
        onToggleHeadAdjustments={toggleHeadAdjustments}
        onEnableDemoMode={enableDemoMode}
      />

      {/* First-Time Onboarding Modal Guide */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onEnableCamera={handleStartCameraWithPrivacy}
      />

      {/* Pre-Flight Privacy Explanation Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onConfirm={handleStartCameraWithPrivacy}
        onTryDemo={() => {
          enableDemoMode()
          setIsPrivacyOpen(false)
        }}
      />
    </div>
  )
}
