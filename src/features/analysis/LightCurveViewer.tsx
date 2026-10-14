import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart
} from 'recharts'
import { Filter, Sparkles } from 'lucide-react'
import type { LightCurvePoint, TransitEvent } from '../../types'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'

export interface LightCurveViewerProps {
  data: LightCurvePoint[]
  bestCandidate?: TransitEvent
  isAnalyzing?: boolean
  onPointSelect?: (point: LightCurvePoint) => void
  title?: string
  subtitle?: string
}

export function LightCurveViewer({
  data,
  bestCandidate,
  isAnalyzing = false,
  title = 'Raw Photometric Time Series',
  subtitle = 'Normalized relative flux observed over mission baseline'
}: LightCurveViewerProps) {
  const [showTrend, setShowTrend] = useState(true)
  const [filterTransitsOnly, setFilterTransitsOnly] = useState(false)

  // Compute min/max for dynamic y-axis scaling
  const { yDomain, samplePoints } = useMemo(() => {
    if (!data.length) return { yDomain: [0.99, 1.01], samplePoints: [] }
    
    // Sample points if too large to keep Recharts buttery smooth
    const stride = data.length > 2000 ? Math.ceil(data.length / 1500) : 1
    const sampled = data.filter((_, idx) => idx % stride === 0)

    let minFlux = 1.0
    let maxFlux = 1.0

    for (const pt of sampled) {
      if (pt.flux < minFlux) minFlux = pt.flux
      if (pt.flux > maxFlux) maxFlux = pt.flux
    }

    const padding = (maxFlux - minFlux) * 0.15 || 0.002
    return {
      yDomain: [
        parseFloat((minFlux - padding).toFixed(5)),
        parseFloat((maxFlux + padding).toFixed(5))
      ],
      samplePoints: sampled
    }
  }, [data])

  const displayPoints = useMemo(() => {
    if (filterTransitsOnly) {
      return samplePoints.filter((p) => p.isTransit)
    }
    return samplePoints
  }, [samplePoints, filterTransitsOnly])

  return (
    <Card className="overflow-hidden border-slate-800/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant="cyan" className="font-mono text-[10px]">
              {data.length.toLocaleString()} Obs
            </Badge>
            {bestCandidate && (
              <Badge variant="success" className="font-mono text-[10px] hidden sm:inline-flex">
                Dip Detected (SNR {bestCandidate.snr})
              </Badge>
            )}
          </div>
          <CardDescription>{subtitle}</CardDescription>
        </div>

        {/* Chart Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant={showTrend ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowTrend(!showTrend)}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Model Trend</span>
          </Button>
          <Button
            variant={filterTransitsOnly ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterTransitsOnly(!filterTransitsOnly)}
            className="text-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In-Transit Only</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-5 pt-0">
        <div className="h-72 sm:h-80 w-full relative">
          {isAnalyzing && (
            <div className="absolute inset-0 bg-[#0c1322]/70 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <p className="text-xs font-mono text-cyan-300 tracking-wide">
                Executing period spectrum scan & detrending...
              </p>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayPoints}
              margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="time"
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${val}d`}
                label={{
                  value: 'Observation Time (Days)',
                  position: 'insideBottom',
                  offset: -12,
                  fill: '#64748b',
                  fontSize: 11
                }}
              />
              <YAxis
                domain={yDomain}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => val.toFixed(4)}
                label={{
                  value: 'Relative Flux',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748b',
                  fontSize: 11
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload as LightCurvePoint
                    return (
                      <div className="bg-[#090e1a]/95 border border-cyan-500/40 rounded-lg p-2.5 shadow-2xl text-xs font-mono space-y-1 backdrop-blur-md">
                        <div className="text-cyan-400 font-bold">
                          Time: {pt.time.toFixed(4)} d
                        </div>
                        <div className="text-slate-200">
                          Flux: <span className="text-white font-bold">{pt.flux.toFixed(6)}</span>
                        </div>
                        {pt.trend !== undefined && (
                          <div className="text-violet-400">
                            Fit Model: {pt.trend.toFixed(6)}
                          </div>
                        )}
                        {pt.isTransit && (
                          <div className="text-emerald-400 font-bold flex items-center gap-1 mt-1">
                            <Sparkles className="w-3 h-3" />
                            Transit Window
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />

              {/* Raw flux data points */}
              <Scatter
                name="Flux"
                dataKey="flux"
                fill="#22d3ee"
                opacity={0.65}
                shape="circle"
              />

              {/* Transit fit trendline */}
              {showTrend && (
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Light curve footer metadata */}
        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              Observed Flux
            </span>
            {showTrend && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-violet-400 inline-block" />
                Transit Model
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Baseline Flux: 1.0000 · RMS Photometric Noise: 0.00074
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
