/**
 * ExplorerHUD – the reusable cinematic space-exploration Heads-Up Display.
 *
 * Implements a non-blocking overlay (pointer-events: none) with glassmorphic,
 * interactive child controls (pointer-events: auto) that sit over the interactive 3D WebGL canvas.
 *
 * Components integrated:
 *  - HudTopBar: Compact TransitLens logo and orbit/flight mode controls
 *  - CelestialSearch: Searchable star & planet catalogue with ⌘K shortcut
 *  - ObjectLabel: Floating target lock badge and reticle for selected celestial body
 *  - ObjectInfoPanel: Photometric telemetry data panel (slides in from right)
 *  - NavigationControls: Camera reset, orbit toggles, label visibility, speed & quality
 *  - CoordinateDisplay: Astronomical coordinates (RA/Dec) and system status
 */
import React from 'react'
import { HudTopBar } from './HudTopBar'
import { CelestialSearch } from './CelestialSearch'
import { ObjectInfoPanel } from './ObjectInfoPanel'
import { NavigationControls, type NavControlState } from './NavigationControls'
import { CoordinateDisplay } from './CoordinateDisplay'
import { ObjectLabel } from './ObjectLabel'
import { VisionHUD, type HandTrackingState, type HeadOrientation } from '../vision'
import type { ExplorerMode } from './types'
import type { StarObservation } from '../../types'
import './hud.css'

export interface ExplorerHUDProps {
  /** Stars available for searching and catalogue browsing */
  stars: StarObservation[]
  /** Currently selected star observation, or null */
  selectedStar: StarObservation | null
  /** Called when user selects a star from search or labels */
  onSelectStar: (star: StarObservation) => void
  /** Called when user requests light curve analysis for selected star */
  onNavigateToAnalysis: () => void
  /** Called to reset camera to wide galaxy orientation */
  onResetCamera: () => void
  /** Called to return to universe / deselect current target */
  onReturnToUniverse?: () => void
  /** Current exploration mode ('orbit' | 'flight') */
  mode: ExplorerMode
  /** Callback when exploration mode is changed */
  onModeChange: (mode: ExplorerMode) => void
  /** Navigation control toggles (orbits, labels, motion, quality) */
  navState: NavControlState
  /** Navigation control toggle handlers */
  onToggleOrbits: () => void
  /** Toggle info panel open / close */
  onToggleLabels: () => void
  onToggleMotion: () => void
  onToggleQuality: () => void
  /** Whether the detailed info panel is open */
  infoPanelOpen: boolean
  /** Toggle info panel open / close */
  onToggleInfoPanel: (open: boolean) => void
  /** Whether the hand tracking overlay is active */
  showHandTracking?: boolean
  /** Toggle hand tracking overlay */
  onToggleHandTracking?: () => void
  /** Total count of systems in the 3D scene */
  systemCount?: number
  /** Consumed tracking state from Member 1 */
  handTracking?: HandTrackingState
  /** Callback for subtle head-orientation camera adjustment */
  onHeadOrient?: (orientation: HeadOrientation) => void
  /** Callback when user pinches to select a target */
  onPinchSelect?: () => void
  /** Callback when user rotates navigation with open hand */
  onHandNavigate?: (deltaX: number, deltaY: number) => void
  /** Custom class name */
  className?: string
}

export function ExplorerHUD({
  stars,
  selectedStar,
  onSelectStar,
  onNavigateToAnalysis,
  onResetCamera,
  onReturnToUniverse,
  mode,
  onModeChange,
  navState,
  onToggleOrbits,
  onToggleLabels,
  onToggleMotion,
  onToggleQuality,
  infoPanelOpen,
  onToggleInfoPanel,
  showHandTracking,
  onToggleHandTracking,
  systemCount,
  handTracking,
  onHeadOrient,
  onPinchSelect,
  onHandNavigate,
  className = '',
}: ExplorerHUDProps) {
  const showInfoPanel =
    infoPanelOpen && selectedStar !== null && selectedStar.id !== '—'

  return (
    <div
      className={`hud-layer ${className}`}
      role="region"
      aria-label="TransitLens Universe HUD"
      id="transitlens-explorer-hud"
    >
      {/* COCKPIT VISION & GESTURE CONTROL HUD */}
      <VisionHUD
        handTracking={handTracking}
        navigationMode={mode}
        hasSelectedTarget={Boolean(selectedStar && selectedStar.id !== '—')}
        onPinchSelect={onPinchSelect}
        onHandNavigate={onHandNavigate}
        onHeadOrient={onHeadOrient}
      />
      {/* TOP-LEFT: Compact Brand Logo + Exploration Mode Selector */}
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <HudTopBar
          mode={mode}
          onModeChange={onModeChange}
          showHandTracking={showHandTracking}
          onToggleHandTracking={onToggleHandTracking}
        />
      </div>

      {/* TOP-CENTER: Floating Object Label / Reticle when a body is targeted */}
      {selectedStar && selectedStar.id !== '—' && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 15,
          }}
        >
          <ObjectLabel
            star={selectedStar}
            onInspect={() => onToggleInfoPanel(true)}
            onDeselect={onReturnToUniverse}
          />
        </div>
      )}

      {/* TOP-RIGHT: Star & Planet Catalogue Search */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <CelestialSearch
          stars={stars}
          selectedStarId={selectedStar?.id}
          onSelect={(star) => {
            onSelectStar(star)
            onToggleInfoPanel(true)
          }}
        />
      </div>

      {/* RIGHT: Floating Object Telemetry Panel (Slides smoothly) */}
      {showInfoPanel && (
        <div
          key={selectedStar?.id}
          style={{
            position: 'absolute',
            top: '50%',
            right: 16,
            transform: 'translateY(-50%)',
            maxHeight: 'calc(100% - 130px)',
            overflowY: 'auto',
            zIndex: 20,
          }}
          className="hud-scroll"
        >
          <ObjectInfoPanel
            star={selectedStar}
            onClose={() => onToggleInfoPanel(false)}
            onAnalyze={onNavigateToAnalysis}
            onReturnToUniverse={onReturnToUniverse}
          />
        </div>
      )}

      {/* BOTTOM-LEFT: Navigation & Camera Controls */}
      <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
        <NavigationControls
          state={navState}
          onResetCamera={onResetCamera}
          onToggleOrbits={onToggleOrbits}
          onToggleLabels={onToggleLabels}
          onToggleMotion={onToggleMotion}
          onToggleQuality={onToggleQuality}
        />
      </div>

      {/* BOTTOM-RIGHT: Astronomical Coordinate & Telemetry Status */}
      <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
        <CoordinateDisplay
          star={selectedStar}
          systemCount={systemCount ?? stars.length}
          explorerMode={mode}
        />
      </div>
    </div>
  )
}
