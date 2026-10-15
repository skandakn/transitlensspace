import type { AnalysisResult, AnalysisParameters, LightCurvePoint, StarObservation } from '../types'

const apiBaseUrl = (import.meta.env.VITE_TRANSIT_API_URL || '').replace(/\/$/, '')

interface BackendAnalysisResponse {
  dataset: { id: string; star: StarObservation }
  lightCurve: LightCurvePoint[]
  result: AnalysisResult
}

export function isTransitApiConfigured() {
  // In Vercel multi-service deployment, the backend service is co-located at /api
  return Boolean(apiBaseUrl || typeof window !== 'undefined')
}

export async function analyzeBundledObservation(
  datasetId: string,
  parameters: Pick<AnalysisParameters, 'minPeriodDays' | 'maxPeriodDays'>
): Promise<BackendAnalysisResponse> {
  const url = apiBaseUrl ? `${apiBaseUrl}/api/v1/analyze` : '/api/v1/analyze'

  const response = await fetch(url, {
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
