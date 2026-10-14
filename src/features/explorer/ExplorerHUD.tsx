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
import type { ExplorerMode } from './types'
import type { StarObservation } from '../../types'
import type { GestureNavigationMode, GestureTarget } from '../universe/gestures/types'
import type { GestureFrame } from '../../types/gestures'
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
  /** Gesture navigation mode */
  gestureMode?: GestureNavigationMode
  /** Callback when gesture mode changes */
  onGestureModeChange?: (mode: GestureNavigationMode) => void
  /** Callback to open gesture calibration modal */
  onOpenCalibration?: () => void
  /** True when webcam is actively running */
  isCameraActive?: boolean
  /** Real-time gesture frame data */
  gestureFrame?: GestureFrame
  /** Celestial target currently under fingertip raycast */
  hoveredGestureTarget?: GestureTarget | null
  /** Total count of systems in the 3D scene */
  systemCount?: number
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
  gestureMode,
  onGestureModeChange,
  onOpenCalibration,
  isCameraActive,
  gestureFrame,
  hoveredGestureTarget,
  systemCount,
  className = '',
}: ExplorerHUDProps) {
  const showInfoPanel =
    infoPanelOpen && selectedStar !== null && selectedStar.id !== '—'

  const primaryHand = gestureFrame?.primaryHand
  const isHandTrackingActive = Boolean(gestureFrame?.isTracking && primaryHand)
  const pointerX = primaryHand ? `${(primaryHand.indexTip.x * 100).toFixed(1)}%` : '50%'
  const pointerY = primaryHand ? `${(primaryHand.indexTip.y * 100).toFixed(1)}%` : '50%'
  const isPinching = primaryHand?.isPinching ?? false

  return (
    <div
      className={`hud-layer ${className}`}
      role="region"
      aria-label="TransitLens Universe HUD"
      id="transitlens-explorer-hud"
    >
      {/* SCREEN-SPACE FINGERTIP POINTER & CELESTIAL TARGET LOCK RETICLE */}
      {isHandTrackingActive && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out pointer-events-none z-30 select-none"
          style={{ left: pointerX, top: pointerY }}
        >
          {/* Default fingertip dot & pinch aura */}
          <div className="relative flex items-center justify-center">
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                isPinching
                  ? 'bg-amber-400 border-white scale-125 shadow-[0_0_15px_#f59e0b]'
                  : 'bg-cyan-400/80 border-cyan-200 shadow-[0_0_10px_#22d3ee]'
              }`}
            />
            {isPinching && (
              <span className="absolute w-8 h-8 rounded-full border border-amber-300 animate-ping" />
            )}
          </div>

          {/* Hovered Target Lock Reticle & Focus Badge */}
          {hoveredGestureTarget && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 rounded-xl bg-[#070b14]/95 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.35)] backdrop-blur-md flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-white block">
                  {hoveredGestureTarget.name}
                </span>
                <span className="text-[9px] text-emerald-300 uppercase tracking-wider block font-bold">
                  {isPinching ? 'Selected' : 'Pinch to Select'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOP-LEFT: Compact Brand Logo + Exploration Mode Selector + Gesture Bar */}
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <HudTopBar
          mode={mode}
          onModeChange={onModeChange}
          showHandTracking={showHandTracking}
          onToggleHandTracking={onToggleHandTracking}
          gestureMode={gestureMode}
          onGestureModeChange={onGestureModeChange}
          onOpenCalibration={onOpenCalibration}
          isCameraActive={isCameraActive}
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
