import type { StarObservation } from '../../types'
import type { CelestialObject, CelestialPlanet } from '../../types/universe'

/**
 * Derives a physically inspired hex color from stellar effective temperature (Kelvin).
 */
export function getStellarColor(temperature: number): { coreColor: string; coronaColor: string } {
  if (temperature >= 10000) {
    return { coreColor: '#9bb0ff', coronaColor: '#4d79ff' } // Class O/B blue
  } else if (temperature >= 7500) {
    return { coreColor: '#bbccff', coronaColor: '#6699ff' } // Class A white-blue
  } else if (temperature >= 6000) {
    return { coreColor: '#f8f9ff', coronaColor: '#80b3ff' } // Class F yellow-white
  } else if (temperature >= 5200) {
    return { coreColor: '#ffe599', coronaColor: '#ffaa00' } // Class G solar yellow (e.g. Kepler-90)
  } else if (temperature >= 3700) {
    return { coreColor: '#ffb366', coronaColor: '#ff6600' } // Class K orange
  } else {
    return { coreColor: '#ff6644', coronaColor: '#cc2200' } // Class M red dwarf (e.g. TOI-700, TRAPPIST-1)
  }
}

/**
 * Standard fixed 3D galaxy positions for known catalog stars so they are visually separated.
 */
const CATALOG_POSITIONS: Record<string, [number, number, number]> = {
  'TIC-261136679': [-45, 6, -25],   // TOI-700
  'TOI-700': [-45, 6, -25],
  'KIC-11442793': [40, 14, -50],    // Kepler-90
  'Kepler-90': [40, 14, -50],
  'KIC-10593626': [-30, -18, 35],   // Kepler-22
  'Kepler-22': [-30, -18, 35],
  'TIC-149603524': [55, -10, 30],   // TRAPPIST-1
  'TRAPPIST-1': [55, -10, 30]
}

/**
 * Realistic planetary architecture presets for known multi-planet systems.
 */
const KNOWN_PLANET_SYSTEMS: Record<string, CelestialPlanet[]> = {
  'TOI-700': [
    {
      id: 'toi-700-b',
      name: 'TOI-700 b',
      radius: 0.38,
      distanceFromStar: 3.8,
      orbitSpeed: 1.2,
      orbitInclination: 0.05,
      color: '#a38a75',
      periodDays: 9.98,
      depthPpm: 840,
      planetRadiusEarth: 1.01
    },
    {
      id: 'toi-700-c',
      name: 'TOI-700 c',
      radius: 0.62,
      distanceFromStar: 5.4,
      orbitSpeed: 0.85,
      orbitInclination: 0.08,
      color: '#7ba4b5',
      periodDays: 16.05,
      depthPpm: 1280,
      planetRadiusEarth: 2.63
    },
    {
      id: 'toi-700-d',
      name: 'TOI-700 d (Habitable Zone)',
      radius: 0.44,
      distanceFromStar: 7.6,
      orbitSpeed: 0.55,
      orbitInclination: 0.03,
      color: '#3d8b7a',
      atmosphereColor: '#6ee7b7',
      periodDays: 37.43,
      depthPpm: 920,
      planetRadiusEarth: 1.14
    }
  ],
  'Kepler-90': [
    { id: 'k90-b', name: 'Kepler-90 b', radius: 0.36, distanceFromStar: 3.5, orbitSpeed: 1.8, color: '#c29b7c', periodDays: 7.0 },
    { id: 'k90-c', name: 'Kepler-90 c', radius: 0.38, distanceFromStar: 4.6, orbitSpeed: 1.4, color: '#a88d76', periodDays: 8.7 },
    { id: 'k90-i', name: 'Kepler-90 i (AI Discovered)', radius: 0.45, distanceFromStar: 6.0, orbitSpeed: 1.1, color: '#d97706', atmosphereColor: '#fbbf24', periodDays: 14.45 },
    { id: 'k90-d', name: 'Kepler-90 d', radius: 0.65, distanceFromStar: 8.0, orbitSpeed: 0.8, color: '#60a5fa', periodDays: 59.7 },
    { id: 'k90-e', name: 'Kepler-90 e', radius: 0.68, distanceFromStar: 9.8, orbitSpeed: 0.65, color: '#38bdf8', periodDays: 91.9 },
    { id: 'k90-h', name: 'Kepler-90 h (Gas Giant)', radius: 1.25, distanceFromStar: 14.0, orbitSpeed: 0.35, color: '#eab308', hasRings: true, ringRadius: [1.6, 2.4], periodDays: 331.6 }
  ],
  'Kepler-22': [
    {
      id: 'kepler-22-b',
      name: 'Kepler-22 b (Water World / Super-Earth)',
      radius: 0.68,
      distanceFromStar: 7.2,
      orbitSpeed: 0.5,
      orbitInclination: 0.12,
      color: '#0284c7',
      atmosphereColor: '#38bdf8',
      periodDays: 289.86,
      depthPpm: 4920,
      planetRadiusEarth: 2.38
    }
  ],
  'TRAPPIST-1': [
    { id: 'trap-b', name: 'TRAPPIST-1 b', radius: 0.32, distanceFromStar: 2.4, orbitSpeed: 2.2, color: '#b45309', periodDays: 1.51 },
    { id: 'trap-c', name: 'TRAPPIST-1 c', radius: 0.34, distanceFromStar: 3.2, orbitSpeed: 1.7, color: '#d97706', periodDays: 2.42 },
    { id: 'trap-d', name: 'TRAPPIST-1 d', radius: 0.28, distanceFromStar: 4.1, orbitSpeed: 1.3, color: '#ca8a04', periodDays: 4.05 },
    { id: 'trap-e', name: 'TRAPPIST-1 e (Habitable)', radius: 0.33, distanceFromStar: 5.2, orbitSpeed: 1.0, color: '#15803d', atmosphereColor: '#4ade80', periodDays: 6.10 },
    { id: 'trap-f', name: 'TRAPPIST-1 f (Water World)', radius: 0.35, distanceFromStar: 6.4, orbitSpeed: 0.8, color: '#0369a1', atmosphereColor: '#38bdf8', periodDays: 9.21 },
    { id: 'trap-g', name: 'TRAPPIST-1 g', radius: 0.36, distanceFromStar: 7.7, orbitSpeed: 0.65, color: '#64748b', periodDays: 12.35 },
    { id: 'trap-h', name: 'TRAPPIST-1 h (Ice World)', radius: 0.29, distanceFromStar: 9.0, orbitSpeed: 0.5, color: '#cbd5e1', periodDays: 20.0 }
  ]
}

