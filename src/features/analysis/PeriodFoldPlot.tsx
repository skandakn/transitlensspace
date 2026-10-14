import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import type { LightCurvePoint, TransitEvent } from '../../types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatPeriod, formatDepth, formatRadius } from '../../lib/formatters'

export interface PeriodFoldPlotProps {
  data: LightCurvePoint[]
  candidate?: TransitEvent
  title?: string
}

export function PeriodFoldPlot({
  data,
  candidate,
  title = 'Phase-Folded Transit Profile'
}: PeriodFoldPlotProps) {
  const period = candidate?.period || 3.52
  const epoch = candidate?.epoch || 0.85

  // Fold points by period and sort by phase
  const foldedData = useMemo(() => {
    if (!data.length) return []

    const folded = data.map((pt) => {
      const rawPhase = ((pt.time - epoch) % period + period) % period
      // Center phase around 0 from -0.5 to +0.5
      const phase = rawPhase > period / 2 ? (rawPhase - period) / period : rawPhase / period
      return {
        ...pt,
        phase: parseFloat(phase.toFixed(4)),
        flux: pt.flux,
        trend: pt.trend
      }
    })

    // Sort by phase for clean line rendering
    folded.sort((a, b) => a.phase - b.phase)

    // Subsample if too dense
    const stride = folded.length > 1500 ? Math.ceil(folded.length / 1000) : 1
    return folded.filter((_, idx) => idx % stride === 0)
  }, [data, period, epoch])

  return (
    <Card className="overflow-hidden border-slate-800/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            {candidate && (
              <Badge variant="violet" className="font-mono text-[10px]">
                P = {formatPeriod(candidate.period)}
              </Badge>
            )}
          </div>
          <CardDescription>
            Photometry folded at candidate period {formatPeriod(period)} to isolate transit depth
          </CardDescription>
        </div>

        {candidate && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right font-mono text-xs">
              <span className="text-slate-400 block text-[10px]">Transit Depth</span>
              <span className="text-cyan-400 font-bold">{formatDepth(candidate.depthFraction, candidate.depthPpm)}</span>
            </div>
            {candidate.planetRadiusEarth && (
              <div className="text-right font-mono text-xs pl-3 border-l border-slate-800">
                <span className="text-slate-400 block text-[10px]">Est. Radius</span>
                <span className="text-violet-400 font-bold">{formatRadius(candidate.planetRadiusEarth)}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-2 sm:p-5 pt-0">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={foldedData}
              margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="phase"
                domain={[-0.5, 0.5]}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => val.toFixed(2)}
                label={{
                  value: 'Orbital Phase (-0.5 to +0.5)',
                  position: 'insideBottom',
                  offset: -12,
                  fill: '#64748b',
                  fontSize: 11
                }}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => val.toFixed(4)}
                label={{
                  value: 'Folded Flux',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748b',
                  fontSize: 11
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload
                    return (
                      <div className="bg-[#090e1a]/95 border border-violet-500/40 rounded-lg p-2.5 shadow-2xl text-xs font-mono space-y-1 backdrop-blur-md">
                        <div className="text-violet-400 font-bold">
                          Phase: {pt.phase.toFixed(4)}
                        </div>
                        <div className="text-slate-200">
                          Flux: <span className="text-white font-bold">{pt.flux.toFixed(6)}</span>
                        </div>
                        {pt.trend !== undefined && (
                          <div className="text-cyan-400">
                            Model: {pt.trend.toFixed(6)}
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter
                name="Folded Flux"
                dataKey="flux"
                fill="#818cf8"
                opacity={0.5}
                shape="circle"
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
              Folded Observations
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
              Limb-Darkened Model Fit
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Center: Phase 0.000 · Limb dark: u1=0.38, u2=0.22
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
