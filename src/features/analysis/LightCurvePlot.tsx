import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, Sparkles, Eye, EyeOff } from 'lucide-react'
import type { LightCurvePoint, ModelFitParameters } from '../../types'

export interface LightCurvePlotProps {
  data: LightCurvePoint[]
  detectedIntervals?: {
    startTime: number
    endTime: number
    centerTime: number
    depthPpm: number
    snr: number
  }[]
  isTransitCandidate?: boolean
  modelFit?: ModelFitParameters
  isAnalyzing?: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: LightCurvePoint & { inDetectedTransit?: boolean }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const pt = payload[0].payload

  return (
    <div className="bg-[#0b1522]/95 border border-[#34495b] shadow-2xl rounded-lg px-3 py-2 text-xs font-mono backdrop-blur-md z-50">
      <div className="text-cyan-400 font-bold mb-1">
        Time: {Number(pt.time).toFixed(4)} d
      </div>
      <div className="text-slate-200">
        Flux: <span className="text-white font-semibold">{Number(pt.flux).toFixed(6)}</span>
      </div>
      {pt.trend !== undefined && (
        <div className="text-violet-400 text-[11px]">
          Fit Baseline: {Number(pt.trend).toFixed(6)}
        </div>
      )}
      {pt.inDetectedTransit && (
        <div className="mt-1 pt-1 border-t border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Detected Transit Window</span>
        </div>
      )}
    </div>
  )
}

