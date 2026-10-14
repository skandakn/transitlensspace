import type { AnalysisResult } from '../../types'

export type AnalysisOutcomeType = 'POTENTIAL_TRANSIT' | 'NO_TRANSIT' | 'INCONCLUSIVE'

export interface OutcomeDetails {
  type: AnalysisOutcomeType
  label: string
  headline: string
  description: string
  badgeVariant: 'success' | 'outline' | 'warning'
}

/**
 * Determine the scientific outcome disposition based strictly on AnalysisResult.
 * Never hardcoded.
 */
export function determineOutcome(result: AnalysisResult | null | undefined): OutcomeDetails {
  if (!result) {
    return {
      type: 'INCONCLUSIVE',
      label: 'Inconclusive',
      headline: 'Awaiting Analysis',
      description: 'Run the transit detection engine to evaluate photometric observations.',
      badgeVariant: 'outline'
    }
  }

  // 1. Inconclusive check: failed status, error message, or high noise
  if (
    result.status === 'failed' ||
    result.status === 'aborted' ||
    result.errorMessage ||
    result.lightCurveSummary.totalPoints < 20 ||
    result.lightCurveSummary.rmsNoise > 0.0035
  ) {
    return {
      type: 'INCONCLUSIVE',
      label: 'Inconclusive',
      headline: 'Inconclusive Observation',
      description:
        result.notes ||
        'Photometric scatter, elevated stellar noise, or insufficient baseline prevents conclusive transit verification.',
      badgeVariant: 'warning'
    }
  }

  // 2. Potential Transit Detected check: confirmed or candidate event with SNR >= threshold
  const candidate = result.bestCandidate
  const snrThreshold = result.parameters?.snrThreshold ?? 7.1
  const hasConfidentCandidate =
    candidate &&
    candidate.snr >= snrThreshold &&
    candidate.depthFraction > 0.0001 &&
    result.transitEvents.length > 0

  if (hasConfidentCandidate) {
    return {
      type: 'POTENTIAL_TRANSIT',
      label: 'Potential Transit Detected',
      headline: 'Potential Transit Detected',
      description:
        result.notes ||
        `Periodic flux attenuation detected with SNR of ${candidate.snr.toFixed(1)}σ, matching an exoplanet transit profile.`,
      badgeVariant: 'success'
    }
  }

  // 3. No convincing transit found: algorithm completed on valid data but no candidate met threshold
  return {
    type: 'NO_TRANSIT',
    label: 'No Convincing Transit Found',
    headline: 'No Convincing Transit Found',
    description:
      result.notes ||
      'No periodic transit dip exceeded the statistical detection threshold. Stellar flux remains consistent with an undisturbed baseline.',
    badgeVariant: 'outline'
  }
}
