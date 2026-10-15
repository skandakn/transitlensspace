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
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HudTopBar } from './HudTopBar'
import { CelestialSearch } from './CelestialSearch'
import { ObjectInfoPanel } from './ObjectInfoPanel'
import { NavigationControls, type NavControlState } from './NavigationControls'
import { CoordinateDisplay } from './CoordinateDisplay'
import { ObjectLabel } from './ObjectLabel'
import { NavigationHint } from './NavigationHint'
import { VisionHUD, type HandTrackingState, type HeadOrientation } from '../vision'
import type { ExplorerMode } from './types'
import type { StarObservation } from '../../types'
import type { GestureTarget } from '../universe/gestures/types'
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
  /** Toggle info panel open / close */
  onToggleLabels: () => void
  onToggleMotion: () => void
  onToggleQuality: () => void
  /** Whether the detailed info panel is open */
  infoPanelOpen: boolean
  /** Toggle info panel open / close */
  onToggleInfoPanel: (open: boolean) => void
  /** True when webcam is actively running */
  isCameraActive?: boolean
  /** Real-time gesture frame data */
  gestureFrame?: GestureFrame
  /** Celestial target currently under fingertip raycast */
  hoveredGestureTarget?: GestureTarget | null
  /** Total count of systems in the 3D scene */
  systemCount?: number
  /** Consumed tracking state from Member 1 */
  handTracking?: HandTrackingState
  /** Callback for subtle head-orientation camera adjustment */
  onHeadOrient?: (orientation: HeadOrientation) => void
  /** Shared camera loading state */
  isCameraLoading?: boolean
  /** Shared camera error message */
  cameraError?: string | null
  /** Shared camera MediaStream */
  cameraStream?: MediaStream | null
  /** Shared video element ref */
  videoRef?: React.RefObject<HTMLVideoElement | null>
  /** Callback to start or enable camera */
  onEnableCamera?: () => Promise<void> | void
  /** Callback to stop or toggle camera */
  onToggleCamera?: () => Promise<void> | void
  /** Current star index (0-based) in the star list */
  currentStarIndex?: number
  /** Navigate to previous star */
  onPrevStar?: () => void
  /** Navigate to next star */
  onNextStar?: () => void
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
  isCameraActive,
  isCameraLoading,
  cameraError,
  cameraStream,
  videoRef,
  onEnableCamera,
  onToggleCamera,
  gestureFrame,
  hoveredGestureTarget,
  systemCount,
  handTracking,
  onHeadOrient,
  currentStarIndex = 0,
  onPrevStar,
  onNextStar,
  className = '',
}: ExplorerHUDProps) {
  const [showHint, setShowHint] = useState(true)
  const showInfoPanel =
    infoPanelOpen && selectedStar !== null && selectedStar.id !== '—'

  const primaryHand = gestureFrame?.primaryHand
  const isHandTrackingActive = Boolean(gestureFrame?.isTracking && primaryHand)
  // Invert X coordinate for mirrored screen-space overlay pointer
  const pointerX = primaryHand ? `${((1 - primaryHand.indexTip.x) * 100).toFixed(1)}%` : '50%'
  const pointerY = primaryHand ? `${(primaryHand.indexTip.y * 100).toFixed(1)}%` : '50%'
  const isPinching = primaryHand?.isPinching ?? false

  const currentKey = selectedStar ? (selectedStar.name || selectedStar.id).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const currentIndex = selectedStar
    ? stars.findIndex((s) => {
        const sKey = (s.name || s.id).toLowerCase().replace(/[^a-z0-9]/g, '')
        return s.id === selectedStar.id || sKey === currentKey || sKey.includes(currentKey) || currentKey.includes(sKey)
      })
    : -1

  const handlePrevStar = () => {
    if (stars.length === 0) return
    const safeIdx = currentIndex >= 0 ? currentIndex : 0
    const idx = (safeIdx - 1 + stars.length) % stars.length
    onSelectStar(stars[idx])
    onToggleInfoPanel(true)
  }
  const handleNextStar = () => {
    if (stars.length === 0) return
    const safeIdx = currentIndex >= 0 ? currentIndex : 0
    const idx = (safeIdx + 1) % stars.length
    onSelectStar(stars[idx])
    onToggleInfoPanel(true)
  }

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

      {/* COCKPIT VISION & GESTURE CONTROL HUD */}
      {handTracking && (
        <VisionHUD
          handTracking={handTracking}
          hasSelectedTarget={Boolean(selectedStar && selectedStar.id !== '—')}
          onHeadOrient={onHeadOrient}
          isCameraActive={isCameraActive}
          isCameraLoading={isCameraLoading}
          cameraError={cameraError}
          stream={cameraStream}
          videoRef={videoRef}
          onEnableCamera={onEnableCamera}
          onToggleCamera={onToggleCamera}
        />
      )}

      {/* TOP-LEFT: Compact Brand Logo + Exploration Mode Selector + Gesture Bar */}
      <div className="hud-topbar-slot">
        <HudTopBar
          mode={mode}
          onModeChange={onModeChange}
          isCameraActive={isCameraActive}
          isCameraLoading={isCameraLoading}
          onToggleCamera={onToggleCamera}
          className="hud-topbar--responsive"
        />
      </div>

      {/* TOP-CENTER: Floating Object Label / Reticle when a body is targeted */}
      {selectedStar && selectedStar.id !== '—' && (
        <div className="hud-object-label-slot">
          <ObjectLabel
            star={selectedStar}
            onInspect={() => onToggleInfoPanel(true)}
            onDeselect={onReturnToUniverse}
            onPrev={handlePrevStar}
            onNext={handleNextStar}
          />
        </div>
      )}

      {/* TOP-RIGHT: Star & Planet Catalogue Search */}
      <div className="hud-search-slot">
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

      {/* BOTTOM-CENTER: System Quick-Switcher Bar with Prev/Next + Count */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}
        className="hud-interactive pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl bg-[#070b14]/90 border border-slate-800 backdrop-blur-md shadow-2xl max-w-[calc(100vw-340px)]"
        role="toolbar"
        aria-label="Celestial Systems Quick Navigation"
      >
        {/* Prev arrow */}
        {onPrevStar && (
          <button
            onClick={onPrevStar}
            className="p-1.5 rounded-xl bg-[#090e1a]/85 border border-slate-800 hover:border-cyan-500/60 hover:text-white text-slate-400 transition-all shrink-0 cursor-pointer"
            title="Previous star system (←)"
            aria-label="Previous star system"
          >
            <ChevronLeft size={13} />
          </button>
        )}

        <span className="text-[9px] font-mono text-cyan-300 uppercase tracking-wider px-1 shrink-0 hidden md:inline font-bold">
          Systems:
        </span>

        {/* Scrollable star pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] hud-scroll">
          {stars
            .filter((s) => s.id !== '—' && s.id !== 'TEST-SPARSE')
            .map((star) => {
              const starKey = (star.name || star.id).toLowerCase().replace(/[^a-z0-9]/g, '')
              const selKey = selectedStar ? (selectedStar.name || selectedStar.id).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
              const isSelected = selectedStar?.id === star.id || (selKey && starKey === selKey)
              const displayName = star.name.replace(/\s*\(.*\)/, '').trim()

              return (
                <button
                  key={star.id}
                  onClick={() => {
                    onSelectStar(star)
                    onToggleInfoPanel(true)
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.55)] scale-105'
                      : 'bg-[#090e1a]/85 text-slate-300 border-slate-800 hover:border-cyan-500/60 hover:text-white'
                  }`}
                  title={`Focus ${star.name}`}
                >
                  {displayName}
                </button>
              )
            })}
        </div>

        {/* Count indicator */}
        <span className="text-[9px] font-mono text-slate-500 px-1 shrink-0 hidden sm:inline tabular-nums">
          {currentStarIndex + 1}/{stars.filter(s => s.id !== '—' && s.id !== 'TEST-SPARSE').length}
        </span>

        {/* Next arrow */}
        {onNextStar && (
          <button
            onClick={onNextStar}
            className="p-1.5 rounded-xl bg-[#090e1a]/85 border border-slate-800 hover:border-cyan-500/60 hover:text-white text-slate-400 transition-all shrink-0 cursor-pointer"
            title="Next star system (→)"
            aria-label="Next star system"
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* BOTTOM-RIGHT: Astronomical Coordinate & Telemetry Status */}
      <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
        <CoordinateDisplay
          star={selectedStar}
          systemCount={systemCount ?? stars.length}
          explorerMode={mode}
        />
      </div>

      {/* BOTTOM-LEFT + NAVIGATION HINT: Contextual guide overlay */}
      {showHint && (
        <div style={{ position: 'absolute', bottom: 80, left: 16, zIndex: 25 }}>
          <NavigationHint
            isCameraActive={isCameraActive}
            onDismiss={() => setShowHint(false)}
          />
        </div>
      )}
    </div>
  )
}
