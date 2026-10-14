import type { StarObservation, AnalysisResult, TransitEvent } from '../../../types'
import type { TransitDetectionOutput } from './types'

/**
 * Adapter utility that converts the mathematical TransitDetectionOutput into
 * the UI's shared AnalysisResult contract for the integration lead.
 */
export function detectionOutputToAnalysisResult(
  output: TransitDetectionOutput,
  star: StarObservation,
  runId = `run-${Date.now()}`
): AnalysisResult {
  const events: TransitEvent[] = []

  if (output.isPeriodic && output.estimatedPeriodDays && output.depth) {
    const candidateEvent: TransitEvent = {
      id: `cand-${star.id}-${Date.now().toString(36)}`,
      name: `${star.name} b (Candidate)`,
      epoch: output.epoch || 0,
      period: output.estimatedPeriodDays,
      durationHours: output.durationHours || 3.0,
      depthPpm: output.depth.ppm,
      depthFraction: output.depth.fraction,
      // Radius estimate R_p approx = R_star * sqrt(depth) in Solar units converted to Earth units (109.1 R_earth / R_sun)
      planetRadiusEarth: parseFloat((star.stellarRadius * Math.sqrt(output.depth.fraction) * 109.1).toFixed(2)),
      snr: output.snr || 0,
      disposition: output.disposition === 'FALSE_POSITIVE' ? 'FALSE_POSITIVE' : 'CANDIDATE',
      falseAlarmProbability: output.confidenceScore > 0 ? parseFloat((1 - output.qualityScore).toFixed(4)) : 0.99
    }
    events.push(candidateEvent)
  }

  return {
    id: runId,
    observationId: star.id,
    star,
    status: output.status === 'completed' ? 'completed' : 'failed',
    algorithm: 'BLS',
    parameters: {
      algorithm: 'BLS',
      minPeriodDays: 0.5,
      maxPeriodDays: 30.0,
      periodSteps: 2000,
      durationMinHours: 1.0,
      durationMaxHours: 16.0,
      snrThreshold: 6.5
    },
    startedAt: new Date(Date.now() - 3000).toISOString(),
    completedAt: new Date().toISOString(),
    executionTimeMs: 450,
    lightCurveSummary: {
      totalPoints: output.statistics.totalPointsEvaluated,
      durationDays: output.statistics.timeSpanDays,
      baselineFlux: output.statistics.baselineFlux,
      rmsNoise: output.statistics.noiseRms,
      cadenceMinutes: 30,
      outlierCount: output.statistics.outliersRemoved
    },
    transitEvents: events,
    bestCandidate: events[0],
    foldedPoints: output.foldedPoints,
    modelFit: output.modelFit,
    detectedIntervals: (output.periodicDips && output.periodicDips.length > 0 ? output.periodicDips : output.detectedDips)?.map((d) => ({
      startTime: d.startTime,
      endTime: d.endTime,
      centerTime: d.centerTime,
      depthPpm: d.depthPpm,
      snr: d.snr
    })),
    notes: output.diagnosticSummary
  }
}
