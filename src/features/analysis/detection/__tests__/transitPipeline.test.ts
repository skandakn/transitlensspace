import { describe, it, expect } from 'vitest'
import { detectTransits } from '../index'
import type { RawDataPoint } from '../types'

/**
 * Helper to generate synthetic photometric series with known periodic dips.
 */
function createSyntheticTransitCurve(
  period = 3.50,
  epoch = 0.8,
  depthFraction = 0.008,
  durationHours = 2.8,
  numDays = 21,
  cadenceMinutes = 30,
  noiseSigma = 0.0008
): RawDataPoint[] {
  const points: RawDataPoint[] = []
  const stepDays = cadenceMinutes / (24 * 60)
  const totalSteps = Math.floor(numDays / stepDays)
  const durationDays = durationHours / 24

  for (let i = 0; i < totalSteps; i++) {
    const time = parseFloat((i * stepDays).toFixed(4))
    const rawPhase = ((time - epoch) % period + period) % period
    const phase = rawPhase > period / 2 ? (rawPhase - period) / period : rawPhase / period
    const inTransit = Math.abs(phase * period) < durationDays / 2

    // Gaussian-like noise
    const noise = (Math.random() - 0.5) * noiseSigma * 2
    let flux = 1.0 + noise

    if (inTransit) {
      // Limb-darkened transit dip
      const x = (phase * period) / (durationDays / 2)
      const dip = depthFraction * Math.sqrt(Math.max(0, 1 - 0.6 * x * x))
      flux -= dip
    }

    points.push({
      time,
      flux: parseFloat(flux.toFixed(6)),
      fluxError: noiseSigma
    })
  }

  return points
}

/**
 * Helper to generate flat photometric series without any dips.
 */
function createFlatCurve(numDays = 15, cadenceMinutes = 30, noiseSigma = 0.0006): RawDataPoint[] {
  const points: RawDataPoint[] = []
  const stepDays = cadenceMinutes / (24 * 60)
  const totalSteps = Math.floor(numDays / stepDays)

  for (let i = 0; i < totalSteps; i++) {
    const time = parseFloat((i * stepDays).toFixed(4))
    const noise = (Math.random() - 0.5) * noiseSigma * 2
    points.push({
      time,
      flux: parseFloat((1.0 + noise).toFixed(6)),
      fluxError: noiseSigma
    })
  }

  return points
}

/**
 * Helper to generate erratic, high-noise photometric series.
 */
function createNoisyCurve(numDays = 15, cadenceMinutes = 30, noiseSigma = 0.02): RawDataPoint[] {
  const points: RawDataPoint[] = []
  const stepDays = cadenceMinutes / (24 * 60)
  const totalSteps = Math.floor(numDays / stepDays)

  for (let i = 0; i < totalSteps; i++) {
    const time = parseFloat((i * stepDays).toFixed(4))
    const noise = (Math.random() - 0.5) * noiseSigma * 2
    points.push({
      time,
      flux: parseFloat((1.0 + noise).toFixed(6)),
      fluxError: noiseSigma
    })
  }

  return points
}

