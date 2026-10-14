/**
 * ExplorerView – the cinematic full-screen universe explorer for TransitLens.
 *
 * Architecture:
 *  ┌─────────────────────────────────────────────────────┐
 *  │  absolute container (fills parent)                  │
 *  │  ┌─────────────────────────────────────────────┐   │
 *  │  │  UniverseScene (3D WebGL canvas)             │   │
 *  │  │  fills 100 %                                 │   │
 *  │  └─────────────────────────────────────────────┘   │
 *  │  ┌─────────────────────────────────────────────┐   │
 *  │  │  HUD layer (pointer-events: none)            │   │
 *  │  │  ├─ top-left:   HudTopBar                   │   │
 *  │  │  ├─ top-right:  CelestialSearch             │   │
 *  │  │  ├─ right:      ObjectInfoPanel (if sel.)   │   │
 *  │  │  ├─ bottom-left: NavigationControls          │   │
 *  │  │  └─ bottom-right: CoordinateDisplay          │   │
 *  │  └─────────────────────────────────────────────┘   │
 *  └─────────────────────────────────────────────────────┘
 *
 * The ExplorerView owns camera-control state that it passes down to both
 * the HUD and UniverseScene so they stay in sync without prop-drilling a
 * shared ref.
 */
import { useState, useMemo, useEffect } from 'react'
import { UniverseScene, starObservationsToCelestialObjects } from '../universe'
import { ExplorerHUD } from './ExplorerHUD'
import { useHandTracking } from '../hand-tracking'
import { GestureCalibrationModal } from './GestureCalibrationModal'
import {
  DEFAULT_GESTURE_SETTINGS,
  type GestureNavigationMode,
  type GestureNavigationSettings,
  type GestureTarget
} from '../universe/gestures/types'
import type { NavControlState } from './NavigationControls'
import type { ExplorerMode } from './types'
import type { StarObservation, CelestialObject, CelestialPlanet } from '../../types'
import type { HandTrackingState, HeadOrientation, GestureType, Point3D } from '../vision'
import './hud.css'

export interface ExplorerViewProps {
  /** All known star observations to render in the 3D scene and catalogue */
  stars: StarObservation[]
  /** Currently focused star ID (drives camera and info panel) */
  selectedStarId: string
  /** Called when the user selects a different star via the HUD */
  onSelectStar: (star: StarObservation) => void
  /** Called when the user clicks "Light Curve / Analyze" in the info panel */
  onNavigateToAnalysis: () => void
  /** Optional callback to return to wide universe view or deselect */
  onReturnToUniverse?: () => void
  /** Pre-bundled or adapted celestial objects with physical measurements */
  celestialObjects?: CelestialObject[]
  /** Consumed tracking state from Member 1 */
  handTracking?: HandTrackingState
}

