/**
 * CoordinateDisplay – bottom-right HUD telemetry strip.
 *
 * Shows RA/Dec of the currently focused object plus a live system count and
 * keyboard shortcut reminder for power-users.
 */
import type { StarObservation } from '../../types'
import './hud.css'

interface CoordinateDisplayProps {
  star: StarObservation | null
  systemCount: number
  explorerMode: 'orbit' | 'free'
  className?: string
}

function fmt(n: number, decimals = 4) {
  return n.toFixed(decimals)
}

export function CoordinateDisplay({ star, systemCount, explorerMode, className = '' }: CoordinateDisplayProps) {
  return (
    <div
      id="hud-coords"
      className={`hud-panel hud-interactive hud-enter-up ${className}`}
      style={{ padding: '0.6rem 0.85rem' }}
    >
      {star && star.id !== '—' ? (
        <div className="hud-coords">
          <span>
            <em>RA</em>
            {fmt(star.ra)}°
          </span>
          <span>
            <em>Dec</em>
            {fmt(star.dec)}°
          </span>
          {star.distanceParsecs != null && (
            <span>
              <em>Dist</em>
              {fmt(star.distanceParsecs, 1)} pc
            </span>
          )}
        </div>
      ) : (
        <div className="hud-coords">
          <span style={{ color: 'rgba(89,214,226,0.35)' }}>No target selected</span>
        </div>
      )}

      <div
        style={{
          marginTop: '0.4rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <span
          className="hud-badge hud-badge--cyan"
          style={{ fontSize: '0.58rem' }}
        >
          {systemCount} systems
        </span>
        <span
          className="hud-mono"
          style={{ fontSize: '0.58rem', color: 'rgba(89,214,226,0.35)' }}
        >
          {explorerMode === 'free' ? 'WASD · Q/E · Drag' : 'Drag · Scroll'}
        </span>
      </div>
    </div>
  )
}
