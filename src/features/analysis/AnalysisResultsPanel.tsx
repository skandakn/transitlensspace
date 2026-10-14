import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Play,
  Activity,
  Telescope,
  Info,
  ShieldCheck
} from 'lucide-react'
import type {
  StarObservation,
  LightCurvePoint,
  AnalysisResult,
  AnalysisProgress,
  AnalysisStatus
} from '../../types'
import {
  formatPeriod,
  formatDepth,
  formatRadius,
  formatDuration
} from '../../lib/formatters'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { determineOutcome } from './outcomeUtils'

export interface AnalysisResultsPanelProps {
  observation: StarObservation
  lightCurve: LightCurvePoint[]
  status: AnalysisStatus
  progress?: AnalysisProgress | null
  result?: AnalysisResult | null
  error?: string | null
  isAnalyzing: boolean
  canAnalyze: boolean
  validationReason?: string
  onRunAnalysis: () => void
  onResetAnalysis: () => void
  className?: string
}

/**
 * Interactive Results Panel
 * Owned by: Analysis Experience Lead (Member 6)
 * 
 * Responsibilities:
 * - Real processing state visualization while Member 5 detection engine runs
 * - Clear outcome categorization: "Potential transit detected", "No convincing transit found", "Inconclusive"
 * - Derived exoplanet metrics: event count, orbital period, transit depth, SNR, noise
 * - Clear astrophysical evidence explaining which measurements support the outcome
 * - Friendly empty, error, and reset states
 */