describe('Transit Detection Pipeline (Member 5 Algorithm)', () => {
  describe('1. Repeating-Dip Dataset', () => {
    it('detects periodic dips, calculates correct period, and classifies as CANDIDATE', () => {
      const knownPeriod = 3.50
      const knownDepth = 0.008
      const dataset = createSyntheticTransitCurve(knownPeriod, 0.8, knownDepth, 3.0, 21, 30, 0.0006)

      const result = detectTransits(dataset, {
        minPeriodDays: 1.0,
        maxPeriodDays: 8.0,
        periodGridSteps: 2000
      })

      expect(result.status).toBe('completed')
      expect(result.isPeriodic).toBe(true)
      expect(result.estimatedPeriodDays).toBeDefined()
      // Period within 5% of known value (3.5d)
      expect(Math.abs(result.estimatedPeriodDays! - knownPeriod) / knownPeriod).toBeLessThan(0.05)

      expect(result.depth).toBeDefined()
      expect(result.depth!.fraction).toBeGreaterThan(0.005)
      expect(result.depth!.ppm).toBeGreaterThan(5000)

      expect(result.snr).toBeDefined()
      expect(result.snr!).toBeGreaterThan(7.0)

      // Strict requirement: Never label as CONFIRMED without ground-based radial velocity
      expect(result.disposition).toBe('CANDIDATE')
      expect(result.disposition).not.toBe('CONFIRMED')

      expect(result.confidenceScore).toBeGreaterThan(60)
      expect(result.qualityScore).toBeGreaterThan(0.60)
      expect(result.scoreExplanation).toContain('Confidence Score')
      expect(result.scoreExplanation).toContain('CANDIDATE')
      expect(result.detectedDips.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('2. Flat Curve', () => {
    it('returns an explicit inconclusive result when no dips exist', () => {
      const flatData = createFlatCurve(15, 30, 0.0005)

      const result = detectTransits(flatData)

      expect(result.status).toBe('inconclusive')
      expect(result.disposition).toBe('INCONCLUSIVE')
      expect(result.isPeriodic).toBe(false)
      expect(result.confidenceScore).toBe(0)
      expect(result.qualityScore).toBe(0)
      expect(result.detectedDips.length).toBe(0)
      expect(result.inconclusiveReason).toBeDefined()
      expect(result.inconclusiveReason).toContain('Flat light curve')
      expect(result.scoreExplanation).toContain('Light curve is flat')
    })
  })

  describe('3. Noisy Data', () => {
    it('handles heavy noise and returns inconclusive or low confidence without false alarms', () => {
      const noisyData = createNoisyCurve(15, 30, 0.025)

      const result = detectTransits(noisyData)

      expect(result.statistics.noiseRms).toBeGreaterThan(0.01)
      expect(result.disposition).not.toBe('CANDIDATE')
      expect(result.confidenceScore).toBeLessThan(50)
      if (result.status === 'inconclusive') {
        expect(result.inconclusiveReason).toBeDefined()
      }
    })
  })

  describe('4. Invalid and Edge-Case Input', () => {
    it('handles null, undefined, and non-array inputs gracefully', () => {
      const resNull = detectTransits(null)
      expect(resNull.status).toBe('inconclusive')
      expect(resNull.inconclusiveReason).toContain('Input data must be a non-empty array')

      const resObj = detectTransits({ foo: 'bar' })
      expect(resObj.status).toBe('inconclusive')
    })

    it('handles empty arrays without throwing errors', () => {
      const resEmpty = detectTransits([])
      expect(resEmpty.status).toBe('inconclusive')
      expect(resEmpty.disposition).toBe('INCONCLUSIVE')
    })

    it('handles insufficient data count (< 15 points)', () => {
      const shortData: RawDataPoint[] = [
        { time: 1.0, flux: 1.0 },
        { time: 1.1, flux: 0.99 },
        { time: 1.2, flux: 1.0 }
      ]
      const result = detectTransits(shortData)
      expect(result.status).toBe('inconclusive')
      expect(result.inconclusiveReason).toContain('Insufficient data points')
    })

    it('filters out corrupted NaNs and non-finite numbers', () => {
      const corruptedData = [
        { time: 1.0, flux: 1.0 },
        { time: NaN, flux: 1.0 },
        { time: 2.0, flux: Infinity },
        { time: 3.0, flux: -0.5 },
        { time: 'invalid', flux: 'invalid' },
        null,
        undefined
      ]
      const result = detectTransits(corruptedData)
      expect(result.status).toBe('inconclusive')
    })
  })

  describe('5. Eclipsing Binary / Even-Odd Depth Discrimination', () => {
    it('flags alternating transit depth disparity as FALSE_POSITIVE', () => {
      // Simulate binary with alternating deep (primary) and shallow (secondary) eclipses
      const period = 4.0
      const points: RawDataPoint[] = []
      const numDays = 20
      const stepDays = 30 / (24 * 60)
      const totalSteps = Math.floor(numDays / stepDays)

      for (let i = 0; i < totalSteps; i++) {
        const time = i * stepDays
        let flux = 1.0 + (Math.random() - 0.5) * 0.0004
        const cycle = Math.floor(time / period)
        const phaseTime = time % period

        // Transit at 1.0 day
        if (Math.abs(phaseTime - 1.0) < 0.08) {
          // Even cycle = primary deep eclipse (0.015), Odd cycle = secondary eclipse (0.006)
          const depth = cycle % 2 === 0 ? 0.015 : 0.006
          flux -= depth
        }

        points.push({ time, flux })
      }

      const result = detectTransits(points, { minPeriodDays: 2.0, maxPeriodDays: 6.0 })
      if (result.periodicDips.length >= 2) {
        expect(result.disposition).toBe('FALSE_POSITIVE')
      }
    })
  })
})
