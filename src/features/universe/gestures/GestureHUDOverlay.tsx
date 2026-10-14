import React, { useState } from 'react'
import {
  Compass,
  Hand,
  Target,
  Pause,
  Camera,
  CameraOff,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Info,
  AlertCircle
} from 'lucide-react'
import type { GestureFrame } from '../../../types/gestures'
import type { GestureNavigationMode, GestureTarget } from './types'

export interface GestureHUDOverlayProps {
  mode: GestureNavigationMode
  onModeChange: (mode: GestureNavigationMode) => void
  gestureFrame: GestureFrame
  hoveredTarget: GestureTarget | null
  isWebcamActive: boolean
  onToggleWebcam: () => void
  onReturnToUniverse?: () => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
  cameraError?: string | null
}

export function GestureHUDOverlay({
  mode,
  onModeChange,
  gestureFrame,
  hoveredTarget,
  isWebcamActive,
  onToggleWebcam,
  onReturnToUniverse,
  videoRef,
  cameraError
}: GestureHUDOverlayProps) {
  const [showWebcamPiP, setShowWebcamPiP] = useState(true)
  const [showTips, setShowTips] = useState(false)

  const primaryHand = gestureFrame.primaryHand
  const isTracking = gestureFrame.isTracking && primaryHand !== null
  const isPinching = primaryHand?.isPinching || false

  // Fingertip screen position (0..1 normalized to percentage)
  const pointerX = primaryHand ? `${(primaryHand.indexTip.x * 100).toFixed(1)}%` : '50%'
  const pointerY = primaryHand ? `${(primaryHand.indexTip.y * 100).toFixed(1)}%` : '50%'

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TOP-RIGHT CONTROLS: Mode Selector & Webcam Trigger */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#070b14]/90 border border-slate-750 backdrop-blur-xl shadow-2xl font-mono text-xs">
          {/* Webcam Toggle Button */}
          <button
            onClick={onToggleWebcam}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              isWebcamActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
            }`}
            title={isWebcamActive ? 'Disable Hand Tracking Webcam' : 'Enable Hand Tracking Webcam'}
          >
            {isWebcamActive ? (
              <>
                <Camera className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Gestures Active</span>
              </>
            ) : (
              <>
                <CameraOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Hand Cam</span>
              </>
            )}
          </button>

          {/* Mode Selector Buttons */}
          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={() => onModeChange('explore')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              mode === 'explore'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Explore Mode: Open hand movement smoothly rotates camera"
          >
            <Compass className="w-3 h-3" />
            <span className="hidden sm:inline">Explore</span>
          </button>

          <button
            onClick={() => onModeChange('grab')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              mode === 'grab'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Grab Mode: Pinch and drag to manipulate universe view"
          >
            <Hand className="w-3 h-3" />
            <span className="hidden sm:inline">Grab</span>
          </button>

          <button
            onClick={() => onModeChange('select')}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              mode === 'select'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Select Mode: Point at planet and pinch to select"
          >
            <Target className="w-3 h-3" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            onClick={() => onModeChange('paused')}
            className={`px-2 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              mode === 'paused'
                ? 'bg-rose-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Paused Mode: Ignore hand gestures and freeze camera navigation"
          >
            <Pause className="w-3 h-3" />
            <span className="hidden sm:inline">Paused</span>
          </button>
        </div>

        {/* Status / Tracking Lost Banner */}
        {isWebcamActive && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#070b14]/85 border border-slate-800 backdrop-blur-md text-[11px] font-mono">
            {isTracking ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Tracking {primaryHand?.handedness} Hand ({primaryHand?.gesture})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Hand Not Detected · Motion Frozen</span>
              </span>
            )}
          </div>
        )}

        {/* Error notice if webcam failed */}
        {cameraError && (
          <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SCREEN-SPACE FINGERTIP POINTER & TARGETING RETICLE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isTracking && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out pointer-events-none"
          style={{ left: pointerX, top: pointerY }}
        >
          {/* Default fingertip dot & pinch aura */}
          <div className="relative flex items-center justify-center">
            <div
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                isPinching
                  ? 'bg-amber-400 border-white scale-125 shadow-[0_0_15px_#f59e0b]'
                  : 'bg-cyan-400/80 border-cyan-200 shadow-[0_0_10px_#22d3ee]'
              }`}
            />
            {isPinching && (
              <span className="absolute w-8 h-8 rounded-full border border-amber-300 animate-ping" />
            )}
          </div>

          {/* Hovered Planet Lock Reticle & Focus Badge */}
          {hoveredTarget && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 rounded-xl bg-[#070b14]/95 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.35)] backdrop-blur-md flex items-center gap-2 font-mono">
                <Target className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                <div>
                  <span className="text-[11px] font-bold text-white block">
                    {hoveredTarget.name}
                  </span>
                  <span className="text-[9px] text-emerald-300 block">
                    PINCH TO SELECT
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* BOTTOM-LEFT: Collapsible Webcam PiP Preview & Gesture Quick Tips */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-auto max-w-xs">
        {/* Quick Tips Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className="px-2.5 py-1 rounded-lg bg-[#070b14]/85 hover:bg-slate-800/80 border border-slate-750 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3 h-3 text-cyan-400" />
            <span>Gesture Guide</span>
          </button>

          {onReturnToUniverse && (
            <button
              onClick={onReturnToUniverse}
              className="px-2.5 py-1 rounded-lg bg-[#070b14]/85 hover:bg-slate-800/80 border border-slate-750 text-slate-300 hover:text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Return to Wide Universe View"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Wide View</span>
            </button>
          )}
        </div>

        {/* Gesture Cheat-Sheet Popover */}
        {showTips && (
          <div className="p-3 rounded-xl bg-[#070b14]/95 border border-cyan-800/60 shadow-2xl backdrop-blur-xl text-xs font-mono space-y-2 text-slate-300">
            <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hand Gesture Commands</span>
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-800 text-white font-bold">🖐️ Open Hand</span>
                <span className="text-slate-300">Rotate & tilt universe camera</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-800 text-white font-bold">🤏 Pinch & Drag</span>
                <span className="text-slate-300">Grab and manipulate view</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-800 text-white font-bold">👉 Point & Pinch</span>
                <span className="text-slate-300">Raycast planet & focus fly-in</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-800 text-white font-bold">👐 Two Hands</span>
                <span className="text-slate-300">Spread or pinch to zoom</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-800 text-white font-bold">✊ Closed Fist</span>
                <span className="text-slate-300">Hold 0.5s to return to wide view</span>
              </li>
            </ul>
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
              Mouse wheel and drag always remain active.
            </div>
          </div>
        )}

        {/* Mini Webcam PiP Display */}
        {isWebcamActive && showWebcamPiP && (
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-cyan-800/50 shadow-2xl w-44 sm:w-48 aspect-video">
            <video
              ref={videoRef as any}
              className="w-full h-full object-cover -scale-x-100"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-mono text-cyan-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live AI Tracker</span>
            </div>
            <button
              onClick={() => setShowWebcamPiP(false)}
              className="absolute top-1.5 right-1.5 p-1 rounded bg-black/70 text-slate-300 hover:text-white cursor-pointer"
              title="Minimize Camera PiP"
            >
              <Minimize2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {isWebcamActive && !showWebcamPiP && (
          <button
            onClick={() => setShowWebcamPiP(true)}
            className="px-2 py-1 rounded-lg bg-[#070b14]/85 hover:bg-slate-800/80 border border-slate-750 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3 text-cyan-400" />
            <span>Show Camera PiP</span>
          </button>
        )}
      </div>
    </div>
  )
}