export function ExplorerView({
  stars,
  selectedStarId,
  onSelectStar,
  onNavigateToAnalysis,
  onReturnToUniverse,
  celestialObjects: customCelestialObjects,
  handTracking: customHandTracking,
}: ExplorerViewProps) {
  // ── Camera / display state ──
  const [mode, setMode] = useState<ExplorerMode>('orbit')
  const [navState, setNavState] = useState<NavControlState>({
    showOrbits: true,
    showLabels: true,
    enableMotion: true,
    quality: 'high',
  })
  // Track whether info panel is open (closed by user vs. no selection)
  const [infoPanelOpen, setInfoPanelOpen] = useState(true)
  // Gesture navigation and calibration state (Member 2, Member 3 & Member 4)
  const [gestureMode, setGestureMode] = useState<GestureNavigationMode>('explore')
  const [gestureSettings, setGestureSettings] = useState<GestureNavigationSettings>(DEFAULT_GESTURE_SETTINGS)
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false)
  const [hoveredGestureTarget, setHoveredGestureTarget] = useState<GestureTarget | null>(null)
  // Reset key forces UniverseScene to re-mount and reset camera
  const [resetKey, setResetKey] = useState(0)
  // Head orientation for subtle perspective parallax adjustment
  const [headOrient, setHeadOrient] = useState<HeadOrientation>({ yaw: 0, pitch: 0, roll: 0 })

  // Real-time hand tracking hook (Member 1)
  const tracking = useHandTracking({
    onPinchStart: () => {
      // Pinch triggers inspection of currently focused star if info panel is closed
      setInfoPanelOpen(true)
    }
  })

  // Adapt Member 1's GestureFrame into Member 3's HandTrackingState
  const adaptedHandTracking: HandTrackingState = useMemo(() => {
    if (customHandTracking) return customHandTracking

    const primaryHand = tracking.frame.primaryHand
    let gestureType: GestureType = 'none'
    if (tracking.frame.gesture === 'open-palm') gestureType = 'open_palm'
    else if (tracking.frame.gesture === 'closed-fist') gestureType = 'fist'
    else if (tracking.frame.gesture === 'pinch') gestureType = 'pinch'
    else if (tracking.frame.gesture === 'pointing') gestureType = 'pointing'

    let trackingStatus: 'idle' | 'searching' | 'tracking' | 'loading' | 'lost' | 'error' = 'idle'
    if (tracking.status === 'tracking') trackingStatus = 'tracking'
    else if (tracking.status === 'tracking-lost') trackingStatus = 'lost'
    else if (tracking.status === 'loading-model' || tracking.status === 'requesting-permission') trackingStatus = 'loading'
    else if (
      tracking.status === 'permission-denied' ||
      tracking.status === 'model-error' ||
      tracking.status === 'no-camera'
    )
      trackingStatus = 'error'

    return {
      isHandDetected: Boolean(primaryHand),
      handPosition: primaryHand ? { x: 1 - primaryHand.palmCenter.x, y: primaryHand.palmCenter.y } : null,
      landmarks: primaryHand
        ? primaryHand.smoothedLandmarks.map((p): Point3D => ({ x: 1 - p.x, y: p.y, z: p.z ?? 0 }))
        : undefined,
      detectedGesture: gestureType,
      confidence: primaryHand?.confidence ?? 0,
      pinchDistance: primaryHand?.pinchDistance ?? 1,
      isPinching: primaryHand?.isPinching ?? false,
      trackingStatus,
    }
  }, [customHandTracking, tracking.frame, tracking.status])

  // Keyboard shortcut listeners: Spacebar to pause/unpause gestures, 'c' for calibration
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.key === ' ' && tracking.isCameraActive) {
        e.preventDefault()
        setGestureMode((prev) => (prev === 'paused' ? 'explore' : 'paused'))
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        setIsCalibrationOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tracking.isCameraActive])

  const defaultCelestialObjects = useMemo(() => starObservationsToCelestialObjects(stars), [stars])
  const celestialObjects = customCelestialObjects || defaultCelestialObjects

  const selectedStar = useMemo(
    () => stars.find((s) => s.id === selectedStarId) ?? null,
    [stars, selectedStarId]
  )

  // When a different star is selected, re-open the info panel
  const handleSelectStar = (star: StarObservation) => {
    onSelectStar(star)
    setInfoPanelOpen(true)
  }

  const handleSelectObject = (obj: { id: string; starObservation?: StarObservation }) => {
    if (obj.starObservation) {
      handleSelectStar(obj.starObservation)
    } else {
      const star = stars.find((s) => s.id === obj.id)
      if (star) handleSelectStar(star)
    }
  }

  const handleSelectPlanet = (_planet: CelestialPlanet, parentStar: CelestialObject) => {
    const star = stars.find((s) => s.id === parentStar.id)
    if (star) {
      handleSelectStar(star)
    }
  }

  const handleResetCamera = () => {
    // Increment key so UniverseScene re-mounts with the default camera position
    setResetKey((k) => k + 1)
  }

  const handleReturnToUniverse = () => {
    setInfoPanelOpen(false)
    handleResetCamera()
    if (onReturnToUniverse) {
      onReturnToUniverse()
    }
  }

  // Handle pinch gesture: lock onto / inspect celestial target
  const handlePinchSelect = () => {
    if (!infoPanelOpen) {
      setInfoPanelOpen(true)
    } else if (stars.length > 0) {
      const currentIndex = stars.findIndex((s) => s.id === selectedStarId)
      const nextIndex = (currentIndex + 1) % stars.length
      handleSelectStar(stars[nextIndex])
    }
  }

  // Handle open palm gesture: glide universe target coordinates
  const handleHandNavigate = (deltaX: number) => {
    if (Math.abs(deltaX) > 40 && stars.length > 0) {
      const dir = deltaX > 0 ? 1 : -1
      const currentIndex = stars.findIndex((s) => s.id === selectedStarId)
      const nextIndex = (currentIndex + dir + stars.length) % stars.length
      handleSelectStar(stars[nextIndex])
    }
  }

  return (
    <div className="hud-explorer" id="explorer-view">
      {/* ── 3D Canvas with subtle Head-Orientation Parallax Viewport ── */}
      <div
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{
          transform: `perspective(1200px) rotateY(${headOrient.yaw * 0.12}deg) rotateX(${
            -headOrient.pitch * 0.12
          }deg)`,
          transformOrigin: 'center center',
        }}
      >
        <UniverseScene
          key={resetKey}
          celestialObjects={celestialObjects}
          selectedObjectId={selectedStarId}
          onSelectObject={handleSelectObject}
          onSelectPlanet={handleSelectPlanet}
          onHoverGestureTarget={setHoveredGestureTarget}
          gestureFrame={tracking.frame}
          gestureMode={gestureMode}
          gestureSettings={gestureSettings}
          showOrbits={navState.showOrbits}
          showLabels={navState.showLabels}
          enableMotion={navState.enableMotion}
          quality={navState.quality}
          hideDefaultControls={true}
          className="absolute inset-0 rounded-none border-none"
        />
      </div>

      {/* ── Cinematic Space-Exploration HUD Overlay ── */}
      <ExplorerHUD
        stars={stars}
        selectedStar={selectedStar}
        onSelectStar={handleSelectStar}
        onNavigateToAnalysis={onNavigateToAnalysis}
        onResetCamera={handleResetCamera}
        onReturnToUniverse={handleReturnToUniverse}
        mode={mode}
        onModeChange={setMode}
        navState={navState}
        onToggleOrbits={() =>
          setNavState((s) => ({ ...s, showOrbits: !s.showOrbits }))
        }
        onToggleLabels={() =>
          setNavState((s) => ({ ...s, showLabels: !s.showLabels }))
        }
        onToggleMotion={() =>
          setNavState((s) => ({ ...s, enableMotion: !s.enableMotion }))
        }
        onToggleQuality={() =>
          setNavState((s) => ({
            ...s,
            quality: s.quality === 'high' ? 'low' : 'high',
          }))
        }
        infoPanelOpen={infoPanelOpen}
        onToggleInfoPanel={setInfoPanelOpen}
        isCameraActive={tracking.isCameraActive}
        isCameraLoading={tracking.isLoading}
        cameraError={tracking.errorMessage}
        cameraStream={tracking.stream}
        videoRef={tracking.videoRef}
        onEnableCamera={tracking.enableCamera}
        onToggleCamera={tracking.toggleCamera}
        gestureFrame={tracking.frame}
        hoveredGestureTarget={hoveredGestureTarget}
        systemCount={celestialObjects.length}
        handTracking={adaptedHandTracking}
        onHeadOrient={setHeadOrient}
        onPinchSelect={handlePinchSelect}
        onHandNavigate={handleHandNavigate}
      />

      {/* ── Gesture Calibration & Kinematics Modal (Member 4) ── */}
      <GestureCalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        settings={gestureSettings}
        onUpdateSettings={setGestureSettings}
        mode={gestureMode}
        onModeChange={setGestureMode}
        gestureFrame={tracking.frame}
        fps={tracking.fps}
      />
    </div>
  )
}

