import { describe, it, expect } from 'vitest'
import { PREDEFINED_OBSERVATIONS } from '../../../data/observations'
import { runTransitDetection, validateObservationData, DEFAULT_PARAMETERS } from '../transitDetection'
import { determineOutcome } from '../outcomeUtils'
import { parseAndValidateLightCurve, generateSampleCsvContent } from '../../upload/csvParser'

describe('Judge Demonstration Flow & Workflow Integration Suite (Member 7)', () => {
  describe('1. Known Planetary Transit Example (TOI-700)', () => {
    const toi700 = PREDEFINED_OBSERVATIONS.find((o) => o.id === 'TOI-700')!

    it('successfully loads observation with sufficient photometric cadences', () => {
      expect(toi700).toBeDefined()
      expect(toi700.lightCurve.length).toBeGreaterThanOrEqual(15)
      expect(toi700.expectedOutcome).toBe('POTENTIAL_TRANSIT')
    })

    it('passes input validation with valid: true', () => {
      const validation = validateObservationData(toi700.star, toi700.lightCurve)
      expect(validation.valid).toBe(true)
      expect(validation.reason).toBeUndefined()
    })

    it('executes transit detection and confirms a periodic transit candidate with high SNR', async () => {
      const result = await runTransitDetection(toi700.star, toi700.lightCurve, DEFAULT_PARAMETERS)

      expect(result.status).toBe('completed')
      expect(result.transitEvents.length).toBeGreaterThan(0)
      expect(result.bestCandidate).toBeDefined()

      const candidate = result.bestCandidate!
      // Recovers period near 3.74 days (within tolerance)
      expect(candidate.period).toBeGreaterThan(3.0)
      expect(candidate.period).toBeLessThan(4.5)

      // Strong signal exceeding 7.1σ threshold
      expect(candidate.snr).toBeGreaterThanOrEqual(7.1)
      expect(candidate.disposition).toBe('CANDIDATE')

      // Verifies transit intervals are populated for chart highlights
      expect(result.detectedIntervals).toBeDefined()
      expect(result.detectedIntervals!.length).toBeGreaterThan(0)

      // Verifies model fit parameters
      expect(result.modelFit).toBeDefined()
      expect(result.modelFit?.reducedChiSquare).toBeGreaterThan(0)

      // Outcome categorization matches judge expectation
      const outcome = determineOutcome(result)
      expect(outcome.type).toBe('POTENTIAL_TRANSIT')
      expect(outcome.headline).toContain('Potential Transit')
    })
  })

  describe('2. Flat Baseline Control Star (HD-219134)', () => {
    const hd219134 = PREDEFINED_OBSERVATIONS.find((o) => o.id === 'HD-219134')!

    it('loads quiet control star with expected NO_TRANSIT classification', () => {
      expect(hd219134).toBeDefined()
      expect(hd219134.category).toBe('flat')
      expect(hd219134.expectedOutcome).toBe('NO_TRANSIT')
    })

    it('correctly classifies flat baseline as "No convincing transit found"', async () => {
      const result = await runTransitDetection(hd219134.star, hd219134.lightCurve, DEFAULT_PARAMETERS)

      expect(result.status).toBe('completed')
      if (result.bestCandidate) {
        expect(result.bestCandidate.snr).toBeLessThan(DEFAULT_PARAMETERS.snrThreshold)
      }

      // Outcome should be NO_TRANSIT
      const outcome = determineOutcome(result)
      expect(outcome.type).toBe('NO_TRANSIT')
      expect(outcome.headline).toContain('No Convincing Transit')
      expect(outcome.badgeVariant).toBe('outline')

      // Photometric summary confirms quiet scatter
      expect(result.lightCurveSummary.rmsNoise).toBeLessThan(0.002)
    })
  })

  describe('3. High Noise Flare Star (Proxima Centauri)', () => {
    const proxima = PREDEFINED_OBSERVATIONS.find((o) => o.id === 'Proxima-Centauri')!

    it('loads flare star observation with noisy category', () => {
      expect(proxima).toBeDefined()
      expect(proxima.category).toBe('noisy')
    })

    it('handles high dispersion and stochastic flares by classifying as Inconclusive', async () => {
      const result = await runTransitDetection(proxima.star, proxima.lightCurve, DEFAULT_PARAMETERS)

      expect(result.status).toBe('completed')
      // Elevated noise floor should prevent confident transit detection
      expect(result.lightCurveSummary.rmsNoise).toBeGreaterThan(0.002)

      const outcome = determineOutcome(result)
      expect(outcome.type).toBe('INCONCLUSIVE')
      expect(outcome.headline).toContain('Inconclusive')
    })
  })

  describe('4. Input Validation & Diagnostic Error Handling (< 15 Cadences)', () => {
    const sparseObs = PREDEFINED_OBSERVATIONS.find((o) => o.id === 'Sparse-Cadence')!

    it('rejects under-sampled observation (< 15 points) with descriptive reason', () => {
      expect(sparseObs).toBeDefined()
      expect(sparseObs.lightCurve.length).toBeLessThan(15)

      const validation = validateObservationData(sparseObs.star, sparseObs.lightCurve)
      expect(validation.valid).toBe(false)
      expect(validation.reason).toContain('minimum 15 required')
    })

    it('rejects null, empty, or undefined light curve arrays', () => {
      const emptyValidation = validateObservationData(sparseObs.star, [])
      expect(emptyValidation.valid).toBe(false)
      expect(emptyValidation.reason).toContain('minimum 15 required')
    })
  })

  describe('5. CSV Upload Validation & Error Handling Engine', () => {
    it('successfully parses standard comma-delimited time,flux,flux_err CSV', () => {
      const csvText = `time,flux,flux_err\n0.00,1.0002,0.0007\n0.02,0.9998,0.0007\n0.04,1.0001,0.0007\n0.06,0.9999,0.0007\n0.08,1.0000,0.0007\n0.10,1.0003,0.0007`
      const result = parseAndValidateLightCurve(csvText, 'test.csv')

      expect(result.success).toBe(true)
      expect(result.points.length).toBe(6)
      expect(result.points[0].time).toBe(0.0)
      expect(result.points[0].flux).toBe(1.0002)
      expect(result.points[0].fluxError).toBe(0.0007)
      expect(result.detectedDelimiter).toBe('CSV')
    })

    it('successfully parses tab-delimited TSV data with BJD and PDCSAP_FLUX headers', () => {
      const tsvText = `BJD\tPDCSAP_FLUX\n2458000.1\t1.0005\n2458000.2\t0.9994\n2458000.3\t1.0001\n2458000.4\t0.9999\n2458000.5\t1.0002`
      const result = parseAndValidateLightCurve(tsvText, 'tess_data.tsv')

      expect(result.success).toBe(true)
      expect(result.points.length).toBe(5)
      expect(result.detectedDelimiter).toBe('TSV')
      expect(result.stats?.minTime).toBe(2458000.1)
    })

    it('rejects empty or whitespace-only files with clear error message', () => {
      const result = parseAndValidateLightCurve('   \n  \n  ', 'empty.csv')
      expect(result.success).toBe(false)
      expect(result.points.length).toBe(0)
      expect(result.error).toContain('completely empty')
    })

    it('rejects files containing only comments or headers without data rows', () => {
      const commentOnly = '# Header comment 1\n# Header comment 2\n// Another comment'
      const result = parseAndValidateLightCurve(commentOnly, 'comments_only.csv')
      expect(result.success).toBe(false)
      expect(result.error).toContain('zero data rows')
    })

    it('rejects malformed non-numeric text files', () => {
      const malformedText = `header_a,header_b\napple,banana\norange,grape`
      const result = parseAndValidateLightCurve(malformedText, 'corrupt.csv')
      expect(result.success).toBe(false)
      expect(result.error).toContain('did not contain any valid numerical')
    })

    it('automatically sorts out-of-order timestamps and emits a warning', () => {
      const unsorted = `time,flux\n2.0,1.0000\n0.0,1.0002\n1.0,0.9998\n4.0,1.0001\n3.0,0.9999`
      const result = parseAndValidateLightCurve(unsorted, 'unsorted.csv')

      expect(result.success).toBe(true)
      expect(result.points[0].time).toBe(0.0)
      expect(result.points[1].time).toBe(1.0)
      expect(result.points[4].time).toBe(4.0)
      expect(result.warnings.some((w) => w.includes('chronological'))).toBe(true)
    })

    it('filters out negative or zero flux rows', () => {
      const withNegativeFlux = `time,flux\n0.0,1.0002\n1.0,-0.5000\n2.0,0.0000\n3.0,0.9998\n4.0,1.0001\n5.0,1.0000\n6.0,1.0002`
      const result = parseAndValidateLightCurve(withNegativeFlux, 'negative_flux.csv')

      expect(result.success).toBe(true)
      expect(result.points.length).toBe(5)
      expect(result.stats?.skippedRows).toBe(2)
    })

    it('emits a warning when cadences are between 5 and 14 (< 15 threshold)', () => {
      const sparse = `time,flux\n0.0,1.0001\n1.0,0.9998\n2.0,1.0002\n3.0,0.9999\n4.0,1.0000\n5.0,0.9997`
      const result = parseAndValidateLightCurve(sparse, 'sparse.csv')

      expect(result.success).toBe(true)
      expect(result.points.length).toBe(6)
      expect(result.warnings.some((w) => w.includes('requires at least 15 cadences'))).toBe(true)
    })
  })

  describe('6. Sample Data Generator for Judge Live Testing', () => {
    it('generates a valid, parseable Known Transit sample CSV', () => {
      const sample = generateSampleCsvContent('transit')
      expect(sample.filename).toBe('toi_700_sample_photometry.csv')

      const parsed = parseAndValidateLightCurve(sample.content, sample.filename)
      expect(parsed.success).toBe(true)
      expect(parsed.points.length).toBeGreaterThanOrEqual(15)
      expect(parsed.stats?.durationDays).toBeGreaterThan(5)
    })

    it('generates a valid, parseable Flat Control sample CSV', () => {
      const sample = generateSampleCsvContent('flat')
      expect(sample.filename).toBe('hd_219134_flat_control.csv')

      const parsed = parseAndValidateLightCurve(sample.content, sample.filename)
      expect(parsed.success).toBe(true)
      expect(parsed.points.length).toBeGreaterThanOrEqual(15)
    })

    it('generates a malformed CSV that correctly triggers validation error handling', () => {
      const sample = generateSampleCsvContent('malformed')
      const parsed = parseAndValidateLightCurve(sample.content, sample.filename)
      expect(parsed.success).toBe(false)
      expect(parsed.error).toBeDefined()
    })

    it('generates a sparse CSV that correctly triggers the under-sampled warning', () => {
      const sample = generateSampleCsvContent('sparse')
      const parsed = parseAndValidateLightCurve(sample.content, sample.filename)
      expect(parsed.success).toBe(true)
      expect(parsed.points.length).toBeLessThan(15)
      expect(parsed.warnings.length).toBeGreaterThan(0)
    })
  })
})
