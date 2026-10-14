/**
 * HudPanel – base glassmorphism panel used by all floating HUD overlays.
 *
 * Uses CSS custom properties from index.css so the design tokens stay
 * consistent with the rest of the application.
 */
import React from 'react'
import './hud.css'

interface HudPanelProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  variant?: 'default' | 'compact'
  id?: string
}

export function HudPanel({ children, className = '', style, variant = 'default', id }: HudPanelProps) {
  return (
    <div
      id={id}
      className={`hud-panel hud-panel--${variant} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
