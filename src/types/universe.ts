import type { StarObservation, SpaceMission } from './index'

/**
 * 3D Universe Explorer - Shared Celestial Types
 * Coordinated across astronomical registry and interactive planetary systems.
 */

export type CelestialObjectType = 'star' | 'planet' | 'system' | 'nebula' | 'galaxy'

export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'D'

export interface CelestialPlanet {
  id: string
  name: string
  /** Parent star identifier */
  hostStarId?: string
  /** Parent star display name */
  hostStarName?: string
  /** Confirmed disposition status per NASA Exoplanet Archive */
  disposition?: 'CONFIRMED' | 'CANDIDATE' | 'FALSE_POSITIVE'
  /** Primary astrophysical discovery method */
  discoveryMethod?: 'Transit' | 'Radial Velocity' | 'Transit Timing Variations' | 'Direct Imaging' | 'Microlensing'
  /** Year of confirmed discovery */
  discoveryYear?: number | null
  /** Primary observatory or mission discovery facility */
  discoveryFacility?: string | null

  // --- Measured Scientific Quantities (NASA Exoplanet Archive) ---
  /** Orbital period in Earth days (null if unmeasured) */
  periodDays?: number | null
  /** Semi-major axis in Astronomical Units (null if unmeasured) */
  semiMajorAxisAu?: number | null
  /** Planet radius in Earth radii R⊕ (null if unmeasured, e.g. RV-only) */
  planetRadiusEarth?: number | null
  /** Planet mass in Earth masses M⊕ (null if unmeasured, e.g. transit-only without TTV/RV) */
  massEarth?: number | null
  /** Calculated planetary equilibrium temperature in Kelvin (null if unmeasured) */
  equilibriumTempK?: number | null
  /** Measured photometric transit depth in parts-per-million (null for non-transiting) */
  depthPpm?: number | null
  /** Transit duration in hours (null for non-transiting) */
  transitDurationHours?: number | null
  /** Whether the planet orbits within circumstellar habitable zone boundaries */
  isHabitableZone?: boolean

  // --- Provenance & Scientific Reference Metadata ---
  /** Official NASA Exoplanet Archive record URL */
  sourceUrl?: string
  /** Primary literature citation */
  sourceCitation?: string
  /** Data retrieval timestamp */
  retrievalDate?: string
  /** Detailed scientific notes from peer-reviewed literature */
  scientificNotes?: string

  // --- Illustrative 3D Scene Visualization Properties (Not to 1:1 cosmic scale) ---
  /** Visual radius for 3D sphere */
  radius: number
  /** Distance from parent star in 3D scene units */
  distanceFromStar: number
  /** Orbital animation angular speed */
  orbitSpeed: number
  /** Orbital inclination angle in radians */
  orbitInclination?: number
  /** Hex color of the planetary surface */
  color: string
  /** Atmospheric scattering rim color */
  atmosphereColor?: string
  /** Whether the planet has a visible ring system */
  hasRings?: boolean
  /** Ring inner/outer radii relative to planet radius */
  ringRadius?: [number, number]
}

export interface CelestialObject {
  id: string
  name: string
  type: CelestialObjectType
  /** 3D position vector [x, y, z] in the universe scene */
  position: [number, number, number]
  /** Base rendering radius of the central star */
  radius: number
  /** Physically-inspired surface color (hex) */
  color: string
  /** Outer corona / atmospheric glow color */
  coronaColor: string
  /** Surface effective temperature in Kelvin */
  temperature: number
  /** Spectral type classification (e.g. "G2V", "M2V", "M8V") */
  spectralType?: string
  /** Broad spectral classification (O, B, A, F, G, K, M) */
  spectralClass?: SpectralClass
  /** Luminosity relative to Sun (L☉) */
  luminosity?: number
  /** Scientific description and context */
  description?: string
  /** Reference to original StarObservation catalog record if applicable */
  starObservation?: StarObservation
  /** Orbiting exoplanet children */
  planets?: CelestialPlanet[]
  /** Associated space mission */
  mission?: SpaceMission
  /** Distance from Solar System in parsecs */
  distanceParsecs?: number | null
  /** Distance from Solar System in light-years */
  distanceLightYears?: number | null
  /** Stellar radius in Solar radii R☉ (null if unmeasured) */
  stellarRadiusSolar?: number | null
  /** Stellar mass in Solar masses M☉ (null if unmeasured) */
  stellarMassSolar?: number | null
  /** Apparent optical magnitude Vmag */
  magnitude?: number | null
  /** Right Ascension in decimal degrees */
  raDegrees?: number | null
  /** Declination in decimal degrees */
  decDegrees?: number | null
  /** Astronomical host constellation */
  constellation?: string | null

  // --- Provenance & Scientific Reference Metadata ---
  sourceUrl?: string
  sourceCitation?: string
  retrievalDate?: string

  /** Point light intensity emitted by the star */
  lightIntensity?: number
}

export type SelectedTarget =
  | { type: 'star'; star: CelestialObject }
  | { type: 'planet'; planet: CelestialPlanet; parentStar: CelestialObject }
  | null

/**
 * Component API for UniverseScene
 */
export interface UniverseSceneProps {
  /** Array of celestial objects to render in 3D space */
  celestialObjects: CelestialObject[]
  /** Currently selected object identifier */
  selectedObjectId?: string
  /** Currently selected planet identifier (if a planet is focused) */
  selectedPlanetId?: string
  /** Stable callback fired when user selects a celestial object */
  onSelectObject?: (object: CelestialObject) => void
  /** Stable callback fired when user selects a specific exoplanet */
  onSelectPlanet?: (planet: CelestialPlanet, parentStar: CelestialObject) => void
  /** Currently hovered object identifier */
  hoveredObjectId?: string
  /** Stable callback fired when hovering over an object */
  onHoverObject?: (object: CelestialObject | null) => void
  /** Whether to enable realistic orbital paths */
  showOrbits?: boolean
  /** Whether to render 3D billboard text labels */
  showLabels?: boolean
  /** Whether real-time orbital and corona motion is enabled */
  enableMotion?: boolean
  /** Quality mode: 'low' disables post-processing for student laptops; 'high' enables full bloom */
  quality?: 'low' | 'medium' | 'high'
  /** Optional custom CSS class for outer container */
  className?: string
  /** Initial camera position [x, y, z] */
  initialCameraPosition?: [number, number, number]
}
