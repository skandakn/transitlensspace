import type { DipInterval, ConfidenceBreakdown, DetectionDisposition } from './types'

export interface ScoringInputs {
  matchedDips: DipInterval[]
  allDips: DipInterval[]
  foldedSnr: number
  depthFraction: number
  noiseSigma: number
  isPeriodic: boolean
  inTransitPointsCount: number
  totalPointsCount: number
}

export interface ScoringOutput {
  confidenceScore: number
  qualityScore: number
  breakdown: ConfidenceBreakdown
  disposition: DetectionDisposition
  scoreExplanation: string
}

/**
 * Calculates deterministic, explainable confidence and quality scores
 * based on transit repetition, SNR, phase coverage, and even/odd depth parity.
 */
export function computeConfidenceAndQuality(inputs: ScoringInputs): ScoringOutput {
  const {
    matchedDips,
    foldedSnr,
    depthFraction: _depthFraction,
    noiseSigma,
    isPeriodic,
    inTransitPointsCount
  } = inputs

  // 1. Repetition Score (0 to 30)
  let transitCountScore = 0
  const count = matchedDips.length
  if (count >= 3) {
    transitCountScore = 30
  } else if (count === 2) {
    transitCountScore = 20
  } else if (count === 1) {
    transitCountScore = 8
  }

  // 2. SNR Score (0 to 35)
  // NASA Kepler vetting threshold is typically 7.1 sigma
  let snrScore = 0
  if (foldedSnr >= 15.0) {
    snrScore = 35
  } else if (foldedSnr >= 10.0) {
    snrScore = 28 + (foldedSnr - 10.0) * 1.4
  } else if (foldedSnr >= 7.1) {
    snrScore = 20 + (foldedSnr - 7.1) * 2.7
  } else if (foldedSnr >= 4.0) {
    snrScore = 8 + (foldedSnr - 4.0) * 3.8
  } else if (foldedSnr > 0) {
    snrScore = Math.max(0, foldedSnr * 2)
  }
  snrScore = Math.min(35, Math.round(snrScore))

  // 3. Phase Coverage & In-Transit Sampling (0 to 20)
  let phaseCoverageScore = 0
  if (inTransitPointsCount >= 20) {
    phaseCoverageScore = 20
  } else if (inTransitPointsCount >= 10) {
    phaseCoverageScore = 15
  } else if (inTransitPointsCount >= 5) {
    phaseCoverageScore = 10
  } else if (inTransitPointsCount >= 2) {
    phaseCoverageScore = 5
  }

  // 4. Even/Odd Transit Depth Parity (0 to 15) & Eclipsing Binary Test
  let depthParityScore = 0
  let eclipsingBinaryPenalty = 0
  let isEclipsingBinary = false

  if (matchedDips.length >= 2) {
    const evenDepths: number[] = []
    const oddDepths: number[] = []

    for (let i = 0; i < matchedDips.length; i++) {
      if (i % 2 === 0) {
        evenDepths.push(matchedDips[i].depthFraction)
      } else {
        oddDepths.push(matchedDips[i].depthFraction)
      }
    }

    if (evenDepths.length > 0 && oddDepths.length > 0) {
      const avgEven = evenDepths.reduce((s, v) => s + v, 0) / evenDepths.length
      const avgOdd = oddDepths.reduce((s, v) => s + v, 0) / oddDepths.length

      const minAvg = Math.min(avgEven, avgOdd)
      const maxAvg = Math.max(avgEven, avgOdd)
      const parityRatio = maxAvg > 0 ? minAvg / maxAvg : 1.0

      if (parityRatio >= 0.80) {
        depthParityScore = 15
      } else if (parityRatio >= 0.65) {
        depthParityScore = 10
      } else if (parityRatio >= 0.50) {
        depthParityScore = 5
      } else {
        // Significant difference between even and odd depths suggests
        // primary and secondary eclipses of an eclipsing binary
        isEclipsingBinary = true
        eclipsingBinaryPenalty = 25
      }
    } else {
      depthParityScore = 8
    }
  } else if (matchedDips.length === 1) {
    depthParityScore = 5
  }

  // Total confidence calculation
  const rawTotal = transitCountScore + snrScore + phaseCoverageScore + depthParityScore - eclipsingBinaryPenalty
  const totalConfidence = Math.max(0, Math.min(100, Math.round(rawTotal)))
  const qualityScore = parseFloat((totalConfidence / 100).toFixed(2))

  // Determine disposition:
  // Note: Scientific integrity requires never auto-confirming a candidate without external spectroscopy.
  let disposition: DetectionDisposition
  if (isEclipsingBinary) {
    disposition = 'FALSE_POSITIVE'
  } else if (isPeriodic && totalConfidence >= 55 && foldedSnr >= 6.5) {
    disposition = 'CANDIDATE'
  } else {
    disposition = 'INCONCLUSIVE'
  }

  // Construct structured mathematical explanation
  const breakdown: ConfidenceBreakdown = {
    transitCountScore,
    snrScore,
    phaseCoverageScore,
    depthParityScore,
    eclipsingBinaryPenalty: -eclipsingBinaryPenalty,
    totalConfidence
  }

  const scoreExplanation = [
    `Confidence Score: ${totalConfidence}/100 (Quality Metric: ${qualityScore}). Calculated via deterministic metric weighting:`,
    `1. Periodic Repetition (+${transitCountScore}/30 pts): ${count} periodic dip(s) aligned with ephemeris.`,
    `2. Folded Signal-to-Noise Ratio (+${snrScore}/35 pts): Folded transit SNR of ${foldedSnr.toFixed(1)}σ vs noise floor ${noiseSigma.toFixed(5)}.`,
    `3. Phase Profile Sampling (+${phaseCoverageScore}/20 pts): ${inTransitPointsCount} points inside transit window.`,
    `4. Depth Parity (+${depthParityScore}/15 pts): Evaluated even/odd transit symmetry.`,
    eclipsingBinaryPenalty > 0
      ? `5. Eclipsing Binary Penalty (-${eclipsingBinaryPenalty} pts): Alternating depths suggest stellar binary component.`
      : `5. Binary Check (0 pts penalty): No alternating eclipse depth asymmetry detected.`,
    `Status: Classified as [${disposition}]. Note: Web-side photometry establishes candidate status; confirmed exoplanet status requires radial velocity confirmation.`
  ].join('\n')

  return {
    confidenceScore: totalConfidence,
    qualityScore,
    breakdown,
    disposition,
    scoreExplanation
  }
}