export function LightCurvePlot({
  data,
  detectedIntervals = [],
  isTransitCandidate = false,
  modelFit,
  isAnalyzing = false
}: LightCurvePlotProps) {
  const [showIntervals, setShowIntervals] = useState(true)
  const [showModelFit, setShowModelFit] = useState(true)

  // Pre-calculate min/max flux domain and mark transit points (unconditional hook)
  const { yDomain, chartPoints } = useMemo(() => {
    if (!data.length) {
      return { yDomain: [0.99, 1.01] as [number, number], chartPoints: [] }
    }

    let minFlux = 1.0
    let maxFlux = 1.0

    // Downsample if dataset is exceptionally large (> 3000 points) to guarantee 60fps Recharts rendering
    const stride = data.length > 3000 ? Math.ceil(data.length / 2000) : 1
    const sampled = data.filter((_, idx) => idx % stride === 0)

    const pointsWithTransitFlag = sampled.map((pt) => {
      if (pt.flux < minFlux) minFlux = pt.flux
      if (pt.flux > maxFlux) maxFlux = pt.flux

      // Check if point falls within any detected transit interval
      const inInterval = detectedIntervals.some(
        (inv) => pt.time >= inv.startTime && pt.time <= inv.endTime
      )
      const isTransitPoint = pt.isTransit || inInterval

      // Calculate model fit flux if model parameters available
      let fittedFlux = pt.trend
      if (fittedFlux === undefined && modelFit && isTransitCandidate) {
        const { period, epoch, depthFraction, durationHours } = modelFit
        const durationDays = durationHours / 24
        const rawPhase = ((pt.time - epoch) % period + period) % period
        const phase = rawPhase > period / 2 ? (rawPhase - period) / period : rawPhase / period
        const insideTransit = Math.abs(phase * period) < durationDays / 2
        fittedFlux = insideTransit ? 1.0 - depthFraction : 1.0
      }

      return {
        ...pt,
        inDetectedTransit: isTransitPoint,
        trend: fittedFlux
      }
    })

    const delta = maxFlux - minFlux
    const padding = delta > 0.0001 ? delta * 0.12 : 0.0015

    return {
      yDomain: [
        parseFloat((minFlux - padding).toFixed(5)),
        parseFloat((maxFlux + padding).toFixed(5))
      ] as [number, number],
      chartPoints: pointsWithTransitFlag
    }
  }, [data, detectedIntervals, isTransitCandidate, modelFit])

  // Empty state handling
  if (data.length === 0) {
    return (
      <div className="chart-grid" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => <span key={index} />)}
        <div className="chart-empty-state">
          <div className="chart-empty-icon"><Activity size={19} strokeWidth={1.7} /></div>
          <p className="text-slate-200 font-semibold text-xs mb-1">Light curve will appear here</p>
          <span className="text-slate-400 text-[11px]">Choose a target star and connect observation data to begin.</span>
        </div>
      </div>
    )
  }

  const hasDetectedTransits = detectedIntervals.length > 0 && isTransitCandidate

  return (
    <div
      className="relative w-full h-full flex flex-col"
      role="region"
      aria-label="Interactive light curve plot displaying relative flux versus observation time"
    >
      {/* Screen-reader accessible summary of the chart data */}
      <div className="sr-only">
        <p>
          Photometric time series chart with {data.length.toLocaleString()} cadences.
          Baseline flux is normalized around 1.0. Flux ranges between {yDomain[0]} and {yDomain[1]}.
          {hasDetectedTransits
            ? `${detectedIntervals.length} transit window(s) identified and marked.`
            : 'No transit intervals currently identified.'}
        </p>
      </div>

      {/* Interactive overlay controls in chart corner */}
      {hasDetectedTransits && (
        <div className="absolute top-2 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowIntervals((prev) => !prev)}
            aria-pressed={showIntervals}
            aria-label={`Toggle detected transit interval highlighting (${detectedIntervals.length} windows detected)`}
            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
              showIntervals
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900/80 border-slate-750 text-slate-400'
            }`}
            title="Toggle detected transit interval highlighting"
          >
            {showIntervals ? <Eye className="w-3 h-3" aria-hidden="true" /> : <EyeOff className="w-3 h-3" aria-hidden="true" />}
            <span>Transit Intervals ({detectedIntervals.length})</span>
          </button>

          {modelFit && (
            <button
              type="button"
              onClick={() => setShowModelFit((prev) => !prev)}
              aria-pressed={showModelFit}
              aria-label="Toggle transit model fit curve"
              className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
                showModelFit
                  ? 'bg-violet-950/70 border-violet-500/50 text-violet-300'
                  : 'bg-slate-900/80 border-slate-750 text-slate-400'
              }`}
              title="Toggle transit model fit curve"
            >
              <span>Fit Curve</span>
            </button>
          )}
        </div>
      )}

      {/* Loading overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 z-30 bg-[#070b14]/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 rounded">
          <Activity className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono text-cyan-300 tracking-wide">
            Filtering noise & folding candidate periods...
          </span>
        </div>
      )}

      {/* Main populated Recharts graph */}
      <div className="chart-grid chart-grid--populated flex-1 w-full min-h-[235px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartPoints}
            margin={{ top: 12, right: 14, bottom: 8, left: 6 }}
          >
            <CartesianGrid strokeDasharray="3 5" stroke="#2b3a4b" opacity={0.65} />
            <XAxis
              dataKey="time"
              name="Time"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: '#8293a7', fontSize: 9 }}
              tickLine={{ stroke: '#394a5d' }}
              axisLine={{ stroke: '#394a5d' }}
              tickFormatter={(val) => `${val}d`}
            />
            <YAxis
              dataKey="flux"
              name="Relative flux"
              type="number"
              domain={yDomain}
              width={56}
              tick={{ fill: '#8293a7', fontSize: 9 }}
              tickLine={{ stroke: '#394a5d' }}
              axisLine={{ stroke: '#394a5d' }}
              tickFormatter={(value: number) => value.toFixed(4)}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Highlight detected transit intervals with glowing vertical reference bands */}
            {hasDetectedTransits &&
              showIntervals &&
              detectedIntervals.map((interval, idx) => (
                <ReferenceArea
                  key={`transit-band-${interval.startTime}-${idx}`}
                  x1={interval.startTime}
                  x2={interval.endTime}
                  fill="#10b981"
                  fillOpacity={0.16}
                  stroke="#10b981"
                  strokeOpacity={0.7}
                  strokeDasharray="3 3"
                />
              ))}

            {/* Center transit markers */}
            {hasDetectedTransits &&
              showIntervals &&
              detectedIntervals.map((interval, idx) => (
                <ReferenceLine
                  key={`transit-center-${interval.centerTime}-${idx}`}
                  x={interval.centerTime}
                  stroke="#34d399"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  label={{
                    value: `T${idx + 1}`,
                    position: 'top',
                    fill: '#34d399',
                    fontSize: 9
                  }}
                />
              ))}

            {/* Model Fit Line */}
            {showModelFit && modelFit && isTransitCandidate && (
              <Line
                type="stepAfter"
                dataKey="trend"
                name="Fitted Transit Model"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Standard Photometric Observations */}
            <Scatter
              name="Observed Flux"
              dataKey="flux"
              fill="#59d6e2"
              opacity={0.78}
              shape="circle"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
