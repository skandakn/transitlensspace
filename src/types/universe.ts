import type { StarObservation, SpaceMission } from './index'

/**
 * 3D Universe Explorer - Shared Celestial Types
 * Coordinated with Members 2-4 for astronomical registry integration.
 */

export type CelestialObjectType = 'star' | 'planet' | 'system' | 'nebula' | 'galaxy'

export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'D'

export interface CelestialPlanet {
  id: string
  name: string
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
  /** Orbital period in Earth days */
  periodDays?: number
  /** Measured photometric transit depth in ppm */
  depthPpm?: number
  /** Planet radius in Earth radii */
  planetRadiusEarth?: number
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
  distanceParsecs?: number
  /** Apparent magnitude */
  magnitude?: number
  /** Point light intensity emitted by the star */
  lightIntensity?: number
}

/**
 * Component API for UniverseScene
 */
export interface UniverseSceneProps {
  /** Array of celestial objects to render in 3D space */
  celestialObjects: CelestialObject[]
  /** Currently selected object identifier */
  selectedObjectId?: string
  /** Stable callback fired when user selects a celestial object */
  onSelectObject?: (object: CelestialObject) => void
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
