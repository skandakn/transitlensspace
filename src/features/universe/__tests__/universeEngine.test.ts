import { describe, it, expect } from 'vitest'
import {
  starObservationsToCelestialObjects,
  getStellarColor
} from '../celestialAdapter'
import { MOCK_STARS } from '../../../data/mockData'
import type { CelestialObject } from '../../../types/universe'

describe('3D Universe Engine & Celestial Adapter (Lead 3D Graphics Engineer)', () => {
  describe('getStellarColor Physically-Inspired Temperature Mapping', () => {
    it('maps high-temperature hot stars (O/B type) to blue shades', () => {
      const { coreColor, coronaColor } = getStellarColor(12000)
      expect(coreColor).toBe('#9bb0ff')
      expect(coronaColor).toBe('#4d79ff')
    })

    it('maps Sun-like G-type stars (~5800K) to solar yellow/warm hues', () => {
      const { coreColor, coronaColor } = getStellarColor(5778)
      expect(coreColor).toBe('#ffe599')
      expect(coronaColor).toBe('#ffaa00')
    })

    it('maps cool M-type red dwarf stars (~3000K) to crimson/orange-red hues', () => {
      const { coreColor, coronaColor } = getStellarColor(3100)
      expect(coreColor).toBe('#ff6644')
      expect(coronaColor).toBe('#cc2200')
    })
  })

  describe('starObservationsToCelestialObjects Props Transformation', () => {
    it('converts StarObservation catalog records into 3D celestial objects with spatial coordinates', () => {
      const celestialObjects: CelestialObject[] = starObservationsToCelestialObjects(MOCK_STARS)

      expect(celestialObjects.length).toBe(MOCK_STARS.length)

      celestialObjects.forEach((obj) => {
        expect(obj.id).toBeDefined()
        expect(obj.name).toBeDefined()
        expect(obj.type).toBe('system')
        expect(obj.position).toBeInstanceOf(Array)
        expect(obj.position.length).toBe(3)
        // Verify 3D coordinates are finite numbers
        expect(Number.isFinite(obj.position[0])).toBe(true)
        expect(Number.isFinite(obj.position[1])).toBe(true)
        expect(Number.isFinite(obj.position[2])).toBe(true)
        // Verify rendering radius is positive
        expect(obj.radius).toBeGreaterThan(0)
        // Verify links back to source StarObservation
        expect(obj.starObservation).toBeDefined()
      })
    })

    it('places known star systems (TOI-700, Kepler-90, Kepler-22, TRAPPIST-1) in visually separated positions', () => {
      const celestialObjects = starObservationsToCelestialObjects(MOCK_STARS)
      const toi700 = celestialObjects.find((s) => s.name === 'TOI-700')
      const kepler90 = celestialObjects.find((s) => s.name === 'Kepler-90')
      const kepler22 = celestialObjects.find((s) => s.name === 'Kepler-22')
      const trappist1 = celestialObjects.find((s) => s.name === 'TRAPPIST-1')

      expect(toi700).toBeDefined()
      expect(kepler90).toBeDefined()
      expect(kepler22).toBeDefined()
      expect(trappist1).toBeDefined()

      // Calculate 3D Euclidean distances between systems
      const dist = (a: [number, number, number], b: [number, number, number]) =>
        Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

      const d1 = dist(toi700!.position, kepler90!.position)
      const d2 = dist(toi700!.position, kepler22!.position)
      const d3 = dist(kepler90!.position, trappist1!.position)

      // Must be well-separated in 3D space (at least 30 units apart)
      expect(d1).toBeGreaterThan(30)
      expect(d2).toBeGreaterThan(30)
      expect(d3).toBeGreaterThan(30)
    })

    it('populates realistic exoplanet architectures for multi-planet hosts', () => {
      const celestialObjects = starObservationsToCelestialObjects(MOCK_STARS)
      const kepler90 = celestialObjects.find((s) => s.name === 'Kepler-90')
      const trappist1 = celestialObjects.find((s) => s.name === 'TRAPPIST-1')

      expect(kepler90?.planets?.length).toBe(6) // Kepler-90 system
      expect(trappist1?.planets?.length).toBe(7) // TRAPPIST-1 7-planet resonant chain

      // Verify planetary parameters
      const kepler90h = kepler90?.planets?.find((p) => p.name.includes('Kepler-90 h'))
      expect(kepler90h).toBeDefined()
      expect(kepler90h?.hasRings).toBe(true)
      expect(kepler90h?.distanceFromStar).toBeGreaterThan(10)
    })
  })
})
