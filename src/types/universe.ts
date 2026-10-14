import type { SpaceMission, StarObservation } from './index'

/**
 * Shared 3D universe data contract.
 */
export type CelestialObjectType = 'star' | 'planet' | 'system' | 'nebula' | 'galaxy'

export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'D'

export interface CelestialPlanet {
  id: string
  name: string
  radius: number
  distanceFromStar: number
  orbitSpeed: number
  orbitInclination?: number
  color: string
  atmosphereColor?: string
  hasRings?: boolean
  ringRadius?: [number, number]
  periodDays?: number
  depthPpm?: number
  planetRadiusEarth?: number
}

export interface CelestialObject {
  id: string
  name: string
  type: CelestialObjectType
  position: [number, number, number]
  radius: number
  color: string
  coronaColor: string
  temperature: number
  spectralType?: string
  spectralClass?: SpectralClass
  luminosity?: number
  description?: string
  starObservation?: StarObservation
  planets?: CelestialPlanet[]
  mission?: SpaceMission
  distanceParsecs?: number
  magnitude?: number
  lightIntensity?: number
}

export interface UniverseSceneProps {
  celestialObjects: CelestialObject[]
  selectedObjectId?: string
  onSelectObject?: (object: CelestialObject) => void
  hoveredObjectId?: string
  onHoverObject?: (object: CelestialObject | null) => void
  showOrbits?: boolean
  showLabels?: boolean
  enableMotion?: boolean
  quality?: 'low' | 'medium' | 'high'
  className?: string
  initialCameraPosition?: [number, number, number]
}
