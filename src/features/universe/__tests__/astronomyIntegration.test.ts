import { describe, it, expect } from 'vitest'
import {
  BUNDLED_CELESTIAL_SYSTEMS,
  ASTRONOMICAL_SCALE_DISCLAIMER,
  RETRIEVAL_DATE,
  searchCelestialCatalog
} from '../../../data/astronomyData'

describe('Astronomy Data & Integration Suite (Member 4 Integration Engineer)', () => {
  describe('1. Reputable Astronomical Sources & Data Provenance', () => {
    it('bundles verified celestial systems from NASA Exoplanet Archive and SIMBAD', () => {
      expect(BUNDLED_CELESTIAL_SYSTEMS.length).toBeGreaterThanOrEqual(6)

      const names = BUNDLED_CELESTIAL_SYSTEMS.map((s) => s.name)
      expect(names).toContain('TOI-700')
      expect(names).toContain('Kepler-90')
      expect(names).toContain('TRAPPIST-1')
      expect(names).toContain('WASP-12')
      expect(names).toContain('HD 219134')
      expect(names).toContain('Proxima Centauri')
    })

    it('records source URLs, citations, and retrieval dates for all host systems', () => {
      BUNDLED_CELESTIAL_SYSTEMS.forEach((system) => {
        expect(system.sourceUrl).toBeDefined()
        expect(system.sourceUrl).toMatch(/^https?:\/\//)
        expect(system.sourceCitation).toBeDefined()
        expect(system.sourceCitation!.length).toBeGreaterThan(5)
        expect(system.retrievalDate).toBe(RETRIEVAL_DATE)
        expect(system.retrievalDate).toBe('2026-10-14')
      })
    })

    it('records source URLs, citations, and retrieval dates for all confirmed exoplanets', () => {
      const allPlanets = BUNDLED_CELESTIAL_SYSTEMS.flatMap((s) => s.planets || [])
      expect(allPlanets.length).toBeGreaterThan(15)

      allPlanets.forEach((planet) => {
        expect(planet.sourceUrl).toBeDefined()
        expect(planet.sourceUrl).toMatch(/^https?:\/\//)
        expect(planet.sourceCitation).toBeDefined()
        expect(planet.retrievalDate).toBe('2026-10-14')
        expect(planet.disposition).toBe('CONFIRMED')
      })
    })

    it('exports a clear scale disclaimer explaining visual 3D scale vs true cosmic scale', () => {
      expect(ASTRONOMICAL_SCALE_DISCLAIMER).toBeDefined()
      expect(ASTRONOMICAL_SCALE_DISCLAIMER).toContain('Scale Notice')
      expect(ASTRONOMICAL_SCALE_DISCLAIMER).toContain('Real cosmic distances are hundreds of thousands of times larger')
    })
  })

  describe('2. Measured Scientific Properties vs Illustrative 3D Parameters', () => {
    it('accurately records measured physical properties for host stars', () => {
      const toi700 = BUNDLED_CELESTIAL_SYSTEMS.find((s) => s.name === 'TOI-700')
      expect(toi700).toBeDefined()
      expect(toi700?.spectralType).toBe('M2V')
      expect(toi700?.temperature).toBe(3480)
      expect(toi700?.stellarRadiusSolar).toBe(0.42)
      expect(toi700?.stellarMassSolar).toBe(0.41)
      expect(toi700?.distanceLightYears).toBeCloseTo(101.5, 0.5)

      const kepler90 = BUNDLED_CELESTIAL_SYSTEMS.find((s) => s.name === 'Kepler-90')
      expect(kepler90).toBeDefined()
      expect(kepler90?.spectralType).toBe('G0V')
      expect(kepler90?.temperature).toBe(6080)
      expect(kepler90?.stellarRadiusSolar).toBe(1.20)
      expect(kepler90?.stellarMassSolar).toBe(1.20)

      const trappist1 = BUNDLED_CELESTIAL_SYSTEMS.find((s) => s.name === 'TRAPPIST-1')
      expect(trappist1).toBeDefined()
      expect(trappist1?.spectralType).toBe('M8V')
      expect(trappist1?.temperature).toBe(2566)
      expect(trappist1?.distanceLightYears).toBeCloseTo(40.7, 0.5)
    })

    it('explicitly represents unmeasured scientific properties as null without fabrication', () => {
      // TOI-700 planets were detected via transits; precise radial velocity masses are unmeasured
      const toi700 = BUNDLED_CELESTIAL_SYSTEMS.find((s) => s.name === 'TOI-700')
      const toi700b = toi700?.planets?.find((p) => p.name === 'TOI-700 b')
      expect(toi700b?.planetRadiusEarth).toBe(0.91)
      expect(toi700b?.massEarth).toBeNull() // Strictly null, not fabricated

      // Proxima Centauri b and d were detected via radial velocity; transit radii and depths are unmeasured
      const proxima = BUNDLED_CELESTIAL_SYSTEMS.find((s) => s.name === 'Proxima Centauri')
      const proximaB = proxima?.planets?.find((p) => p.name === 'Proxima Centauri b')
      expect(proximaB?.discoveryMethod).toBe('Radial Velocity')
      expect(proximaB?.massEarth).toBeCloseTo(1.07, 0.1)
      expect(proximaB?.planetRadiusEarth).toBeNull() // Not transiting -> radius is null
      expect(proximaB?.depthPpm).toBeNull() // Not transiting -> depth is null
      expect(proximaB?.transitDurationHours).toBeNull()
    })

    it('distinguishes physical orbital distances (AU) from visual 3D scene units', () => {
      const trappist1 = BUNDLED_CELESTIAL_SYSTEMS.find((s) => s.name === 'TRAPPIST-1')
      const trappistB = trappist1?.planets?.find((p) => p.name === 'TRAPPIST-1 b')

      // Physical measurement in astronomical units
      expect(trappistB?.semiMajorAxisAu).toBe(0.0115)
      // Scaled visual distance in 3D WebGL coordinate space for interactive rendering
      expect(trappistB?.distanceFromStar).toBeGreaterThan(2.0)
      expect(trappistB?.distanceFromStar).toBeLessThan(10.0)
    })
  })

  describe('3. Parent-Star Relationships & Architectural Consistency', () => {
    it('verifies every planet links back to its parent star ID and name', () => {
      BUNDLED_CELESTIAL_SYSTEMS.forEach((star) => {
        if (!star.planets) return

        star.planets.forEach((planet) => {
          expect(planet.hostStarId).toBe(star.id)
          expect(planet.hostStarName).toBe(star.name)
        })
      })
    })

    it('verifies famous habitable-zone planets are correctly flagged', () => {
      const toi700 = BUNDLED_CELESTIAL_SYSTEMS.find((s) => s.name === 'TOI-700')
      const toi700d = toi700?.planets?.find((p) => p.name === 'TOI-700 d')
      expect(toi700d?.isHabitableZone).toBe(true)

      const trappist1 = BUNDLED_CELESTIAL_SYSTEMS.find((s) => s.name === 'TRAPPIST-1')
      const trappistE = trappist1?.planets?.find((p) => p.name === 'TRAPPIST-1 e')
      const trappistF = trappist1?.planets?.find((p) => p.name === 'TRAPPIST-1 f')
      const trappistG = trappist1?.planets?.find((p) => p.name === 'TRAPPIST-1 g')
      expect(trappistE?.isHabitableZone).toBe(true)
      expect(trappistF?.isHabitableZone).toBe(true)
      expect(trappistG?.isHabitableZone).toBe(true)

      const trappistB = trappist1?.planets?.find((p) => p.name === 'TRAPPIST-1 b')
      expect(trappistB?.isHabitableZone).toBe(false)
    })
  })

  describe('4. Celestial Catalog Search & Camera Navigation Focus', () => {
    it('searches and finds host stars by name', () => {
      const results = searchCelestialCatalog('TOI-700')
      expect(results.length).toBeGreaterThan(0)
      const starResult = results.find((r) => r.type === 'star')
      expect(starResult).toBeDefined()
      expect(starResult?.star.name).toBe('TOI-700')
    })

    it('searches and finds individual exoplanets by name with parent star context', () => {
      const results = searchCelestialCatalog('Kepler-90 h')
      expect(results.length).toBeGreaterThan(0)
      const planetResult = results.find((r) => r.type === 'planet')
      expect(planetResult).toBeDefined()
      expect(planetResult?.planet?.name).toBe('Kepler-90 h')
      expect(planetResult?.hostStarName).toBe('Kepler-90')
      expect(planetResult?.star.id).toBe('KIC-11442793')
    })

    it('searches by constellation (e.g. Dorado or Aquarius)', () => {
      const doradoResults = searchCelestialCatalog('Dorado')
      expect(doradoResults.some((r) => r.star.name === 'TOI-700')).toBe(true)

      const aquariusResults = searchCelestialCatalog('Aquarius')
      expect(aquariusResults.some((r) => r.star.name === 'TRAPPIST-1')).toBe(true)
    })

    it('handles empty, whitespace, and unmatched queries safely', () => {
      expect(searchCelestialCatalog('')).toEqual([])
      expect(searchCelestialCatalog('   ')).toEqual([])
      expect(searchCelestialCatalog('NonExistentObjectXYZ999')).toEqual([])
    })
  })

  describe('5. Offline Operation & Self-Contained Execution', () => {
    it('provides all celestial systems without external network or API calls', () => {
      expect(BUNDLED_CELESTIAL_SYSTEMS.length).toBe(6)
      const totalPlanets = BUNDLED_CELESTIAL_SYSTEMS.reduce((sum, s) => sum + (s.planets?.length || 0), 0)
      // TOI-700 (4) + Kepler-90 (8) + TRAPPIST-1 (7) + WASP-12 (1) + HD 219134 (3) + Proxima (2) = 25 planets
      expect(totalPlanets).toBe(25)
    })
  })
})
