/**
 * NavigationControls – bottom-left cluster of camera action buttons.
 *
 * Provides:
 *  - Reset camera to default position
 *  - Toggle orbit lines
 *  - Toggle labels
 *  - Toggle starfield motion
 *  - Quality / performance preset
 */
import { RotateCcw, Layers, Eye, EyeOff, Play, Pause, Zap } from 'lucide-react'
import './hud.css'

export interface NavControlState {
  showOrbits: boolean
  showLabels: boolean
  enableMotion: boolean
  quality: 'high' | 'low'
}

interface NavigationControlsProps {
  state: NavControlState
  onResetCamera: () => void
  onToggleOrbits: () => void
  onToggleLabels: () => void
  onToggleMotion: () => void
  onToggleQuality: () => void
  className?: string
}

interface IconBtnProps {
  id: string
  icon: React.ReactNode
  label: string
  active?: boolean
  variant?: 'default' | 'violet' | 'ghost'
  onClick: () => void
}

function IconBtn({ id, icon, label, active, variant = 'ghost', onClick }: IconBtnProps) {
  return (
    <button
      id={id}
      className={`hud-btn hud-btn--${variant} ${active ? 'hud-btn--active' : ''}`}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      style={{ padding: '0.4rem', gap: 0 }}
    >
      {icon}
    </button>
  )
}

export function NavigationControls({
  state,
  onResetCamera,
  onToggleOrbits,
  onToggleLabels,
  onToggleMotion,
  onToggleQuality,
  className = '',
}: NavigationControlsProps) {
  return (
    <div
      id="hud-nav-controls"
      className={`hud-panel hud-interactive hud-enter-up ${className}`}
      style={{ padding: '0.55rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
    >
      {/* Reset */}
      <IconBtn
        id="hud-btn-reset"
        icon={<RotateCcw size={13} />}
        label="Reset camera to default position"
        onClick={onResetCamera}
      />

      <div style={{ width: 1, height: 20, background: 'rgba(89,214,226,0.12)' }} />

      {/* Orbit lines */}
      <IconBtn
        id="hud-btn-orbits"
        icon={<Layers size={13} />}
        label={state.showOrbits ? 'Hide orbit lines' : 'Show orbit lines'}
        active={state.showOrbits}
        onClick={onToggleOrbits}
      />

      {/* Labels */}
      <IconBtn
        id="hud-btn-labels"
        icon={state.showLabels ? <Eye size={13} /> : <EyeOff size={13} />}
        label={state.showLabels ? 'Hide object labels' : 'Show object labels'}
        active={state.showLabels}
        variant="violet"
        onClick={onToggleLabels}
      />

      {/* Motion */}
      <IconBtn
        id="hud-btn-motion"
        icon={state.enableMotion ? <Pause size={13} /> : <Play size={13} />}
        label={state.enableMotion ? 'Pause orbital motion' : 'Resume orbital motion'}
        active={state.enableMotion}
        onClick={onToggleMotion}
      />

      <div style={{ width: 1, height: 20, background: 'rgba(89,214,226,0.12)' }} />

      {/* Quality */}
      <button
        id="hud-btn-quality"
        className={`hud-btn ${state.quality === 'low' ? 'hud-btn--amber' : ''}`}
        onClick={onToggleQuality}
        title={state.quality === 'high' ? 'Switch to Eco mode (better FPS on laptops)' : 'Switch to High Quality mode'}
        style={{ gap: '0.3rem', padding: '0.35rem 0.55rem' }}
      >
        <Zap size={11} />
        <span style={{ fontSize: '0.62rem' }}>{state.quality === 'high' ? 'HQ' : 'ECO'}</span>
      </button>
    </div>
  )
}
