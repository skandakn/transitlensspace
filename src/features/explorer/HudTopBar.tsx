import { Telescope, Hand, Camera, Sliders, Compass, Target, Pause } from 'lucide-react'
import type { ExplorerMode } from './types'
import type { GestureNavigationMode } from '../universe/gestures/types'
import './hud.css'

interface HudTopBarProps {
  mode: ExplorerMode
  onModeChange: (mode: ExplorerMode) => void
  showHandTracking?: boolean
  onToggleHandTracking?: () => void
  gestureMode?: GestureNavigationMode
  onGestureModeChange?: (mode: GestureNavigationMode) => void
  onOpenCalibration?: () => void
  isCameraActive?: boolean
  isCameraLoading?: boolean
  onToggleCamera?: () => void
  className?: string
}

export function HudTopBar({
  mode,
  onModeChange,
  showHandTracking,
  onToggleHandTracking,
  gestureMode = 'explore',
  onGestureModeChange,
  onOpenCalibration,
  isCameraActive = false,
  isCameraLoading = false,
  onToggleCamera,
  className = '',
}: HudTopBarProps) {
  return (
    <div
      className={`hud-panel hud-interactive hud-enter-down flex items-center gap-3 px-4 py-2.5 ${className}`}
      style={{ position: 'relative' }}
      id="hud-top-bar"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 select-none">
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 38%, #59d6e2 0%, #0c4a6e 60%, #020d1c 100%)',
            boxShadow: '0 0 12px rgba(89,214,226,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Telescope size={14} color="#e5edf6" strokeWidth={1.8} />
        </div>
        <div className="flex flex-col leading-none">
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #59d6e2, #aaa0ed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TransitLens
          </span>
          <span
            style={{
              fontSize: '0.55rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(138,154,174,0.7)',
              marginTop: 1,
            }}
          >
            Universe Explorer
          </span>
        </div>
      </div>

      <div className="hud-divider" style={{ width: 1, height: 28, margin: '0 0.25rem', background: 'rgba(89,214,226,0.15)' }} />

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button
          id="hud-mode-orbit"
          className={`hud-btn ${mode === 'orbit' ? 'hud-btn--active' : ''}`}
          onClick={() => onModeChange('orbit')}
          title="Orbit mode – camera orbits the scene centre"
          aria-pressed={mode === 'orbit'}
        >
          Orbit
        </button>
        <button
          id="hud-mode-free"
          className={`hud-btn ${mode === 'free' ? 'hud-btn--active' : ''}`}
          onClick={() => onModeChange('free')}
          title="Free flight – WASD + Q/E to fly through space"
          aria-pressed={mode === 'free'}
        >
          Free&nbsp;Flight
        </button>
      </div>

      {/* Primary Webcam Camera Toggle */}
      {(onToggleCamera || onToggleHandTracking) && (
        <button
          id="hud-toggle-camera"
          className={`hud-btn flex items-center gap-1.5 ${
            isCameraActive ? 'hud-btn--active border-emerald-500/60 text-emerald-300 font-semibold' : 'text-cyan-300'
          }`}
          onClick={() => {
            if (onToggleCamera) {
              onToggleCamera()
            } else if (onToggleHandTracking) {
              onToggleHandTracking()
            }
          }}
          title={isCameraActive ? 'Turn Off Webcam Camera' : 'Turn On Webcam Camera & Gesture Tracking'}
          aria-pressed={isCameraActive}
        >
          <Camera size={13} className={isCameraActive ? 'text-emerald-400' : 'text-cyan-400'} />
          <span>{isCameraActive ? 'Camera On' : isCameraLoading ? 'Starting...' : 'Enable Camera'}</span>
          {isCameraActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>
      )}

      {/* Hand Gesture Tracking Toggle */}
      {onToggleHandTracking && (
        <button
          id="hud-toggle-hand-tracking"
          className={`hud-btn flex items-center gap-1.5 ${showHandTracking ? 'hud-btn--active' : ''}`}
          onClick={onToggleHandTracking}
          title="Toggle Hand Skeleton HUD Window (Member 1)"
          aria-pressed={showHandTracking}
        >
          <Hand size={13} />
          <span>Hand Skeleton</span>
        </button>
      )}

      {/* Gesture Modes & Calibration (Visible when hand tracking is toggled on or camera active) */}
      {(showHandTracking || isCameraActive) && onGestureModeChange && (
        <div className="flex items-center gap-1 pl-1 border-l border-cyan-800/40">
          <button
            onClick={() => onGestureModeChange('explore')}
            className={`hud-btn px-2 py-1 text-[11px] flex items-center gap-1 ${
              gestureMode === 'explore' ? 'hud-btn--active text-cyan-300 font-bold' : 'text-slate-400'
            }`}
            title="Explore Mode: Open hand rotates and tilts camera"
          >
            <Compass size={12} />
            <span className="hidden 2xl:inline">Explore</span>
          </button>
          <button
            onClick={() => onGestureModeChange('grab')}
            className={`hud-btn px-2 py-1 text-[11px] flex items-center gap-1 ${
              gestureMode === 'grab' ? 'hud-btn--active text-amber-300 font-bold' : 'text-slate-400'
            }`}
            title="Grab Mode: Pinch and drag to rotate view"
          >
            <Hand size={12} />
            <span className="hidden 2xl:inline">Grab</span>
          </button>
          <button
            onClick={() => onGestureModeChange('select')}
            className={`hud-btn px-2 py-1 text-[11px] flex items-center gap-1 ${
              gestureMode === 'select' ? 'hud-btn--active text-emerald-300 font-bold' : 'text-slate-400'
            }`}
            title="Select Mode: Point at planet and pinch to lock & inspect"
          >
            <Target size={12} />
            <span className="hidden 2xl:inline">Select</span>
          </button>
          <button
            onClick={() => onGestureModeChange('paused')}
            className={`hud-btn px-2 py-1 text-[11px] flex items-center gap-1 ${
              gestureMode === 'paused' ? 'hud-btn--active text-rose-300 font-bold' : 'text-slate-400'
            }`}
            title="Pause Gesture Inputs (Spacebar)"
          >
            <Pause size={12} />
            <span className="hidden 2xl:inline">Paused</span>
          </button>

          {onOpenCalibration && (
            <button
              onClick={onOpenCalibration}
              className="hud-btn px-2 py-1 text-[11px] flex items-center gap-1 text-cyan-400 hover:text-white"
              title="Open Gesture Calibration & Kinematics Settings (Key: C)"
            >
              <Sliders size={12} />
              <span className="hidden 2xl:inline">Calibrate</span>
            </button>
          )}
        </div>
      )}

      {/* Live status dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.4rem' }}>
        <span className="hud-dot hud-dot--cyan" />
        <span className="hud-mono" style={{ color: 'rgba(89,214,226,0.55)', fontSize: '0.62rem' }}>
          LIVE
        </span>
      </div>
    </div>
  )
}
