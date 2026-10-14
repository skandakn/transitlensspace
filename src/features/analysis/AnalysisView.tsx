import React from 'react'
import {
  Activity,
  Layers,
  Sparkles,
  Telescope
} from 'lucide-react'
import type {
  StarObservation,
  LightCurvePoint,
  AnalysisResult,
  AnalysisParameters
} from '../../types'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LightCurveViewer } from './LightCurveViewer'
import { PeriodFoldPlot } from './PeriodFoldPlot'
import { AnalysisControls } from './AnalysisControls'
import { AnalysisResultsPanel } from './AnalysisResultsPanel'
import {
  formatPeriod,
  formatRadius,
  formatTemperature,
  formatStellarRadius
} from '../../lib/formatters'

export interface AnalysisViewProps {
  star: StarObservation
  lightCurve: LightCurvePoint[]
  result: AnalysisResult
  parameters: AnalysisParameters
  onChangeParameters: (params: AnalysisParameters) => void
  onRunAnalysis: () => void
  isAnalyzing: boolean
}

export function AnalysisView({
  star,
  lightCurve,
  result,
  parameters,
  onChangeParameters,
  onRunAnalysis,
  isAnalyzing
}: AnalysisViewProps) {
  const candidate = result.bestCandidate

  return (
    <div className="space-y-6">
      {/* Target Star Banner & Telemetry Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-violet-950/30 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              {star.name}
            </h1>
            <Badge variant="cyan" className="font-mono text-xs">
              {star.id}
            </Badge>
            <Badge variant="violet" className="text-xs">
              {star.mission} {star.sectorOrQuarter}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            {star.description}
          </p>
        </div>

        {/* Quick star astrophysical stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
          <div>
            <span className="text-slate-400 block text-[10px]">Teff</span>
            <span className="text-amber-300 font-bold">{formatTemperature(star.temperature)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Radius</span>
            <span className="text-cyan-300 font-bold">{formatStellarRadius(star.stellarRadius)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Magnitude</span>
            <span className="text-slate-200 font-bold">{star.magnitude} mag</span>
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Photometric Points"
          value={lightCurve.length.toLocaleString()}
          unit="cadences"
          subtitle="Time series points analyzed"
          icon={<Layers className="w-4 h-4" />}
          accentColor="cyan"
        />

        <MetricCard
          label="Best Candidate SNR"
          value={candidate?.snr ? candidate.snr.toFixed(1) : '—'}
          unit="σ"
          subtitle={candidate ? 'High confidence detection' : 'No signal above threshold'}
          icon={<Sparkles className="w-4 h-4" />}
          accentColor="violet"
        />

        <MetricCard
          label="Orbital Period"
          value={candidate ? formatPeriod(candidate.period) : '—'}
          subtitle={candidate ? `Duration: ${candidate.durationHours} hrs` : 'Awaiting period scan'}
          icon={<Activity className="w-4 h-4" />}
          accentColor="emerald"
        />

        <MetricCard
          label="Transit Depth"
          value={candidate ? `${candidate.depthPpm}` : '—'}
          unit={candidate ? 'ppm' : ''}
          subtitle={candidate?.planetRadiusEarth ? `Est. Radius: ${formatRadius(candidate.planetRadiusEarth)}` : 'Limb darkening fit'}
          icon={<Telescope className="w-4 h-4" />}
          accentColor="amber"
        />
      </div>

      {/* Main Charts: Light Curve Time Series & Folded Profile */}
      <div className="space-y-6">
        <LightCurveViewer
          data={lightCurve}
          bestCandidate={candidate}
          isAnalyzing={isAnalyzing}
          title={`Raw Photometry: ${star.name}`}
          subtitle={`Continuous flux measurements from ${star.mission} observatory`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PeriodFoldPlot
              data={lightCurve}
              candidate={candidate}
              title={`Folded Transit Model: ${candidate?.name || 'Primary Dip'}`}
            />
          </div>

          <div className="lg:col-span-1">
            <AnalysisControls
              parameters={parameters}
              onChangeParameters={onChangeParameters}
              onRunAnalysis={onRunAnalysis}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>
      </div>

      {/* Member 6 Analysis Results Panel & Measurement Evidence */}
      <AnalysisResultsPanel
        observation={star}
        lightCurve={lightCurve}
        status={result.status}
        result={result}
        isAnalyzing={isAnalyzing}
        canAnalyze={!isAnalyzing && lightCurve.length >= 15}
        onRunAnalysis={onRunAnalysis}
        onResetAnalysis={() => {}}
      />

      {/* Transit Candidates Summary Table */}
      <Card className="border-slate-800/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Detected Transit Candidates</CardTitle>
            <CardDescription>
              Signals identified by the {parameters.algorithm} pipeline on {star.name}
            </CardDescription>
          </div>
          <Badge variant="cyan" className="font-mono text-xs">
            {result.transitEvents.length} Candidate(s)
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090e1a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Candidate ID</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Depth (ppm)</th>
                  <th className="py-3 px-4">Radius (R⊕)</th>
                  <th className="py-3 px-4">SNR</th>
                  <th className="py-3 px-4">Disposition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.transitEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-200">
                      <div className="text-white">{evt.name || evt.id}</div>
                      <div className="text-[10px] text-slate-400">{evt.id}</div>
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">
                      {formatPeriod(evt.period)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {evt.durationHours} hrs
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {evt.depthPpm.toLocaleString()} ppm
                    </td>
                    <td className="py-3 px-4 text-violet-300 font-bold">
                      {evt.planetRadiusEarth ? formatRadius(evt.planetRadiusEarth) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-bold">{evt.snr} σ</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          evt.disposition === 'CONFIRMED'
                            ? 'success'
                            : evt.disposition === 'CANDIDATE'
                            ? 'cyan'
                            : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {evt.disposition}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
