/**
 * CelestialSearch – searchable star & planet catalogue overlay.
 *
 * Appears in the top-right of the HUD. Typing filters the live catalogue;
 * clicking a result fires onSelect which focuses the 3D camera on that object.
 */
import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Star, Globe, Layers } from 'lucide-react'
import type { StarObservation } from '../../types'
import './hud.css'

const TYPE_ICON = {
  star: Star,
  planet: Globe,
  system: Layers,
} as const

const TYPE_COLOR = {
  star: '#dfb16f',
  planet: '#59d6e2',
  system: '#aaa0ed',
} as const

function spectralBadge(spectralType?: string) {
  if (!spectralType) return null
  const letter = spectralType[0].toUpperCase()
  const palette: Record<string, string> = {
    O: '#93c5fd',
    B: '#bfdbfe',
    A: '#e0f2fe',
    F: '#fef9c3',
    G: '#fef08a',
    K: '#fed7aa',
    M: '#fca5a5',
  }
  const color = palette[letter] ?? '#e5edf6'
  return (
    <span
      className="hud-mono"
      style={{
        fontSize: '0.62rem',
        padding: '0.1rem 0.35rem',
        borderRadius: 4,
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
        letterSpacing: '0.06em',
      }}
    >
      {spectralType}
    </span>
  )
}

interface CelestialSearchProps {
  stars: StarObservation[]
  selectedStarId?: string
  onSelect: (star: StarObservation) => void
  className?: string
}

export function CelestialSearch({ stars, selectedStarId, onSelect, className = '' }: CelestialSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return stars.slice(0, 8)
    return stars
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.catalogId?.toLowerCase().includes(q) ?? false) ||
          (s.mission?.toLowerCase().includes(q) ?? false) ||
          (s.spectralType?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 8)
  }, [query, stars])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 60)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div
      ref={panelRef}
      className={`hud-interactive hud-enter-right ${className}`}
      style={{ position: 'relative', width: 280 }}
      id="hud-search"
    >
      {/* Search pill trigger */}
      <div
        className="hud-panel"
        style={{ padding: '0.5rem 0.7rem', cursor: 'text' }}
        onClick={() => {
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 40)
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={13} color="#59d6e2" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            id="hud-search-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search stars, systems… (⌘K)"
            className="hud-search-input"
            style={{ padding: '0 0.25rem', border: 'none', background: 'transparent', boxShadow: 'none' }}
            aria-label="Search celestial catalogue"
            aria-autocomplete="list"
            aria-controls="hud-search-results"
            aria-expanded={open}
            role="combobox"
          />
          {query && (
            <button
              className="hud-btn--ghost hud-btn"
              onClick={(e) => {
                e.stopPropagation()
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              style={{ padding: '0.15rem', border: 'none', background: 'transparent' }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div
          id="hud-search-results"
          role="listbox"
          className="hud-panel hud-enter-up hud-scroll"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: 310,
            padding: '0.5rem',
            zIndex: 20,
          }}
        >
          <div
            className="hud-mono"
            style={{
              fontSize: '0.6rem',
              color: 'rgba(89,214,226,0.4)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.2rem 0.5rem 0.4rem',
            }}
          >
            {query ? `${results.length} matching` : 'All systems'}
          </div>
          {results.map((star) => {
            const isSelected = star.id === selectedStarId
            const Icon = TYPE_ICON.star
            const color = TYPE_COLOR.star
            return (
              <button
                key={star.id}
                role="option"
                aria-selected={isSelected}
                className={`hud-search-result ${isSelected ? 'hud-search-result--active' : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'none' }}
                onClick={() => {
                  onSelect(star)
                  setOpen(false)
                  setQuery('')
                }}
              >
                {/* Type icon */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: `${color}14`,
                    border: `1px solid ${color}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={12} color={color} />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isSelected ? '#59d6e2' : '#e5edf6',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {star.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      marginTop: 2,
                    }}
                  >
                    {spectralBadge(star.spectralType)}
                    <span
                      className="hud-mono"
                      style={{ fontSize: '0.6rem', color: 'rgba(138,154,174,0.65)' }}
                    >
                      {star.mission}
                    </span>
                    {star.distanceParsecs && (
                      <span
                        className="hud-mono"
                        style={{ fontSize: '0.6rem', color: 'rgba(138,154,174,0.45)' }}
                      >
                        {star.distanceParsecs.toFixed(0)} pc
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <span className="hud-badge hud-badge--cyan" style={{ flexShrink: 0 }}>
                    Active
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Empty search state */}
      {open && results.length === 0 && (
        <div
          id="hud-search-empty"
          className="hud-panel hud-enter-up"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            padding: '1.25rem 0.75rem',
            textAlign: 'center',
            zIndex: 20,
          }}
        >
          <Search size={18} color="rgba(89,214,226,0.35)" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e5edf6' }}>
            No celestial bodies found
          </div>
          <div
            className="hud-mono"
            style={{ fontSize: '0.62rem', color: 'rgba(138,154,174,0.7)', marginTop: '0.3rem' }}
          >
            No matches for &ldquo;{query}&rdquo;
          </div>
        </div>
      )}
    </div>
  )
}
