/**
 * ObjectLabel – elegant floating HUD reticle and label overlay
 * that appears near or for the currently selected or tracked celestial body.
 *
 * Implements cinematic space-exploration styling with reticle brackets,
 * spectral badges, distance telemetry, and target lock controls.
 */
import React from 'react'
import { Crosshair, ChevronRight, X } from 'lucide-react'
import type { StarObservation } from '../../types'
import './hud.css'

export interface ObjectLabelProps {
  /** The selected or focused celestial body */
  star: StarObservation | null
  /** Optional callback to open the deep info panel or inspect details */
  onInspect?: () => void
  /** Optional callback to deselect or return to wide universe view */
  onDeselect?: () => void
  /** Additional custom class */
  className?: string
}

export function ObjectLabel({ star, onInspect, onDeselect, className = '' }: ObjectLabelProps) {
  if (!star || star.id === '—') return null

  const spectralColor = (type?: string) => {
    if (!type) return '#59d6e2'
    const letter = type[0].toUpperCase()
    const palette: Record<string, string> = {
      O: '#93c5fd', B: '#bfdbfe', A: '#e0f2fe', F: '#fef9c3',
      G: '#fef08a', K: '#fed7aa', M: '#fca5a5',
    }
    return palette[letter] ?? '#59d6e2'
  }

  const sColor = spectralColor(star.spectralType)

  return (
    <div
      className={`hud-object-label hud-interactive hud-enter-scale ${className}`}
      id="hud-object-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.45rem 0.8rem',
        borderRadius: '10px',
        background: 'rgba(7, 14, 28, 0.82)',
        border: '1px solid rgba(89, 214, 226, 0.35)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(89, 214, 226, 0.15)',
        position: 'relative',
      }}
      role="status"
      aria-label={`Target locked: ${star.name}`}
    >
      {/* Target Reticle Icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'rgba(89, 214, 226, 0.1)',
          border: '1px solid rgba(89, 214, 226, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Crosshair size={14} color="#59d6e2" className="hud-pulse" />
      </div>

      {/* Primary Target Info */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#e5edf6',
              letterSpacing: '0.02em',
            }}
          >
            {star.name}
          </span>

          {star.spectralType && (
            <span
              className="hud-mono"
              style={{
                fontSize: '0.6rem',
                padding: '0.05rem 0.3rem',
                borderRadius: '3px',
                background: `${sColor}18`,
                color: sColor,
                border: `1px solid ${sColor}30`,
              }}
            >
              {star.spectralType}
            </span>
          )}

          <span
            className="hud-badge hud-badge--cyan"
            style={{ fontSize: '0.55rem', padding: '0.08rem 0.35rem' }}
          >
            LOCKED
          </span>
        </div>

        {/* Telemetry line */}
        <div
          className="hud-mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.62rem',
            color: 'rgba(138, 154, 174, 0.8)',
            marginTop: '0.15rem',
          }}
        >
          <span>{star.mission}</span>
          <span>•</span>
          <span>RA {star.ra.toFixed(2)}° / DEC {star.dec.toFixed(2)}°</span>
          {star.distanceParsecs != null && (
            <>
              <span>•</span>
              <span>{star.distanceParsecs.toFixed(1)} pc</span>
            </>
          )}
        </div>
      </div>

      {/* Inspect button */}
      {onInspect && (
        <button
          onClick={onInspect}
          className="hud-btn hud-btn--ghost"
          style={{ padding: '0.25rem 0.45rem', fontSize: '0.68rem', gap: '0.2rem' }}
          title="Inspect object telemetry"
        >
          <span>Details</span>
          <ChevronRight size={12} />
        </button>
      )}

      {/* Deselect / Return to universe button */}
      {onDeselect && (
        <button
          onClick={onDeselect}
          className="hud-btn hud-btn--ghost"
          style={{ padding: '0.25rem', border: 'none' }}
          title="Return to wide universe view"
          aria-label="Deselect celestial body"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
