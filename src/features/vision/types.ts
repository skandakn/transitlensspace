/**
 * Vision HUD & Gesture Control - Type Definitions
 * 
 * Shared contracts for camera overlay, MediaPipe face tracking,
 * hand gesture tracking, and space simulator HUD telemetry.
 */

export type GestureType =
  | 'none'
  | 'open_palm'
  | 'pinch'
  | 'fist'
  | 'pointing'
  | 'two_fingers'
  | 'thumbs_up'

export type TrackingStatus = 'idle' | 'inactive' | 'loading' | 'searching' | 'tracking' | 'lost' | 'error'

export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface HeadOrientation {
  /** Horizontal head rotation angle in degrees (-45 to +45) */
  yaw: number
  /** Vertical head pitch angle in degrees (-30 to +30) */
  pitch: number
  /** Head roll angle in degrees (-30 to +30) */
  roll: number
}

/**
 * Member 1 Tracking State Contract
 * Consumed by Member 3 Gesture HUD without duplicating gesture recognition logic.
 */
export interface HandTrackingState {
  /** Whether at least one hand is currently detected in frame */
  isHandDetected: boolean
  /** Normalized hand position (0 to 1 in viewport coordinate space) */
  handPosition: Point2D | null
  /** Raw 3D hand landmark coordinates (21 points) */
  landmarks?: Point3D[]
  /** Recognized primary gesture */
  detectedGesture: GestureType
  /** Detection confidence score (0 to 1) */
  confidence: number
  /** Normalized distance between thumb tip and index fingertip (0 to 1) */
  pinchDistance: number
  /** Whether a pinch action is currently active */
  isPinching: boolean
  /** Hand tracking engine status */
  trackingStatus: TrackingStatus
}

/**
 * Member 3 Face Tracking State Contract
 * Generated via MediaPipe Face Landmarker locally in browser.
 */
export interface FaceTrackingState {
  /** Whether a human face is detected in the video stream */
  isFaceDetected: boolean
  /** Key face landmarks (eyes, nose, mouth contour) */
  landmarks?: Point3D[]
  /** Estimated head orientation angles */
  headOrientation: HeadOrientation
  /** Face tracking engine status */
  trackingStatus: TrackingStatus
  /** Whether subtle head-orientation camera adjustment is active */
  headAdjustmentsEnabled: boolean
  /** Detection confidence score (0 to 1) */
  confidence: number
}

export type CameraPosition = 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'

export interface CameraState {
  /** Whether the camera feed is active and capturing */
  isActive: boolean
  /** Whether the user has granted camera permissions */
  isPermissionGranted: boolean
  /** Whether camera permission was explicitly denied */
  permissionDenied: boolean
  /** Human-readable error message if camera initialization failed */
  error: string | null
  /** Current corner position of the camera overlay */
  position: CameraPosition
  /** Whether the preview is minimized to a compact status pill */
  isMinimized: boolean
  /** Active browser MediaStream */
  stream: MediaStream | null
  /** Whether the camera or tracking models are currently initializing */
  isLoading: boolean
}

export interface VisionHUDProps {
  /** Consumed tracking state from Member 1 */
  handTracking?: HandTrackingState
  /** Whether a target object is currently selected and displaying a reticle */
  hasSelectedTarget?: boolean
  /** Callback when user selects a target via pinch gesture */
  onPinchSelect?: () => void
  /** Callback when hand movement triggers navigation rotation */
  onHandNavigate?: (deltaX: number, deltaY: number) => void
  /** Callback when head orientation updates subtle camera adjustment */
  onHeadOrient?: (orientation: HeadOrientation) => void
  /** Optional custom class name */
  className?: string
  /** Shared camera active state from Member 1 */
  isCameraActive?: boolean
  /** Shared camera loading state from Member 1 */
  isCameraLoading?: boolean
  /** Shared camera error message from Member 1 */
  cameraError?: string | null
  /** Shared camera MediaStream from Member 1 */
  stream?: MediaStream | null
  /** Shared video element ref from Member 1 */
  videoRef?: React.RefObject<HTMLVideoElement | null>
  /** Callback to start or enable camera */
  onEnableCamera?: () => Promise<void> | void
  /** Callback to stop or toggle camera */
  onToggleCamera?: () => Promise<void> | void
}
