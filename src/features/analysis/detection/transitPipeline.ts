import type {
  TransitDetectionOptions,
  TransitDetectionOutput,
  RawDataPoint
} from './types'
import { validateAndSortPoints } from './validation'
import { normalizeAndEstimateBaseline } from './normalization'
import { detectCandidateDips } from './dipDetector'
import { searchPeriodPatterns } from './periodSearch'
import { computeConfidenceAndQuality } from './confidenceScorer'

/**
 * Executes the complete, deterministic browser-side transit detection pipeline.
 * 
 * Pipeline Phases:
 * 1. Validate, filter corrupted data, and sort points chronologically.
 * 2. Calculate robust median baseline and MAD noise floor. Normalize flux to 1.0.
 * 3. Detect candidate brightness dip intervals exceeding statistical threshold.
 * 4. Perform BLS period grid search & pairwise ephemeris clustering.
 * 5. Compute deterministic confidence & quality scores with step-by-step mathematical explanation.
 * 6. Return comprehensive telemetry, candidate status, or explicit inconclusive diagnosis.
 *
 * @param inputMeasurements Raw array of { time, flux, fluxError? } observations.
 * @param options User or mission configuration parameters.
 * @returns TransitDetectionOutput contract with full diagnostic payload.
 */
export function detectTransits(
  inputMeasurements: unknown,
  options: TransitDetectionOptions = {}
): TransitDetectionOutput {
  // Phase 1: Input Validation & Cleaning
  const validation = validateAndSortPoints(inputMeasurements)
  if (!validation.isValid) {
    return {
      status: 'inconclusive',
      disposition: 'INCONCLUSIVE',
      isPeriodic: false,
      confidenceScore: 0,
      qualityScore: 0,
      scoreExplanation: 'Analysis could not proceed: input data failed preliminary validation.',
      detectedDips: [],
      periodicDips: [],
      statistics: {
        totalPointsEvaluated: Array.isArray(inputMeasurements) ? inputMeasurements.length : 0,
        validPointsCount: validation.points.length,
        timeSpanDays: 0,
        rawMedianFlux: 0,
        baselineFlux: 1.0,
        noiseRms: 0,
        mad: 0,
        outliersRemoved: validation.droppedCount
      },
      diagnosticSummary: `Validation rejected: ${validation.error}`,
      inconclusiveReason: validation.error
    }
  }

  const validPoints = validation.points
  const timeSpan = validPoints[validPoints.length - 1].time - validPoints[0].time

  // Phase 2: Normalization & Robust Baseline Estimation
  let normOutput
  try {
    normOutput = normalizeAndEstimateBaseline(
      validPoints,
      options.removeOutliers !== false,
      options.outlierSigma || 4.5
    )
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Baseline estimation failure'
    return {
      status: 'failed',
      disposition: 'INCONCLUSIVE',
      isPeriodic: false,
      confidenceScore: 0,
      qualityScore: 0,
      scoreExplanation: `Normalization error: ${errorMsg}`,
      detectedDips: [],
      periodicDips: [],
      statistics: {
        totalPointsEvaluated: validPoints.length,
        validPointsCount: validPoints.length,
        timeSpanDays: timeSpan,
        rawMedianFlux: 0,
        baselineFlux: 1.0,
        noiseRms: 0,
        mad: 0,
        outliersRemoved: 0
      },
      diagnosticSummary: `Normalization aborted: ${errorMsg}`,
      inconclusiveReason: errorMsg
    }
  }

  const { points: normalizedPoints, rawMedianFlux, baselineFlux, noiseRms, mad, outlierCount } = normOutput

  // Phase 3: Candidate Dip Detection
  const dips = detectCandidateDips(
    normalizedPoints,
    baselineFlux,
    noiseRms,
    {
      dipSigmaThreshold: options.dipSigmaThreshold || 2.2,
      minPointsPerDip: options.minPointsPerDip || 2,
      maxDurationHours: options.maxDurationHours || 18.0
    }
  )

  // Edge case: Flat curve / no dips detected
  if (dips.length === 0) {
    return {
      status: 'inconclusive',
      disposition: 'INCONCLUSIVE',
      isPeriodic: false,
      confidenceScore: 0,
      qualityScore: 0,
      scoreExplanation: [
        'Confidence Score: 0/100 (Quality: 0.00).',
        `• Noise floor measured at RMS = ${noiseRms.toFixed(6)} (MAD = ${mad.toFixed(6)}).`,
        '• Light curve is flat: zero contiguous data points dropped below the statistical detection threshold.',
        '• Result: Inconclusive (no evidence of transiting body).'
      ].join('\n'),
      detectedDips: [],
      periodicDips: [],
      statistics: {
        totalPointsEvaluated: validPoints.length + validation.droppedCount,
        validPointsCount: validPoints.length,
        timeSpanDays: parseFloat(timeSpan.toFixed(3)),
        rawMedianFlux,
        baselineFlux,
        noiseRms,
        mad,
        outliersRemoved: outlierCount + validation.droppedCount
      },
      diagnosticSummary: `Flat curve observed over ${timeSpan.toFixed(2)} days with RMS noise of ${noiseRms.toFixed(5)}. No dips found.`,
      inconclusiveReason: 'Flat light curve: no statistically significant photometric flux dips detected below threshold.'
    }
  }

  // Phase 4: Periodic Pattern Search (BLS & Ephemeris Matching)
  const periodResult = searchPeriodPatterns(
    dips,
    normalizedPoints,
    baselineFlux,
    {
      minPeriodDays: options.minPeriodDays || 0.5,
      maxPeriodDays: options.maxPeriodDays || Math.min(30.0, timeSpan * 0.9),
      periodGridSteps: options.periodGridSteps || 1600,
      noiseSigma: noiseRms
    }
  )

  // Phase 5: Confidence & Quality Scoring
  const scoring = computeConfidenceAndQuality({
    matchedDips: periodResult.matchedDips,
    allDips: dips,
    foldedSnr: periodResult.foldedSnr || 0,
    depthFraction: periodResult.bestDepthFraction || 0,
    noiseSigma: noiseRms,
    isPeriodic: periodResult.isPeriodic,
    inTransitPointsCount: periodResult.foldedPoints
      ? periodResult.foldedPoints.filter((p) => p.isTransit).length
      : 0,
    totalPointsCount: validPoints.length
  })

  // Phase 6: Final Outcome Evaluation
  const minSnrRequired = options.minSnrThreshold || 6.5
  const hasStrongSignal = (periodResult.foldedSnr || 0) >= minSnrRequired && periodResult.isPeriodic

  let status: 'completed' | 'inconclusive' = 'completed'
  let inconclusiveReason: string | undefined = undefined

  if (!periodResult.isPeriodic) {
    status = 'inconclusive'
    inconclusiveReason = `Non-periodic signal: identified ${dips.length} candidate dip(s), but timestamps do not follow a regular orbital period.`
  } else if (!hasStrongSignal && scoring.confidenceScore < 45) {
    status = 'inconclusive'
    inconclusiveReason = `Low signal-to-noise ratio: folded SNR of ${(periodResult.foldedSnr || 0).toFixed(1)}σ is below the detection threshold (${minSnrRequired}σ).`
  }

  const diagnosticSummary = periodResult.isPeriodic
    ? `Periodic candidate detected: P = ${periodResult.bestPeriodDays}d, Depth = ${periodResult.bestDepthPpm} ppm, SNR = ${periodResult.foldedSnr}σ with ${periodResult.matchedDips.length} aligned transit(s). Disposition: ${scoring.disposition}.`
    : `Inconclusive analysis: ${inconclusiveReason || 'Insufficient periodic evidence.'}`

  return {
    status,
    disposition: scoring.disposition,
    isPeriodic: periodResult.isPeriodic,
    estimatedPeriodDays: periodResult.bestPeriodDays,
    periodErrorDays: periodResult.periodErrorDays,
    epoch: periodResult.bestEpoch,
    durationHours: periodResult.bestDurationHours,
    depth: periodResult.bestDepthFraction
      ? {
          fraction: periodResult.bestDepthFraction,
          ppm: periodResult.bestDepthPpm || Math.round(periodResult.bestDepthFraction * 1_000_000)
        }
      : undefined,
    snr: periodResult.foldedSnr,
    confidenceScore: scoring.confidenceScore,
    qualityScore: scoring.qualityScore,
    scoreExplanation: scoring.scoreExplanation,
    detectedDips: dips,
    periodicDips: periodResult.matchedDips,
    statistics: {
      totalPointsEvaluated: validPoints.length + validation.droppedCount,
      validPointsCount: validPoints.length,
      timeSpanDays: parseFloat(timeSpan.toFixed(3)),
      rawMedianFlux,
      baselineFlux,
      noiseRms,
      mad,
      outliersRemoved: outlierCount + validation.droppedCount
    },
    diagnosticSummary,
    inconclusiveReason,
    foldedPoints: periodResult.foldedPoints,
    modelFit: periodResult.modelFit
  }
}
