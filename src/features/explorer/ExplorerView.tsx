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
import { useState, useMemo, useEffect, useRef } from 'react'
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
  // Selected planet ID within focused star system
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | undefined>(undefined)

  useEffect(() => {
    setSelectedPlanetId(undefined)
  }, [selectedStarId])

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

  const defaultCelestialObjects = useMemo(() => starObservationsToCelestialObjects(stars), [stars])
  const celestialObjects = customCelestialObjects || defaultCelestialObjects

  const selectedStar = useMemo(() => {
    if (!selectedStarId) return null
    const targetKey = selectedStarId.toLowerCase().replace(/[^a-z0-9]/g, '')
    return (
      stars.find((s) => {
        const sIdKey = s.id.toLowerCase().replace(/[^a-z0-9]/g, '')
        const sNameKey = s.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        return s.id === selectedStarId || sIdKey === targetKey || sNameKey === targetKey || sNameKey.includes(targetKey) || targetKey.includes(sNameKey)
      }) ?? null
    )
  }, [stars, selectedStarId])

  // Keyboard shortcut listeners: Spacebar to pause/unpause gestures, 'c' for calibration,
  // ArrowLeft/ArrowRight to cycle through star systems
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if (e.key === ' ' && tracking.isCameraActive) {
        e.preventDefault()
        setGestureMode((prev) => (prev === 'paused' ? 'explore' : 'paused'))
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        setIsCalibrationOpen((prev) => !prev)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (stars.length === 0) return
        e.preventDefault()
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const currentIdx = getActiveStarIndex()
        const nextIdx = (currentIdx + dir + stars.length) % stars.length
        handleSelectStar(stars[nextIdx])
      } else if (e.key === 'Escape') {
        setInfoPanelOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking.isCameraActive, stars, selectedStar])

  // When a different star is selected, re-open the info panel and reset planet selection
  const handleSelectStar = (star: StarObservation) => {
    setSelectedPlanetId(undefined)
    onSelectStar(star)
    setInfoPanelOpen(true)
  }

  const targetStarIndexRef = useRef<number>(-1)

  const handleSelectObject = (obj: { id: string; name?: string; starObservation?: StarObservation }) => {
    if (obj.starObservation) {
      handleSelectStar(obj.starObservation)
      return
    }
    const targetKey = (obj.name || obj.id).toLowerCase().replace(/[^a-z0-9]/g, '')
    const star = stars.find((s) => {
      const sKey = s.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const sIdKey = s.id.toLowerCase().replace(/[^a-z0-9]/g, '')
      return (
        s.id === obj.id ||
        sIdKey === targetKey ||
        sKey === targetKey ||
        sKey.includes(targetKey) ||
        targetKey.includes(sKey) ||
        (s.catalogId && s.catalogId.toLowerCase().replace(/[^a-z0-9]/g, '') === targetKey)
      )
    })
    if (star) {
      handleSelectStar(star)
    }
  }

  const handleSelectPlanet = (planet: CelestialPlanet, parentStar: CelestialObject) => {
    setSelectedPlanetId(planet.id)
    if (parentStar.starObservation) {
      handleSelectStar(parentStar.starObservation)
      return
    }
    const targetKey = parentStar.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const star = stars.find((s) => {
      const sKey = s.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const sIdKey = s.id.toLowerCase().replace(/[^a-z0-9]/g, '')
      return s.id === parentStar.id || sIdKey === targetKey || sKey.includes(targetKey) || targetKey.includes(sKey)
    })
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

  const getActiveStarIndex = () => {
    if (stars.length === 0) return 0
    if (
      targetStarIndexRef.current >= 0 &&
      targetStarIndexRef.current < stars.length
    ) {
      const targetStar = stars[targetStarIndexRef.current]
      const currentKey = (selectedStar?.name || selectedStarId || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const targetKey = (targetStar.name || targetStar.id).toLowerCase().replace(/[^a-z0-9]/g, '')
      if (targetStar.id === selectedStarId || targetKey === currentKey) {
        return targetStarIndexRef.current
      }
    }

    const currentKey = (selectedStar?.name || selectedStarId || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const idx = stars.findIndex((s) => {
      const sIdKey = s.id.toLowerCase().replace(/[^a-z0-9]/g, '')
      const sNameKey = s.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return s.id === selectedStarId || sIdKey === currentKey || sNameKey === currentKey || sNameKey.includes(currentKey) || currentKey.includes(sNameKey)
    })
    const found = idx >= 0 ? idx : 0
    targetStarIndexRef.current = found
    return found
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
          selectedPlanetId={selectedPlanetId}
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
        currentStarIndex={getActiveStarIndex()}
        onPrevStar={() => {
          if (stars.length === 0) return
          const idx = (getActiveStarIndex() - 1 + stars.length) % stars.length
          handleSelectStar(stars[idx])
        }}
        onNextStar={() => {
          if (stars.length === 0) return
          const idx = (getActiveStarIndex() + 1) % stars.length
          handleSelectStar(stars[idx])
        }}
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

