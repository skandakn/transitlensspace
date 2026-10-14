import type { LightCurvePoint, ModelFitParameters } from '../../../types'
export type { LightCurvePoint, ModelFitParameters }

/**
 * Raw point input format supported by the transit detection pipeline.
 */
export interface RawDataPoint {
  time: number
  flux: number
  fluxError?: number
}

/**
 * Validated, cleaned, and chronologically sorted photometric point.
 */
export interface ValidatedPoint {
  time: number
  flux: number
  fluxError?: number
}

/**
 * Normalized point with baseline subtraction and relative flux centering around 1.0.
 */
export interface NormalizedPoint extends ValidatedPoint {
  normalizedFlux: number
  isOutlier: boolean
}

/**
 * Detected single candidate dip interval prior to periodicity search.
 */
export interface DipInterval {
  id: string
  startIndex: number
  endIndex: number
  startTime: number
  endTime: number
  centerTime: number
  durationHours: number
  minFlux: number
  depthFraction: number
  depthPpm: number
  snr: number
  pointsCount: number
}

/**
 * Configuration options for the transit detection pipeline.
 */
export interface TransitDetectionOptions {
  /** Minimum period in days to search (default: 0.5) */
  minPeriodDays?: number
  /** Maximum period in days to search (default: 30.0) */
  maxPeriodDays?: number
  /** Number of test periods in frequency grid (default: 2000) */
  periodGridSteps?: number
  /** Dip detection threshold in sigma units below baseline (default: 2.5) */
  dipSigmaThreshold?: number
  /** Minimum points required to constitute a valid transit dip (default: 2) */
  minPointsPerDip?: number
  /** Maximum expected transit duration in hours (default: 16.0) */
  maxDurationHours?: number
  /** Minimum SNR required to consider a signal statistically significant (default: 7.1) */
  minSnrThreshold?: number
  /** Remove statistical outliers during baseline estimation (default: true) */
  removeOutliers?: boolean
  /** Outlier threshold in sigma units (default: 4.5) */
  outlierSigma?: number
}

/**
 * Component-by-component breakdown of the confidence calculation.
 */
export interface ConfidenceBreakdown {
  transitCountScore: number      // Weight from observed repetitions (0 - 30)
  snrScore: number               // Weight from folded signal-to-noise ratio (0 - 35)
  phaseCoverageScore: number     // Weight from transit shape and phase sampling (0 - 20)
  depthParityScore: number       // Weight from even/odd transit depth parity (0 - 15)
  eclipsingBinaryPenalty: number // Penalty if alternating depths indicate binary star (-30 to 0)
  totalConfidence: number        // Clamped final confidence percentage (0 to 100)
}

/**
 * Final disposition classification:
 * Per scientific protocol, the browser algorithm identifies CANDIDATE or FALSE_POSITIVE signals,
 * but never automatically stamps CONFIRMED (which requires radial-velocity or multi-year follow-up).
 */
export type DetectionDisposition = 'CANDIDATE' | 'FALSE_POSITIVE' | 'INCONCLUSIVE'

/**
 * Overall outcome status of the transit detection pipeline.
 */
export type DetectionStatus = 'completed' | 'inconclusive' | 'failed'

/**
 * Comprehensive output contract returned by the TransitLens detection pipeline.
 */
export interface TransitDetectionOutput {
  status: DetectionStatus
  disposition: DetectionDisposition
  isPeriodic: boolean
  
  /** Estimated orbital period in days (if periodic signal detected) */
  estimatedPeriodDays?: number
  /** Approximate uncertainty in estimated period */
  periodErrorDays?: number
  /** Mid-transit reference epoch (time of primary transit center) */
  epoch?: number
  /** Transit duration in hours */
  durationHours?: number
  
  /** Transit depth metrics */
  depth?: {
    fraction: number
    ppm: number
  }
  
  /** Signal-to-noise ratio of detected transit feature */
  snr?: number
  
  /** Confidence score between 0 and 100 */
  confidenceScore: number
  /** Normalized quality score between 0.0 and 1.0 */
  qualityScore: number
  /** Step-by-step mathematical explanation of the confidence and quality calculation */
  scoreExplanation: string
  
  /** All individual dips identified in the time series */
  detectedDips: DipInterval[]
  
  /** Dips that align with the detected periodic ephemeris */
  periodicDips: DipInterval[]
  
  /** Baseline and noise statistics */
  statistics: {
    totalPointsEvaluated: number
    validPointsCount: number
    timeSpanDays: number
    rawMedianFlux: number
    baselineFlux: number
    noiseRms: number
    mad: number
    outliersRemoved: number
  }
  
  /** Full diagnostic summary string */
  diagnosticSummary: string
  /** Explicit reason when analysis is inconclusive */
  inconclusiveReason?: string
  
  /** Folded light curve points at the detected or candidate period */
  foldedPoints?: LightCurvePoint[]
  /** Fitted box / transit parameters */
  modelFit?: ModelFitParameters
}
