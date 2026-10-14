/**
 * ObjectInfoPanel – floating glassmorphism panel that slides in from the right
 * when a celestial object is selected, showing rich photometric data.
 *
 * Controlled by the parent; parent passes a nullable StarObservation.
 * Panel mounts/unmounts with a CSS slide animation.
 */
import { X, Zap, Thermometer, Globe, Activity, BarChart3, ExternalLink, Compass } from 'lucide-react'
import type { StarObservation } from '../../types'
import './hud.css'

interface ObjectInfoPanelProps {
  star: StarObservation | null
  onClose: () => void
  onAnalyze: () => void
  onReturnToUniverse?: () => void
  className?: string
}

function InfoRow({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="hud-info-row">
      <span className="hud-info-label">{label}</span>
      <span className="hud-info-value">
        {value}
        {unit && (
          <span style={{ color: 'rgba(89,214,226,0.45)', marginLeft: '0.2rem', fontSize: '0.62rem' }}>{unit}</span>
        )}
      </span>
    </div>
  )
}

function spectralColor(type?: string): string {
  if (!type) return '#59d6e2'
  const letter = type[0].toUpperCase()
  const palette: Record<string, string> = {
    O: '#93c5fd', B: '#bfdbfe', A: '#e0f2fe', F: '#fef9c3',
    G: '#fef08a', K: '#fed7aa', M: '#fca5a5',
  }
  return palette[letter] ?? '#59d6e2'
}

function missionVariant(mission: string): string {
  switch (mission) {
    case 'TESS': return 'hud-badge--cyan'
    case 'Kepler':
    case 'K2': return 'hud-badge--violet'
    default: return 'hud-badge--amber'
  }
}

export function ObjectInfoPanel({
  star,
  onClose,
  onAnalyze,
  onReturnToUniverse,
  className = '',
}: ObjectInfoPanelProps) {
  if (!star || star.id === '—') return null

  const sColor = spectralColor(star.spectralType)

  return (
    <div
      id="hud-info-panel"
      className={`hud-panel hud-interactive hud-enter-left ${className}`}
      style={{
        width: 280,
        padding: '1rem',
        position: 'relative',
      }}
      role="complementary"
      aria-label={`Object information: ${star.name}`}
    >
      {/* Close button */}
      <button
        id="hud-info-close"
        className="hud-btn hud-btn--ghost"
        onClick={onClose}
        aria-label="Close information panel"
        style={{ position: 'absolute', top: '0.65rem', right: '0.65rem', padding: '0.3rem' }}
      >
        <X size={12} />
      </button>

      {/* Star colour dot + name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, white, ${sColor} 35%, ${sColor}55 70%, transparent)`,
            boxShadow: `0 0 18px ${sColor}55, 0 0 6px ${sColor}99`,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0, paddingRight: '1.4rem' }}>
          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#e5edf6',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {star.name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
            <span className={`hud-badge ${missionVariant(star.mission)}`}>{star.mission}</span>
            {star.spectralType && (
              <span
                className="hud-badge"
                style={{
                  background: `${sColor}14`,
                  color: sColor,
                  border: `1px solid ${sColor}30`,
                }}
              >
                {star.spectralType}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="hud-divider" />

      {/* Photometric data rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <InfoRow label="ID" value={star.id} />
        {star.catalogId && <InfoRow label="Catalog" value={star.catalogId} />}
        <InfoRow
          label="RA / Dec"
          value={`${star.ra.toFixed(4)}° / ${star.dec.toFixed(4)}°`}
        />
        {star.distanceParsecs != null && (
          <InfoRow
            label="Distance"
            value={star.distanceParsecs.toFixed(1)}
            unit="pc"
          />
        )}
        {star.temperature > 0 && (
          <InfoRow
            label="Temperature"
            value={star.temperature.toLocaleString()}
            unit="K"
          />
        )}
        {star.stellarRadius > 0 && (
          <InfoRow
            label="Radius"
            value={star.stellarRadius.toFixed(2)}
            unit="R☉"
          />
        )}
        {star.stellarMass > 0 && (
          <InfoRow
            label="Mass"
            value={star.stellarMass.toFixed(2)}
            unit="M☉"
          />
        )}
        {star.magnitude !== 0 && (
          <InfoRow label="Magnitude" value={star.magnitude.toFixed(2)} />
        )}
        {star.numPoints > 0 && (
          <InfoRow
            label="Data Points"
            value={star.numPoints.toLocaleString()}
          />
        )}
        {star.sectorOrQuarter && (
          <InfoRow label="Sector / Quarter" value={star.sectorOrQuarter} />
        )}
      </div>

      {/* Description */}
      {star.description && (
        <>
          <div className="hud-divider" />
          <p
            style={{
              fontSize: '0.7rem',
              color: 'rgba(138,154,174,0.75)',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {star.description}
          </p>
        </>
      )}

      <div className="hud-divider" />

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          id="hud-info-analyze"
          className="hud-btn hud-btn--violet"
          onClick={onAnalyze}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Activity size={11} />
          Light Curve
        </button>
        <button
          id="hud-info-chart"
          className="hud-btn"
          onClick={onAnalyze}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <BarChart3 size={11} />
          Analyze
        </button>
      </div>

      {onReturnToUniverse && (
        <button
          id="hud-info-return-universe"
          className="hud-btn hud-btn--ghost"
          onClick={onReturnToUniverse}
          style={{
            width: '100%',
            marginTop: '0.45rem',
            justifyContent: 'center',
            fontSize: '0.68rem',
            color: 'rgba(89,214,226,0.85)',
            border: '1px solid rgba(89,214,226,0.2)',
          }}
          title="Return to wide universe view"
        >
          <Compass size={11} />
          Return to Universe
        </button>
      )}
    </div>
  )
}
