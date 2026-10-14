import { Telescope, Camera } from 'lucide-react'
import type { ExplorerMode } from './types'
import './hud.css'

interface HudTopBarProps {
  mode: ExplorerMode
  onModeChange: (mode: ExplorerMode) => void
  isCameraActive?: boolean
  isCameraLoading?: boolean
  onToggleCamera?: () => void
  className?: string
}

export function HudTopBar({
  mode,
  onModeChange,
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
      {onToggleCamera && (
        <button
          id="hud-toggle-camera"
          className={`hud-btn flex items-center gap-1.5 ${
            isCameraActive ? 'hud-btn--active border-emerald-500/60 text-emerald-300 font-semibold' : 'text-cyan-300'
          }`}
          onClick={() => {
            if (onToggleCamera) {
              onToggleCamera()
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

    </div>
  )
}