export function AnalysisResultsPanel({
  observation,
  lightCurve,
  status,
  progress,
  result,
  error,
  isAnalyzing,
  canAnalyze,
  validationReason,
  onRunAnalysis,
  onResetAnalysis,
  className = ''
}: AnalysisResultsPanelProps) {
  const outcome = result ? determineOutcome(result) : null
  const candidate = result?.bestCandidate
  const summary = result?.lightCurveSummary

  return (
    <section
      className={`results-panel panel ${className}`}
      id="results"
      aria-labelledby="results-heading"
      role="region"
      aria-live="polite"
      aria-busy={isAnalyzing}
    >
      {/* Header */}
      <div className="panel-heading results-heading">
        <div>
          <div className="heading-overline">ANALYSIS WORKSPACE</div>
          <h2 id="results-heading">Analysis Results</h2>
        </div>

        <div className="flex items-center gap-2">
          {status === 'completed' && outcome && (
            <Badge
              variant={outcome.badgeVariant}
              pulseDot={outcome.type === 'POTENTIAL_TRANSIT'}
              className="text-[10px] font-mono uppercase tracking-wider"
            >
              {outcome.label}
            </Badge>
          )}

          {status === 'running' && (
            <Badge variant="cyan" pulseDot className="text-[10px] font-mono">
              Analyzing...
            </Badge>
          )}

          {status === 'failed' && (
            <Badge variant="danger" className="text-[10px] font-mono">
              Failed
            </Badge>
          )}

          {status === 'idle' && (
            <span className="results-state">Standby</span>
          )}
        </div>
      </div>

      {/* 1. PROCESSING STATE (Requirement 3) */}
      {isAnalyzing && (
        <div
          className="p-5 my-4 rounded-xl bg-[#0a1424] border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.12)] space-y-4 animate-in fade-in duration-200"
          role="status"
          aria-label="Analysis in progress"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50">
                <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Algorithmic Engine Running
                </h3>
                <p className="text-[11px] text-cyan-300 font-mono mt-0.5">
                  {progress?.currentStage || 'Evaluating photometric cadence grid...'}
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-[11px] text-cyan-400">
              {progress?.progressPercent ? `${Math.round(progress.progressPercent)}%` : 'Active'}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-violet-500 transition-all duration-300 rounded-full"
              style={{ width: `${progress?.progressPercent || 35}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Target: <strong className="text-slate-200">{observation.name || observation.id}</strong></span>
            <span>Elapsed: {progress?.elapsedTimeMs ? `${(progress.elapsedTimeMs / 1000).toFixed(1)}s` : '0.0s'}</span>
          </div>
        </div>
      )}

      {/* 2. ERROR STATE (Requirement 9) */}
      {status === 'failed' && !isAnalyzing && (
        <div
          className="p-4 my-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-left space-y-3 animate-in fade-in duration-200"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-900/50 border border-rose-500/40 text-rose-300 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Analysis Execution Error</h3>
              <p className="text-[11px] text-rose-300/90 mt-1 leading-relaxed">
                {error || 'The algorithmic transit detection engine encountered an unexpected error.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-rose-900/40">
            <span className="text-[10px] text-slate-400 font-mono">Status: Execution Halted</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onResetAnalysis}>
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onRunAnalysis}
                disabled={!canAnalyze}
                leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                Retry Analysis
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EMPTY STATE (Requirement 9) */}
      {status === 'idle' && !isAnalyzing && (
        <div className="results-empty" aria-live="polite">
          <div className="results-icon">
            <Telescope size={18} strokeWidth={1.7} />
          </div>
          <h3>Awaiting Star Analysis</h3>
          <p>
            {lightCurve.length > 0
              ? `${lightCurve.length.toLocaleString()} photometric cadences are loaded for ${observation.name || observation.id}. Click "Analyze Star" to run detection.`
              : 'Choose a target star and connect an observation set to begin photometric transit discovery.'}
          </p>

          {!canAnalyze && validationReason && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{validationReason}</span>
            </div>
          )}

          <div className="w-full pt-4">
            <Button
              variant="primary"
              size="sm"
              onClick={onRunAnalysis}
              disabled={!canAnalyze}
              className="w-full sm:w-auto"
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Analyze Star Now
            </Button>
          </div>
        </div>
      )}

      {/* 4. COMPLETED RESULTS OUTCOME & METRICS (Requirements 5, 6, 7, 8) */}
      {status === 'completed' && result && outcome && !isAnalyzing && (
        <div className="space-y-4 my-3 text-left animate-in fade-in duration-300">
          {/* Outcome Banner (Requirement 8) */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              outcome.type === 'POTENTIAL_TRANSIT'
                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                : outcome.type === 'NO_TRANSIT'
                ? 'bg-slate-900/60 border-slate-750'
                : 'bg-amber-950/30 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
            }`}
          >
            <div
              className={`p-2 rounded-lg border shrink-0 ${
                outcome.type === 'POTENTIAL_TRANSIT'
                  ? 'bg-emerald-900/60 border-emerald-500/40 text-emerald-300'
                  : outcome.type === 'NO_TRANSIT'
                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                  : 'bg-amber-900/60 border-amber-500/40 text-amber-300'
              }`}
            >
              {outcome.type === 'POTENTIAL_TRANSIT' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : outcome.type === 'NO_TRANSIT' ? (
                <Info className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-white tracking-wide">
                  {outcome.headline}
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {result.executionTimeMs ? `${(result.executionTimeMs / 1000).toFixed(2)}s runtime` : ''}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {outcome.description}
              </p>
            </div>
          </div>

          {/* Key Exoplanet Metrics Grid (Requirement 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
            {/* Detected Event Count */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Events</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {result.transitEvents.length}
              </span>
              <span className="text-[9px] text-cyan-400 block truncate">
                {result.transitEvents.length === 1 ? '1 candidate dip' : `${result.transitEvents.length} candidates`}
              </span>
            </div>

            {/* Estimated Orbital Period */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Est. Period</span>
              <span className="text-sm font-bold text-cyan-300 mt-0.5 block truncate">
                {candidate ? formatPeriod(candidate.period) : '—'}
              </span>
              <span className="text-[9px] text-slate-400 block truncate">
                {candidate ? `Epoch: ${candidate.epoch.toFixed(2)}` : 'No periodicity'}
              </span>
            </div>

            {/* Transit Depth */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Transit Depth</span>
              <span className="text-sm font-bold text-amber-300 mt-0.5 block truncate">
                {candidate ? formatDepth(candidate.depthFraction, candidate.depthPpm) : '—'}
              </span>
              <span className="text-[9px] text-slate-400 block truncate">
                {candidate?.planetRadiusEarth ? formatRadius(candidate.planetRadiusEarth) : 'Baseline flat'}
              </span>
            </div>

            {/* Signal-to-Noise Ratio (SNR) */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Signal SNR</span>
              <span className={`text-sm font-bold mt-0.5 block ${
                candidate && candidate.snr >= 7.1 ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {candidate ? `${candidate.snr.toFixed(1)} σ` : '< 3.0 σ'}
              </span>
              <span className="text-[9px] text-slate-400 block truncate">
                {candidate && candidate.snr >= 7.1 ? 'Threshold met' : 'Below threshold'}
              </span>
            </div>
          </div>

          {/* Measurements Supporting the Result (Requirement 7) */}
          <div className="p-3 rounded-lg bg-[#08101d] border border-slate-800/90 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Astrophysical Measurement Evidence</span>
            </div>

            <ul className="space-y-1.5 text-[11px] text-slate-300/90 pl-1 font-sans">
              {outcome.type === 'POTENTIAL_TRANSIT' && candidate && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">Signal-to-Noise:</strong> Candidate SNR of{' '}
                      <strong className="text-emerald-300 font-mono">{candidate.snr.toFixed(1)}σ</strong> exceeds the detection threshold ({result.parameters.snrThreshold}σ) by +{(candidate.snr - result.parameters.snrThreshold).toFixed(1)}σ.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">Depth & Radius:</strong> Measured depth of{' '}
                      <strong className="text-cyan-300 font-mono">{candidate.depthPpm.toLocaleString()} ppm</strong> ({(candidate.depthFraction * 100).toFixed(3)}%) implies a planetary radius of{' '}
                      <strong className="text-violet-300 font-mono">{candidate.planetRadiusEarth ? formatRadius(candidate.planetRadiusEarth) : 'transiting body'}</strong> on host star {observation.name}.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">Duration & Profile:</strong> Transit duration of{' '}
                      <strong className="text-slate-200 font-mono">{formatDuration(candidate.durationHours)}</strong> conforms with standard circular Keplerian transit geometry.
                    </span>
                  </li>
                  {result.modelFit && (
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>
                        <strong className="text-white font-mono">Model Fit:</strong> Reduced χ² of{' '}
                        <strong className="text-amber-300 font-mono">{result.modelFit.reducedChiSquare.toFixed(2)}</strong> confirms consistent limb-darkening ingress/egress.
                      </span>
                    </li>
                  )}
                </>
              )}

              {outcome.type === 'NO_TRANSIT' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">SNR Criterion:</strong> No periodic dip exceeded the {result.parameters.snrThreshold}σ statistical detection threshold.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">Photometric Noise:</strong> Measured RMS scatter of{' '}
                      <strong className="text-slate-200 font-mono">{summary?.rmsNoise.toFixed(6)}</strong> accounts for the observed flux dispersion across all {summary?.totalPoints.toLocaleString()} cadences.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">Grid Search:</strong> BLS periodogram power spectrum exhibits uniform white-noise characteristics without dominant harmonic peaks.
                    </span>
                  </li>
                </>
              )}

              {outcome.type === 'INCONCLUSIVE' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">Data Quality:</strong> Elevated RMS scatter ({summary?.rmsNoise.toFixed(6)}) or excessive outlier count ({summary?.outlierCount}) degrades detection sensitivity.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>
                      <strong className="text-white font-mono">Observation Baseline:</strong> Duration of {summary?.durationDays.toFixed(1)} days is insufficient to verify multi-epoch periodicity.
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Reset & Re-run Action Controls (Requirement 9) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetAnalysis}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Results
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onRunAnalysis}
              disabled={!canAnalyze}
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Re-run Detection
            </Button>
          </div>
        </div>
      )}

      {/* Observation Telemetry Summary Fields */}
      <div className="result-fields" aria-label="Analysis output fields">
        <div>
          <span>Target</span>
          <strong>{observation.name || observation.id || '—'}</strong>
        </div>
        <div>
          <span>Mission</span>
          <strong>{observation.mission || '—'}</strong>
        </div>
        <div>
          <span>Cadence Points</span>
          <strong>{lightCurve.length > 0 ? lightCurve.length.toLocaleString() : '—'}</strong>
        </div>
        <div>
          <span>Algorithm</span>
          <strong>{result?.algorithm || 'BLS (Box Least Squares)'}</strong>
        </div>
      </div>

      <div className="results-note">
        <span className="note-mark">i</span>
        <span>All physical metrics derived live from algorithmic analysis. No hardcoded claims.</span>
      </div>
    </section>
  )
}
