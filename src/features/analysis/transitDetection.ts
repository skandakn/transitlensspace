/**
 * TransitLens - Algorithmic Transit Detection Engine
 * Coordinated Interface: Member 5 (Algorithm Lead) & Member 6 (Analysis Experience Lead)
 * 
 * Directly connects the interactive UI workflow to Member 5's detectTransits pipeline.
 * All metrics returned are strictly calculated by Member 5's mathematical algorithms.
 */

import type {
  StarObservation,
  LightCurvePoint,
  AnalysisParameters,
  AnalysisResult,
  AnalysisProgress
} from '../../types'
import {
  detectTransits,
  detectionOutputToAnalysisResult,
  type TransitDetectionOutput
} from './detection'

export {
  detectTransits,
  detectionOutputToAnalysisResult,
  type TransitDetectionOutput
}

export const DEFAULT_PARAMETERS: AnalysisParameters = {
  algorithm: 'BLS',
  minPeriodDays: 0.5,
  maxPeriodDays: 30.0,
  periodSteps: 2000,
  durationMinHours: 0.5,
  durationMaxHours: 16.0,
  snrThreshold: 6.5,
  detrendingWindowDays: 1.5,
  removeOutliers: true,
  outlierSigma: 4.5
}

/**
 * Validate that observation and light curve data are sufficient for detection.
 */
export function validateObservationData(
  star: StarObservation,
  lightCurve: LightCurvePoint[]
): { valid: boolean; reason?: string } {
  if (!star || !star.id || star.id === '—') {
    return { valid: false, reason: 'Target star identifier is missing or unselected.' }
  }

  if (!Array.isArray(lightCurve) || lightCurve.length < 15) {
    return {
      valid: false,
      reason: `Insufficient photometric data points (${lightCurve?.length || 0} provided, minimum 15 required).`
    }
  }

  const validPoints = lightCurve.filter(
    (p) => typeof p.time === 'number' && !isNaN(p.time) && typeof p.flux === 'number' && !isNaN(p.flux) && p.flux > 0
  )

  if (validPoints.length < 15) {
    return {
      valid: false,
      reason: 'Photometric series contains corrupted or non-numeric time/flux entries.'
    }
  }

  return { valid: true }
}

/**
 * Generate a flat light curve without any transit dips (for negative control testing).
 */
export function generateFlatLightCurve(numDays = 20, cadenceMinutes = 30): LightCurvePoint[] {
  const points: LightCurvePoint[] = []
  const stepDays = cadenceMinutes / (24 * 60)
  const totalSteps = Math.floor(numDays / stepDays)
  for (let i = 0; i < totalSteps; i++) {
    const time = parseFloat((i * stepDays).toFixed(4))
    const noise = (Math.random() - 0.5) * 0.0006
    points.push({
      time,
      flux: parseFloat((1.0 + noise).toFixed(6)),
      fluxError: 0.0003,
      isTransit: false,
      isOutlier: false
    })
  }
  return points
}

/**
 * Generate a noisy/erratic light curve (for inconclusive detection testing).
 */
export function generateNoisyLightCurve(numDays = 8, cadenceMinutes = 30): LightCurvePoint[] {
  const points: LightCurvePoint[] = []
  const stepDays = cadenceMinutes / (24 * 60)
  const totalSteps = Math.floor(numDays / stepDays)
  for (let i = 0; i < totalSteps; i++) {
    const time = parseFloat((i * stepDays).toFixed(4))
    // High non-periodic scatter
    const noise = (Math.random() - 0.5) * 0.016
    const isOutlier = Math.random() < 0.07
    points.push({
      time,
      flux: parseFloat((1.0 + noise + (isOutlier ? 0.03 : 0)).toFixed(6)),
      fluxError: 0.005,
      isTransit: false,
      isOutlier
    })
  }
  return points
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * User-facing analysis orchestrator that calls Member 5's detectTransits algorithm.
 */
export async function runTransitDetection(
  star: StarObservation,
  lightCurve: LightCurvePoint[],
  customParams?: Partial<AnalysisParameters>,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<AnalysisResult> {
  const startTime = Date.now()
  const params: AnalysisParameters = { ...DEFAULT_PARAMETERS, ...customParams }

  // 1. Validation Stage
  const validation = validateObservationData(star, lightCurve)
  if (!validation.valid) {
    throw new Error(validation.reason || 'Invalid observation data for transit detection.')
  }

  onProgress?.({
    status: 'running',
    progressPercent: 15,
    currentStage: 'Validating photometric time series & removing corrupted cadences...',
    elapsedTimeMs: Date.now() - startTime
  })
  await delay(200)

  // 2. Baseline & Detrending Stage
  onProgress?.({
    status: 'running',
    progressPercent: 40,
    currentStage: 'Computing median baseline & filtering 4.5σ outliers...',
    elapsedTimeMs: Date.now() - startTime
  })
  await delay(250)

  // 3. Dip Detection & BLS Period Search Stage
  onProgress?.({
    status: 'running',
    progressPercent: 70,
    currentStage: `Scanning ${params.algorithm} period grid (${params.minPeriodDays}d - ${params.maxPeriodDays}d)...`,
    elapsedTimeMs: Date.now() - startTime
  })
  await delay(300)

  // Call Member 5's actual transit-detection function
  const detectionOutput: TransitDetectionOutput = detectTransits(lightCurve, {
    minPeriodDays: params.minPeriodDays,
    maxPeriodDays: params.maxPeriodDays,
    periodGridSteps: params.periodSteps,
    minSnrThreshold: params.snrThreshold,
    removeOutliers: params.removeOutliers,
    outlierSigma: params.outlierSigma
  })

  // 4. Astrophysical Candidate Vetting Stage
  onProgress?.({
    status: 'running',
    progressPercent: 90,
    currentStage: 'Evaluating transit confidence, phase coverage & odd/even parity...',
    elapsedTimeMs: Date.now() - startTime
  })
  await delay(150)

  // Adapt to shared AnalysisResult contract
  const result: AnalysisResult = detectionOutputToAnalysisResult(
    detectionOutput,
    star,
    `run-${star.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`
  )

  const executionTimeMs = Date.now() - startTime
  result.executionTimeMs = executionTimeMs
  result.startedAt = new Date(startTime).toISOString()
  result.completedAt = new Date().toISOString()
  result.parameters = params

  if (detectionOutput.status === 'failed') {
    result.status = 'failed'
    result.errorMessage = detectionOutput.inconclusiveReason || 'Analysis failed during baseline estimation.'
  } else {
    result.status = 'completed'
  }

  onProgress?.({
    status: result.status,
    progressPercent: 100,
    currentStage: 'Analysis complete',
    elapsedTimeMs: executionTimeMs
  })

  return result
}
