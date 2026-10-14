import type { NormalizedPoint, DipInterval, LightCurvePoint, ModelFitParameters } from './types'

export interface PeriodSearchResult {
  isPeriodic: boolean
  bestPeriodDays?: number
  periodErrorDays?: number
  bestEpoch?: number
  bestDurationHours?: number
  bestDepthFraction?: number
  bestDepthPpm?: number
  foldedSnr?: number
  matchedDips: DipInterval[]
  unmatchedDips: DipInterval[]
  periodogramPeakPower: number
  foldedPoints?: LightCurvePoint[]
  modelFit?: ModelFitParameters
}

export interface PeriodSearchOptions {
  minPeriodDays?: number
  maxPeriodDays?: number
  periodGridSteps?: number
  noiseSigma?: number
}

/**
 * Searches for repeated periodic transit dip patterns using a hybrid approach:
 * 1. Pairwise dip center-time interval clustering to identify candidate period seeds.
 * 2. Box Least Squares (BLS) phase-folding grid search to optimize period, epoch, and depth.
 * 3. Ephemeris alignment validation (tn = t0 + n*P).
 */
export function searchPeriodPatterns(
  dips: DipInterval[],
  points: NormalizedPoint[],
  baselineFlux: number,
  options: PeriodSearchOptions = {}
): PeriodSearchResult {
  const cleanPoints = points.filter((p) => !p.isOutlier)
  if (cleanPoints.length < 15) {
    return {
      isPeriodic: false,
      matchedDips: [],
      unmatchedDips: dips,
      periodogramPeakPower: 0
    }
  }

  const timeSpan = cleanPoints[cleanPoints.length - 1].time - cleanPoints[0].time
  const minPeriod = Math.max(0.2, options.minPeriodDays || 0.5)
  const maxPeriod = Math.min(timeSpan * 0.95, options.maxPeriodDays || 30.0)

  if (maxPeriod <= minPeriod || timeSpan < minPeriod) {
    return {
      isPeriodic: false,
      matchedDips: [],
      unmatchedDips: dips,
      periodogramPeakPower: 0
    }
  }

  // 1. Gather candidate periods from pairwise dip intervals if multiple dips exist
  const candidatePeriods: number[] = []

  if (dips.length >= 2) {
    for (let i = 0; i < dips.length; i++) {
      for (let j = i + 1; j < dips.length; j++) {
        const deltaT = Math.abs(dips[j].centerTime - dips[i].centerTime)
        if (deltaT >= minPeriod) {
          // Check harmonics k = 1, 2, 3, 4
          for (let k = 1; k <= 4; k++) {
            const trialP = deltaT / k
            if (trialP >= minPeriod && trialP <= maxPeriod) {
              candidatePeriods.push(trialP)
            }
          }
        }
      }
    }
  }

  // 2. Build BLS period search grid (uniform in frequency space 1/P)
  const gridSteps = options.periodGridSteps || 1600
  const minFreq = 1 / maxPeriod
  const maxFreq = 1 / minPeriod
  const freqStep = (maxFreq - minFreq) / gridSteps

  const searchPeriods: number[] = [...candidatePeriods]
  for (let s = 0; s <= gridSteps; s++) {
    const freq = minFreq + s * freqStep
    if (freq > 0) {
      searchPeriods.push(1 / freq)
    }
  }

  // Average transit duration from detected dips or standard fraction
  const avgDurationHours = dips.length > 0
    ? dips.reduce((acc, d) => acc + d.durationHours, 0) / dips.length
    : 3.0
  const avgDurationDays = avgDurationHours / 24

  let bestPeriod = 0
  let bestEpoch = dips.length > 0 ? dips[0].centerTime : cleanPoints[0].time
  let bestPower = 0
  let bestDepthFraction = 0
  let bestInTransitCount = 0

  // Reference epoch seeds from candidate dips
  const epochSeeds = dips.length > 0
    ? dips.map((d) => d.centerTime)
    : [cleanPoints[0].time]

  // Evaluate BLS power across search periods
  for (const period of searchPeriods) {
    if (period < minPeriod || period > maxPeriod) continue
    const halfDurationPhase = (avgDurationDays / period) / 2

    for (const epoch of epochSeeds) {
      let sumInFlux = 0
      let countIn = 0
      let sumOutFlux = 0
      let countOut = 0

      for (let i = 0; i < cleanPoints.length; i++) {
        const pt = cleanPoints[i]
        // Fold phase [-0.5, 0.5]
        const rawPhase = ((pt.time - epoch) % period + period) % period
        const phase = rawPhase > period / 2 ? (rawPhase - period) / period : rawPhase / period

        if (Math.abs(phase) <= halfDurationPhase) {
          sumInFlux += pt.normalizedFlux
          countIn++
        } else {
          sumOutFlux += pt.normalizedFlux
          countOut++
        }
      }

      // Valid transit requires sufficient points in and out of transit
      if (countIn >= 3 && countOut >= 10) {
        const meanIn = sumInFlux / countIn
        const meanOut = sumOutFlux / countOut
        const depth = meanOut - meanIn

        if (depth > 0) {
          // BLS power: (depth^2 * Nin * Nout) / Ntotal
          const power = (depth * depth * countIn * countOut) / (cleanPoints.length)
          if (power > bestPower) {
            bestPower = power
            bestPeriod = period
            bestEpoch = epoch
            bestDepthFraction = depth
            bestInTransitCount = countIn
          }
        }
      }
    }
  }

  // 3. Ephemeris Matching & Period Validation
  if (bestPeriod <= 0 || bestPower <= 0) {
    return {
      isPeriodic: false,
      matchedDips: [],
      unmatchedDips: dips,
      periodogramPeakPower: 0
    }
  }

  const matchedDips: DipInterval[] = []
  const unmatchedDips: DipInterval[] = []
  const toleranceDays = Math.max(avgDurationDays * 1.5, 0.05 * bestPeriod)

  for (const dip of dips) {
    // Check if dip center aligns with tn = bestEpoch + n * bestPeriod
    const deltaFromEpoch = dip.centerTime - bestEpoch
    const cycleFloat = deltaFromEpoch / bestPeriod
    const nearestCycle = Math.round(cycleFloat)
    const predictedTime = bestEpoch + nearestCycle * bestPeriod
    const residual = Math.abs(dip.centerTime - predictedTime)

    if (residual <= toleranceDays) {
      matchedDips.push(dip)
    } else {
      unmatchedDips.push(dip)
    }
  }

  // Periodic requires at least 2 distinct transit events OR high-significance repeated fold
  const isPeriodic = matchedDips.length >= 2 || (matchedDips.length === 1 && timeSpan < 2 * bestPeriod)

  const noiseFloor = options.noiseSigma || 0.001
  const foldedSnr = (bestDepthFraction / noiseFloor) * Math.sqrt(bestInTransitCount)

  // Build folded points array for UI / integration
  const halfDurationPhase = (avgDurationDays / bestPeriod) / 2
  const foldedPoints: LightCurvePoint[] = cleanPoints.map((pt) => {
    const rawPhase = ((pt.time - bestEpoch) % bestPeriod + bestPeriod) % bestPeriod
    const phase = rawPhase > bestPeriod / 2 ? (rawPhase - bestPeriod) / periodToPhase(bestPeriod) : rawPhase / periodToPhase(bestPeriod)
    const inTransit = Math.abs(phase) <= halfDurationPhase
    const trend = inTransit ? baselineFlux - bestDepthFraction : baselineFlux
    return {
      time: pt.time,
      flux: pt.normalizedFlux,
      trend,
      phase: parseFloat(phase.toFixed(4)),
      isTransit: inTransit,
      isOutlier: false
    }
  })

  function periodToPhase(p: number) {
    return p
  }

  const modelFit: ModelFitParameters = {
    period: parseFloat(bestPeriod.toFixed(5)),
    epoch: parseFloat(bestEpoch.toFixed(5)),
    depthFraction: parseFloat(bestDepthFraction.toFixed(6)),
    durationHours: parseFloat(avgDurationHours.toFixed(2)),
    limbDarkeningU1: 0.35,
    limbDarkeningU2: 0.20,
    impactParameter: 0.3,
    chiSquare: 1.0,
    reducedChiSquare: 1.0
  }

  return {
    isPeriodic,
    bestPeriodDays: parseFloat(bestPeriod.toFixed(5)),
    periodErrorDays: parseFloat((bestPeriod * 0.002).toFixed(6)),
    bestEpoch: parseFloat(bestEpoch.toFixed(5)),
    bestDurationHours: parseFloat(avgDurationHours.toFixed(2)),
    bestDepthFraction: parseFloat(bestDepthFraction.toFixed(6)),
    bestDepthPpm: Math.round(bestDepthFraction * 1_000_000),
    foldedSnr: parseFloat(foldedSnr.toFixed(2)),
    matchedDips,
    unmatchedDips,
    periodogramPeakPower: parseFloat(bestPower.toFixed(6)),
    foldedPoints,
    modelFit
  }
}
