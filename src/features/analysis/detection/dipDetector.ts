import type { NormalizedPoint, DipInterval } from './types'

export interface DipDetectorOptions {
  dipSigmaThreshold?: number
  minPointsPerDip?: number
  maxDurationHours?: number
}

/**
 * Scans normalized photometric time series to identify candidate brightness dip intervals.
 * 
 * Groups contiguous points below the statistical threshold into candidate dips
 * and calculates flux-weighted center time, duration, depth, and signal-to-noise ratio.
 */
export function detectCandidateDips(
  points: NormalizedPoint[],
  baselineFlux: number,
  noiseSigma: number,
  options: DipDetectorOptions = {}
): DipInterval[] {
  const {
    dipSigmaThreshold = 2.2,
    minPointsPerDip = 2,
    maxDurationHours = 18.0
  } = options

  const threshold = baselineFlux - dipSigmaThreshold * noiseSigma
  const dips: DipInterval[] = []

  let inDip = false
  let startIndex = -1
  const currentDipPoints: { index: number; point: NormalizedPoint }[] = []

  for (let i = 0; i < points.length; i++) {
    const pt = points[i]

    // Skip flagged outliers
    if (pt.isOutlier) {
      if (inDip) {
        // Close out current dip before outlier
        finishDip()
      }
      continue
    }

    if (pt.normalizedFlux < threshold) {
      if (!inDip) {
        inDip = true
        startIndex = i
        currentDipPoints.length = 0
      }
      currentDipPoints.push({ index: i, point: pt })
    } else {
      if (inDip) {
        finishDip()
      }
    }
  }

  // Handle case where light curve ends while in a dip
  if (inDip) {
    finishDip()
  }

  function finishDip() {
    if (currentDipPoints.length >= minPointsPerDip) {
      const firstPt = currentDipPoints[0].point
      const lastPt = currentDipPoints[currentDipPoints.length - 1].point

      // Estimate cadence from point separation
      const cadenceDays = currentDipPoints.length > 1
        ? (lastPt.time - firstPt.time) / (currentDipPoints.length - 1)
        : 0.02

      const startTime = firstPt.time - cadenceDays / 2
      const endTime = lastPt.time + cadenceDays / 2
      const durationHours = (endTime - startTime) * 24

      if (durationHours <= maxDurationHours && durationHours > 0) {
        // Calculate flux-deficit weighted center time
        let totalWeight = 0
        let weightedTimeSum = 0
        let minFlux = baselineFlux
        let sumFluxDeficit = 0

        for (const item of currentDipPoints) {
          const deficit = Math.max(0, baselineFlux - item.point.normalizedFlux)
          if (item.point.normalizedFlux < minFlux) {
            minFlux = item.point.normalizedFlux
          }
          sumFluxDeficit += deficit
          totalWeight += deficit
          weightedTimeSum += item.point.time * deficit
        }

        const centerTime = totalWeight > 0 ? weightedTimeSum / totalWeight : (startTime + endTime) / 2
        const meanDeficit = sumFluxDeficit / currentDipPoints.length
        const depthFraction = Math.max(meanDeficit, baselineFlux - minFlux)
        const depthPpm = Math.round(depthFraction * 1_000_000)

        // Local dip SNR: (depth / noise) * sqrt(pointsCount)
        const snr = (depthFraction / noiseSigma) * Math.sqrt(currentDipPoints.length)

        dips.push({
          id: `dip-${dips.length + 1}`,
          startIndex,
          endIndex: currentDipPoints[currentDipPoints.length - 1].index,
          startTime,
          endTime,
          centerTime,
          durationHours: parseFloat(durationHours.toFixed(2)),
          minFlux,
          depthFraction: parseFloat(depthFraction.toFixed(6)),
          depthPpm,
          snr: parseFloat(snr.toFixed(2)),
          pointsCount: currentDipPoints.length
        })
      }
    }

    inDip = false
    startIndex = -1
    currentDipPoints.length = 0
  }

  return dips
}
