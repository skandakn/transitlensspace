import { describe, it, expect, vi } from 'vitest'
import {
  runTransitDetection,
  validateObservationData,
  generateFlatLightCurve,
  generateNoisyLightCurve
} from '../transitDetection'
import { determineOutcome } from '../outcomeUtils'
import { generateSyntheticLightCurve, MOCK_STARS } from '../../../data/mockData'
import type { AnalysisResult, StarObservation } from '../../../types'

describe('Analysis Workflow & Results Panel (Member 6)', () => {
  const mockStar: StarObservation = {
    id: 'TIC-261136679',
    name: 'TOI-700',
    mission: 'TESS',
    ra: 97.09,
    dec: -65.57,
    magnitude: 13.15,
    temperature: 3480,
    stellarRadius: 0.42,
    stellarMass: 0.41,
    observationDate: '2023-08-15',
    numPoints: 1250
  }

  describe('Requirement 1 & 2: Observation & Validation Rules', () => {
    it('disables analysis when target star identifier is blank or placeholder', () => {
      const blankStar = { ...mockStar, id: '—', name: '' }
      const validation = validateObservationData(blankStar, [])
      expect(validation.valid).toBe(false)
      expect(validation.reason).toContain('Target star identifier is missing')
    })

    it('disables analysis when photometric data points are less than minimum required', () => {
      const validation = validateObservationData(mockStar, [
        { time: 1.0, flux: 1.0 },
        { time: 1.1, flux: 0.99 }
      ])
      expect(validation.valid).toBe(false)
      expect(validation.reason).toContain('Insufficient photometric data points')
    })

    it('enables analysis when valid star and sufficient observations are loaded', () => {
      const points = generateSyntheticLightCurve(3.52, 0.85, 0.008, 2.4, 25, 30)
      const validation = validateObservationData(mockStar, points)
      expect(validation.valid).toBe(true)
      expect(validation.reason).toBeUndefined()
    })
  })

  describe('Requirement 3 & 4: Progress Reporting & Calling Member 5 Detection Engine', () => {
    it('executes analysis and emits real processing telemetry stages', async () => {
      const points = generateSyntheticLightCurve(3.52, 0.85, 0.008, 2.4, 25, 30)
      const stages: string[] = []
      const onProgress = vi.fn((progress) => {
        stages.push(progress.currentStage)
      })

      const result = await runTransitDetection(
        mockStar,
        points,
        { minPeriodDays: 0.5, maxPeriodDays: 20.0, snrThreshold: 6.5 },
        onProgress
      )

      expect(onProgress).toHaveBeenCalled()
      expect(stages.length).toBeGreaterThanOrEqual(4)
      expect(stages.some((s) => s.includes('Validating'))).toBe(true)
      expect(stages.some((s) => s.includes('period grid'))).toBe(true)
      expect(result.status).toBe('completed')
    })
  })

  describe('Requirement 5, 6, 7 & 8: Outcome Classification & Derived Metrics', () => {
    it('detects potential transit and derives all metrics strictly from AnalysisResult', async () => {
      const points = generateSyntheticLightCurve(3.52, 0.85, 0.008, 2.4, 25, 30)
      const result = await runTransitDetection(
        mockStar,
        points,
        { minPeriodDays: 0.5, maxPeriodDays: 20.0, snrThreshold: 6.5 }
      )

      expect(result.status).toBe('completed')
      expect(result.transitEvents.length).toBeGreaterThanOrEqual(1)
      expect(result.bestCandidate).toBeDefined()
      expect(result.bestCandidate?.period).toBeCloseTo(3.52, 0.2)
      expect(result.bestCandidate?.depthPpm).toBeGreaterThan(1000)
      expect(result.bestCandidate?.snr).toBeGreaterThanOrEqual(6.5)

      const outcome = determineOutcome(result)
      expect(outcome.type).toBe('POTENTIAL_TRANSIT')
      expect(outcome.label).toBe('Potential Transit Detected')
      expect(outcome.badgeVariant).toBe('success')
    })

    it('classifies quiet star as "No convincing transit found" when no dips exceed SNR threshold', async () => {
      const flatPoints = generateFlatLightCurve(20, 30)
      const result = await runTransitDetection(
        { ...mockStar, id: 'CTRL-FLAT', name: 'Flat Control' },
        flatPoints,
        { snrThreshold: 6.5 }
      )

      expect(result.status).toBe('completed')
      expect(result.transitEvents.length).toBe(0)
      expect(result.bestCandidate).toBeUndefined()

      const outcome = determineOutcome(result)
      expect(outcome.type).toBe('NO_TRANSIT')
      expect(outcome.label).toBe('No Convincing Transit Found')
      expect(outcome.badgeVariant).toBe('outline')
    })

    it('classifies noisy/erratic curve as "Inconclusive"', async () => {
      const noisyPoints = generateNoisyLightCurve(8, 30)
      const result = await runTransitDetection(
        { ...mockStar, id: 'NOISE-01', name: 'Flare Host' },
        noisyPoints,
        { snrThreshold: 6.5 }
      )

      const outcome = determineOutcome(result)
      expect(outcome.type).toBe('INCONCLUSIVE')
      expect(outcome.label).toBe('Inconclusive')
      expect(outcome.badgeVariant).toBe('warning')
    })

    it('returns Inconclusive state for undefined or failed results', () => {
      const outcomeNull = determineOutcome(null)
      expect(outcomeNull.type).toBe('INCONCLUSIVE')

      const failedResult: AnalysisResult = {
        id: 'run-failed',
        observationId: 'ERR-01',
        star: mockStar,
        status: 'failed',
        algorithm: 'BLS',
        parameters: {
          algorithm: 'BLS',
          minPeriodDays: 0.5,
          maxPeriodDays: 30,
          periodSteps: 2000,
          durationMinHours: 1,
          durationMaxHours: 16,
          snrThreshold: 6.5
        },
        startedAt: new Date().toISOString(),
        lightCurveSummary: {
          totalPoints: 10,
          durationDays: 1,
          baselineFlux: 1.0,
          rmsNoise: 0.05,
          cadenceMinutes: 30,
          outlierCount: 2
        },
        transitEvents: [],
        errorMessage: 'Baseline calculation exploded.'
      }

      const outcomeFailed = determineOutcome(failedResult)
      expect(outcomeFailed.type).toBe('INCONCLUSIVE')
      expect(outcomeFailed.badgeVariant).toBe('warning')
    })
  })
})
