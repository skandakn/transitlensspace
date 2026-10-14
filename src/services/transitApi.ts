import type { AnalysisResult, AnalysisParameters, LightCurvePoint, StarObservation } from '../types'

const apiBaseUrl = (import.meta.env.VITE_TRANSIT_API_URL || '').replace(/\/$/, '')

interface BackendAnalysisResponse {
  dataset: { id: string; star: StarObservation }
  lightCurve: LightCurvePoint[]
  result: AnalysisResult
}

export function isTransitApiConfigured() {
  return Boolean(apiBaseUrl)
}

export async function analyzeBundledObservation(
  datasetId: string,
  parameters: Pick<AnalysisParameters, 'minPeriodDays' | 'maxPeriodDays'>
): Promise<BackendAnalysisResponse> {
  if (!apiBaseUrl) {
    throw new Error('The scientific analysis service is not configured. Set VITE_TRANSIT_API_URL to the deployed FastAPI service URL.')
  }

  const response = await fetch(`${apiBaseUrl}/api/v1/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataset_id: datasetId,
      min_period_days: parameters.minPeriodDays,
      max_period_days: parameters.maxPeriodDays
    })
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(payload?.detail || `Analysis service returned ${response.status}.`)
  }

  return response.json() as Promise<BackendAnalysisResponse>
}
