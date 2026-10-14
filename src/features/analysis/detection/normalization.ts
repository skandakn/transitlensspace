import type { ValidatedPoint, NormalizedPoint } from './types'

export interface NormalizationOutput {
  points: NormalizedPoint[]
  rawMedianFlux: number
  baselineFlux: number
  noiseRms: number
  mad: number
  outlierCount: number
}

/**
 * Calculates the exact median of a number array without mutating original array.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

/**
 * Calculates Median Absolute Deviation (MAD) and converts to robust standard deviation:
 * sigma = 1.4826 * MAD for normally distributed noise.
 */
export function calculateMAD(values: number[], median: number): { mad: number; robustSigma: number } {
  if (values.length === 0) return { mad: 0, robustSigma: 0 }
  const absoluteDeviations = values.map((v) => Math.abs(v - median))
  const mad = calculateMedian(absoluteDeviations)
  const robustSigma = 1.4826 * mad
  return { mad, robustSigma }
}

/**
 * Normalizes brightness time series around 1.0 and calculates robust noise metrics.
 */
export function normalizeAndEstimateBaseline(
  points: ValidatedPoint[],
  removeOutliers = true,
  outlierSigma = 4.5
): NormalizationOutput {
  const rawFluxes = points.map((p) => p.flux)
  const rawMedian = calculateMedian(rawFluxes)

  if (rawMedian <= 0) {
    throw new Error('Baseline calculation failed: median flux must be positive.')
  }

  // Pre-normalize all flux values by the median
  const preNormalized = points.map((p) => ({
    ...p,
    normalizedFlux: p.flux / rawMedian,
    isOutlier: false
  }))

  const normalizedFluxes = preNormalized.map((p) => p.normalizedFlux)
  const normMedian = calculateMedian(normalizedFluxes)
  const { mad, robustSigma } = calculateMAD(normalizedFluxes, normMedian)

  // Use robust sigma as noise floor; fallback to standard deviation if MAD is exceptionally small
  let noiseFloor = robustSigma
  if (noiseFloor <= 0) {
    const mean = normalizedFluxes.reduce((sum, val) => sum + val, 0) / normalizedFluxes.length
    const variance = normalizedFluxes.reduce((sum, val) => sum + (val - mean) ** 2, 0) / normalizedFluxes.length
    noiseFloor = Math.sqrt(variance) || 0.0005
  }

  // Identify stellar flares / cosmic ray outliers if requested
  let outlierCount = 0
  const normalizedPoints: NormalizedPoint[] = preNormalized.map((pt, idx) => {
    const deviation = pt.normalizedFlux - normMedian
    let isOutlier = false

    if (removeOutliers) {
      // 1. Upward stellar flares (> outlierSigma * noiseFloor)
      if (deviation > outlierSigma * noiseFloor) {
        isOutlier = true
      }
      // 2. Extreme downward single-cadence spikes (> 12.0 sigma with normal neighbors)
      else if (deviation < -12.0 * noiseFloor) {
        const prev = preNormalized[idx - 1]
        const next = preNormalized[idx + 1]
        const prevNormal = !prev || Math.abs(prev.normalizedFlux - normMedian) < 3.0 * noiseFloor
        const nextNormal = !next || Math.abs(next.normalizedFlux - normMedian) < 3.0 * noiseFloor
        if (prevNormal && nextNormal) {
          isOutlier = true
        }
      }
    }

    if (isOutlier) outlierCount++
    return {
      ...pt,
      isOutlier
    }
  })

  // Compute clean RMS noise from non-outlier points
  const cleanPoints = normalizedPoints.filter((p) => !p.isOutlier)
  const cleanFluxes = cleanPoints.length > 0 ? cleanPoints.map((p) => p.normalizedFlux) : normalizedFluxes
  const sumSquaredDev = cleanFluxes.reduce((acc, val) => acc + (val - normMedian) ** 2, 0)
  const noiseRms = Math.sqrt(sumSquaredDev / cleanFluxes.length) || noiseFloor

  return {
    points: normalizedPoints,
    rawMedianFlux: rawMedian,
    baselineFlux: normMedian,
    noiseRms,
    mad,
    outlierCount
  }
}
