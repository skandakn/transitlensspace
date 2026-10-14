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

const _ONBOARDING_STORAGE_KEY = 'transitlens_vision_onboarding_shown'

export function VisionHUD({
  handTracking: externalHandTracking,
  navigationMode = 'orbit',
  hasSelectedTarget = false,
  onPinchSelect,
  onHandNavigate,
  onHeadOrient,
  className = '',
}: VisionHUDProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)

  // 1. Camera manager
  const {
    state: cameraState,
    videoRef,
    isDemoMode,
    startCamera,
    toggleCamera,
    cyclePosition,
    toggleMinimize,
    enableDemoMode,
  } = useWebcam({ initialPosition: 'bottom-right' })

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

  // 5. Emit subtle head orientation to parent for camera parallax
  useEffect(() => {
    if (onHeadOrient) {
      if (faceState.headAdjustmentsEnabled && faceState.isFaceDetected) {
        onHeadOrient(faceState.headOrientation)
      } else {
        onHeadOrient({ yaw: 0, pitch: 0, roll: 0 })
      }
    }
  }, [faceState.headOrientation, faceState.headAdjustmentsEnabled, faceState.isFaceDetected, onHeadOrient])

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
          faceState={faceState}
          navigationMode={navigationMode}
          isCameraActive={cameraState.isActive}
          onOpenGuide={() => setIsOnboardingOpen(true)}
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
        onOpenGuide={() => setIsOnboardingOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
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
