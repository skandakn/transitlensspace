import { useState, useCallback, useMemo } from 'react'
import type {
  StarObservation,
  LightCurvePoint,
  AnalysisResult,
  AnalysisProgress,
  AnalysisStatus,
  AnalysisParameters
} from '../../types'
import { runTransitDetection, validateObservationData, DEFAULT_PARAMETERS } from './transitDetection'

export interface UseAnalysisWorkflowOptions {
  star: StarObservation
  lightCurve: LightCurvePoint[]
  initialParameters?: Partial<AnalysisParameters>
  onAnalysisCompleted?: (result: AnalysisResult) => void
  onAnalysisFailed?: (error: Error) => void
}

export interface UseAnalysisWorkflowReturn {
  status: AnalysisStatus
  isAnalyzing: boolean
  canAnalyze: boolean
  validationReason?: string
  progress: AnalysisProgress | null
  result: AnalysisResult | null
  error: string | null
  parameters: AnalysisParameters
  setParameters: React.Dispatch<React.SetStateAction<AnalysisParameters>>
  runAnalysis: () => Promise<AnalysisResult | null>
  resetAnalysis: () => void
}

export function useAnalysisWorkflow({
  star,
  lightCurve,
  initialParameters,
  onAnalysisCompleted,
  onAnalysisFailed
}: UseAnalysisWorkflowOptions): UseAnalysisWorkflowReturn {
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parameters, setParameters] = useState<AnalysisParameters>({
    ...DEFAULT_PARAMETERS,
    ...initialParameters
  })

  // Validation: Check if valid observation and sufficient photometry data exist
  const validation = useMemo(() => {
    return validateObservationData(star, lightCurve)
  }, [star, lightCurve])

  const canAnalyze = validation.valid && status !== 'running'

  const runAnalysis = useCallback(async (): Promise<AnalysisResult | null> => {
    if (!validation.valid) {
      setError(validation.reason || 'Cannot run analysis: Invalid observation data.')
      setStatus('failed')
      return null
    }

    setStatus('running')
    setError(null)
    setResult(null)
    setProgress({
      status: 'running',
      progressPercent: 5,
      currentStage: 'Initializing transit detection engine...',
      elapsedTimeMs: 0
    })

    try {
      const detectionResult = await runTransitDetection(
        star,
        lightCurve,
        parameters,
        (p) => setProgress(p)
      )

      setResult(detectionResult)
      setStatus('completed')
      onAnalysisCompleted?.(detectionResult)
      return detectionResult
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Transit detection failed unexpectedly.'
      setError(errMessage)
      setStatus('failed')
      setProgress(null)
      onAnalysisFailed?.(err instanceof Error ? err : new Error(errMessage))
      return null
    }
  }, [star, lightCurve, parameters, validation, onAnalysisCompleted, onAnalysisFailed])

  const resetAnalysis = useCallback(() => {
    setStatus('idle')
    setProgress(null)
    setResult(null)
    setError(null)
  }, [])

  return {
    status,
    isAnalyzing: status === 'running',
    canAnalyze,
    validationReason: validation.reason,
    progress,
    result,
    error,
    parameters,
    setParameters,
    runAnalysis,
    resetAnalysis
  }
}
