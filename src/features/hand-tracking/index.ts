/**
 * Hand Tracking & Gesture Recognition Feature Module (Member 1)
 * 
 * Re-exports components, hooks, services, utilities, and typed contracts
 * for Member 2 (3D Interaction Engine) and Member 3 (Exploration HUD).
 */

export * from '../../types/gestures'
export { useHandTracking, type UseHandTrackingOptions, type UseHandTrackingReturn } from './useHandTracking'
export { HandTrackingOverlay, type HandTrackingOverlayProps } from './HandTrackingOverlay'
export { HandTrackingDemo, type HandTrackingDemoProps } from './HandTrackingDemo'
export { HandLandmarkerService } from './handLandmarkerService'
export {
  startWebcam,
  stopWebcam,
  isWebcamSupported,
  CameraError,
  type CameraErrorCode,
  type WebcamStartResult
} from './webcamController'
export {
  calculatePalmCenter,
  calculateHandScale,
  smoothLandmarks,
  evaluatePinchTransition,
  classifyGesture,
  processHandLandmarks,
  calculateTwoHandMetrics,
  distance2D
} from './gestureClassifier'
