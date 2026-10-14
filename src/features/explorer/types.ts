/**
 * TransitLens Explorer HUD – Local UI Types
 *
 * These are presentation-layer types used exclusively by the explorer HUD
 * overlay. They do NOT extend or duplicate the shared CelestialObject contract
 * from src/types/universe.ts. Callbacks accept CelestialObject so the 3D
 * engine and the HUD stay in sync via a single shared identity.
 */

export type ExplorerMode = 'orbit' | 'free'

export interface CoordinateDisplay {
  ra: number
  dec: number
  distanceParsecs?: number
}

export interface SearchHit {
  /** Same id as CelestialObject.id */
  id: string
  name: string
  type: 'star' | 'planet' | 'system'
  spectralType?: string
  temperature?: number
  mission?: string
}
