import {
  Hand,
  Crosshair,
  Compass,
  Radio,
  Sparkles,
  HelpCircle,
  Eye,
} from 'lucide-react'
import type { FaceTrackingState, HandTrackingState } from './types'

export interface GestureHUDProps {
  handState?: HandTrackingState
  faceState?: FaceTrackingState
  navigationMode?: string
  isCameraActive: boolean
  onOpenGuide: () => void
  className?: string
}

function getGestureHint(
  isCameraActive: boolean,
  isHandDetected: boolean,
  gesture: string,
  isPinching: boolean
): string {
  if (!isCameraActive) {
    return 'Click "Enable Camera" or press [C] to engage hand gesture controls.'
  }

  if (!isHandDetected) {
    return 'Raise hand in front of camera with open palm to navigate the universe.'
  }

  if (isPinching || gesture === 'pinch') {
    return 'Pinch locked onto celestial target! Release pinch to confirm selection.'
  }

  switch (gesture) {
    case 'open_palm':
      return 'Open palm: Sweep left/right to browse systems · Close hands to zoom in · Expand to zoom out.'
    case 'pointing':
      return 'Aim fingertip at any star or planet · Pinch thumb & index to lock on.'
    case 'fist':
      return 'Fist held: Navigation paused. Hold fist 500ms to return to wide galaxy view.'
    default:
      return 'Close hands together to zoom in · Expand hands apart to zoom out · Pinch to select.'
  }
}

export function GestureHUD({
  handState,
  faceState,
  navigationMode = 'orbit',
  isCameraActive,
  onOpenGuide,
  className = '',
}: GestureHUDProps) {
  const isHandDetected = Boolean(handState?.isHandDetected)
  const gesture = handState?.detectedGesture ?? 'none'
  const isPinching = Boolean(handState?.isPinching)
  const handPos = handState?.handPosition

  const hint = getGestureHint(isCameraActive, isHandDetected, gesture, isPinching)

  return (
    <>
      {/* ── FLOATING OPTICAL HAND RETICLE (tracks hand in real time) ── */}
      {isCameraActive && isHandDetected && handPos && (
        <div
          className="fixed pointer-events-none z-40 transition-transform duration-75 ease-out"
          style={{
            left: `${handPos.x * 100}%`,
            top: `${handPos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          aria-hidden="true"
        >
          <div className="relative flex items-center justify-center">
            {/* Outer Reticle Ring */}
            <div
              className={`rounded-full border transition-all duration-150 ${
                isPinching
                  ? 'w-10 h-10 border-amber-400 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-ping-slow'
                  : 'w-8 h-8 border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
              }`}
            />

            {/* Center Aiming Dot */}
            <div
              className={`absolute w-1.5 h-1.5 rounded-full ${
                isPinching ? 'bg-amber-300' : 'bg-cyan-300'
              }`}
            />

            {/* Gesture Badge Next to Hand */}
            <div
              className={`absolute left-7 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap backdrop-blur-md uppercase border ${
                isPinching
                  ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                  : 'bg-[#070b14]/90 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {isPinching ? 'LOCK PINCH' : gesture.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}

      {/* ── COCKPIT TELEMETRY HUD BAR (Top-Center / Flight Bar) ── */}
      <div
        className={`pointer-events-auto z-20 flex flex-col items-center gap-1.5 ${className}`}
        role="status"
        aria-label="Gesture Tracking Telemetry"
      >
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#070b14]/85 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.12)] font-mono text-xs text-slate-200">
          {/* Tracking Engine Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#090e1a] border border-slate-800">
            <Radio
              className={`w-3.5 h-3.5 ${
                isCameraActive
                  ? isHandDetected
                    ? 'text-cyan-400 animate-pulse'
                    : 'text-amber-400'
                  : 'text-slate-500'
              }`}
            />
            <span className="text-[11px] text-slate-300">
              {isCameraActive
                ? isHandDetected
                  ? 'TRACKING LOCKED'
                  : 'SEARCHING HAND'
                : 'VISION STANDBY'}
            </span>
          </div>

          {/* Detected Gesture Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-colors ${
              isPinching
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : gesture === 'open_palm'
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : gesture === 'pointing'
                ? 'bg-violet-950/70 border-violet-500/50 text-violet-300'
                : 'bg-[#090e1a] border-slate-800 text-slate-400'
            }`}
          >
            {isPinching ? (
              <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            ) : (
              <Hand className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px] font-bold uppercase">
              {isPinching ? 'PINCH SELECT' : gesture.replace('_', ' ')}
            </span>
          </div>

          {/* Member 2 Navigation Mode Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-950/50 border border-violet-500/40 text-violet-300">
            <Compass className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] uppercase font-semibold">
              NAV: {navigationMode}
            </span>
          </div>

          {/* Face Tracking Head Orientation Telemetry */}
          {faceState?.isFaceDetected && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px]">
                HEAD {faceState.headOrientation.yaw > 0 ? '+' : ''}
                {faceState.headOrientation.yaw.toFixed(0)}°
              </span>
            </div>
          )}

          {/* Mini Hand Radar Pip */}
          {isHandDetected && handPos && (
            <div
              className="relative w-6 h-6 rounded-lg bg-slate-950 border border-cyan-500/30 overflow-hidden flex items-center justify-center"
              title={`Hand coordinates: (${(handPos.x * 100).toFixed(0)}%, ${(
                handPos.y * 100
              ).toFixed(0)}%)`}
            >
              <div className="absolute inset-0 border border-cyan-500/10" />
              <div
                className={`absolute w-1.5 h-1.5 rounded-full ${
                  isPinching ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{
                  left: `${handPos.x * 100}%`,
                  top: `${handPos.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          )}

          {/* Guide Quick-Trigger */}
          <button
            onClick={onOpenGuide}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cockpit Vision flight guide & gestures (?)"
            aria-label="Open gesture guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Contextual Next-Action Hint */}
        <div className="px-3 py-1 rounded-full bg-[#070b14]/90 border border-slate-800/80 text-[11px] font-mono text-cyan-200/90 flex items-center gap-1.5 shadow-sm max-w-md text-center">
          <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />
          <span className="truncate">{hint}</span>
        </div>
      </div>
    </>
  )
}