/**
 * Converts an array of StarObservation records into 3D CelestialObject models.
 * Preserves the single source of truth without creating a competing catalog.
 */
export function starObservationsToCelestialObjects(stars: StarObservation[]): CelestialObject[] {
  return stars.map((star, idx) => {
    const { coreColor, coronaColor } = getStellarColor(star.temperature)

    // Lookup deterministic position or compute pseudo-random galactic coordinates from RA/Dec/index
    let position: [number, number, number] = CATALOG_POSITIONS[star.id] || CATALOG_POSITIONS[star.name]
    if (!position) {
      // Deterministic layout in a sphere if custom star
      const angle = (idx * 2.39996) + 0.5 // Golden angle
      const distance = 40 + (idx % 4) * 20
      const height = ((idx % 5) - 2) * 12
      position = [
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      ]
    }

    // Lookup planetary system if known, or generate based on star radius
    const planets = KNOWN_PLANET_SYSTEMS[star.name] || [
      {
        id: `${star.id}-b`,
        name: `${star.name} b`,
        radius: 0.45,
        distanceFromStar: 4.5,
        orbitSpeed: 1.0,
        color: '#38bdf8',
        periodDays: 12.5,
        depthPpm: 950
      }
    ]

    // Visual star scale (normalized around 1.2 to 2.8)
    const baseRadius = Math.max(1.0, Math.min(2.6, (star.stellarRadius || 1.0) * 1.4))

    return {
      id: star.id,
      name: star.name,
      type: 'system',
      position,
      radius: baseRadius,
      color: coreColor,
      coronaColor,
      temperature: star.temperature,
      spectralType: star.spectralType,
      luminosity: parseFloat((Math.pow(star.stellarRadius || 1, 2) * Math.pow(star.temperature / 5778, 4)).toFixed(3)),
      description: star.description,
      starObservation: star,
      planets,
      mission: star.mission,
      distanceParsecs: star.distanceParsecs,
      magnitude: star.magnitude,
      lightIntensity: Math.min(3.5, Math.max(1.5, baseRadius * 1.2))
    }
  })
}
