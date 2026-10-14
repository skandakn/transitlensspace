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
import { useState, useMemo } from 'react'
import { UniverseScene, starObservationsToCelestialObjects } from '../universe'
import { ExplorerHUD } from './ExplorerHUD'
import type { NavControlState } from './NavigationControls'
import type { ExplorerMode } from './types'
import type { StarObservation } from '../../types'
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
}

export function ExplorerView({
  stars,
  selectedStarId,
  onSelectStar,
  onNavigateToAnalysis,
  onReturnToUniverse,
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
  // Reset key forces UniverseScene to re-mount and reset camera
  const [resetKey, setResetKey] = useState(0)

  const celestialObjects = useMemo(() => starObservationsToCelestialObjects(stars), [stars])

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
    if (obj.starObservation) handleSelectStar(obj.starObservation)
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

  return (
    <div className="hud-explorer" id="explorer-view">
      {/* ── 3D Canvas ── */}
      <UniverseScene
        key={resetKey}
        celestialObjects={celestialObjects}
        selectedObjectId={selectedStarId}
        onSelectObject={handleSelectObject}
        showOrbits={navState.showOrbits}
        showLabels={navState.showLabels}
        enableMotion={navState.enableMotion}
        quality={navState.quality}
        hideDefaultControls={true}
        className="absolute inset-0 rounded-none border-none"
      />

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
        systemCount={celestialObjects.length}
      />
    </div>
  )
}

