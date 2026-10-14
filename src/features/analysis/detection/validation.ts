import type { ValidatedPoint } from './types'

export interface ValidationResult {
  isValid: boolean
  points: ValidatedPoint[]
  error?: string
  droppedCount: number
}

const MINIMUM_POINTS_REQUIRED = 15

/**
 * Validates, filters, and chronologically sorts input time-brightness measurements.
 * 
 * Handles:
 * - Null, undefined, or non-array inputs
 * - Non-finite numbers, NaN, and negative fluxes
 * - Unsorted observations
 * - Duplicate timestamps
 * - Insufficient data count
 */
export function validateAndSortPoints(rawInput: unknown): ValidationResult {
  if (!rawInput || !Array.isArray(rawInput)) {
    return {
      isValid: false,
      points: [],
      error: 'Input data must be a non-empty array of time-brightness measurements.',
      droppedCount: 0
    }
  }

  const validPoints: ValidatedPoint[] = []
  let droppedCount = 0

  for (const item of rawInput) {
    if (typeof item !== 'object' || item === null) {
      droppedCount++
      continue
    }

    const t = (item as { time?: unknown; flux?: unknown; fluxError?: unknown }).time
    const f = (item as { time?: unknown; flux?: unknown; fluxError?: unknown }).flux
    const fe = (item as { time?: unknown; flux?: unknown; fluxError?: unknown }).fluxError

    if (typeof t !== 'number' || !Number.isFinite(t) || isNaN(t)) {
      droppedCount++
      continue
    }

    if (typeof f !== 'number' || !Number.isFinite(f) || isNaN(f) || f <= 0) {
      droppedCount++
      continue
    }

    let parsedFe: number | undefined = undefined
    if (typeof fe === 'number' && Number.isFinite(fe) && !isNaN(fe) && fe >= 0) {
      parsedFe = fe
    }

    validPoints.push({
      time: t,
      flux: f,
      fluxError: parsedFe
    })
  }

  if (validPoints.length === 0) {
    return {
      isValid: false,
      points: [],
      error: 'No valid photometric measurements found (all points contained invalid or non-numeric values).',
      droppedCount
    }
  }

  // Sort strictly by observation time ascending
  validPoints.sort((a, b) => a.time - b.time)

  // Merge identical timestamps if any exist by averaging flux
  const dedupedPoints: ValidatedPoint[] = []
  for (let i = 0; i < validPoints.length; i++) {
    const current = validPoints[i]
    if (dedupedPoints.length > 0 && Math.abs(dedupedPoints[dedupedPoints.length - 1].time - current.time) < 1e-7) {
      const prev = dedupedPoints[dedupedPoints.length - 1]
      prev.flux = (prev.flux + current.flux) / 2
      if (current.fluxError !== undefined && prev.fluxError !== undefined) {
        prev.fluxError = Math.sqrt(prev.fluxError ** 2 + current.fluxError ** 2) / 2
      }
    } else {
      dedupedPoints.push({ ...current })
    }
  }

  if (dedupedPoints.length < MINIMUM_POINTS_REQUIRED) {
    return {
      isValid: false,
      points: dedupedPoints,
      error: `Insufficient data points: dataset contains ${dedupedPoints.length} valid points, but a minimum of ${MINIMUM_POINTS_REQUIRED} is required for statistical detection.`,
      droppedCount
    }
  }

  const timeSpan = dedupedPoints[dedupedPoints.length - 1].time - dedupedPoints[0].time
  if (timeSpan <= 0) {
    return {
      isValid: false,
      points: dedupedPoints,
      error: `Invalid time span: observation baseline must be greater than zero days (got ${timeSpan}).`,
      droppedCount
    }
  }

  return {
    isValid: true,
    points: dedupedPoints,
    droppedCount
  }
}
