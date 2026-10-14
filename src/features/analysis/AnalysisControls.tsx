import React from 'react'
import {
  Sliders,
  Play,
  Settings2,
  Zap,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react'
import type { DetectionAlgorithm, AnalysisParameters } from '../../types'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export interface AnalysisControlsProps {
  parameters: AnalysisParameters
  onChangeParameters: (params: AnalysisParameters) => void
  onRunAnalysis: () => void
  isAnalyzing: boolean
}

export function AnalysisControls({
  parameters,
  onChangeParameters,
  onRunAnalysis,
  isAnalyzing
}: AnalysisControlsProps) {
  const algorithms: { id: DetectionAlgorithm; label: string; desc: string }[] = [
    {
      id: 'BLS',
      label: 'Box Least Squares (BLS)',
      desc: 'Standard Kovács algorithm for square/box dip periodic signals'
    },
    {
      id: 'TLS',
      label: 'Transit Least Squares (TLS)',
      desc: 'Physically realistic limb-darkened planet transit shapes with ingress/egress'
    },
    {
      id: 'PhaseFold',
      label: 'Supervised Phase Fold',
      desc: 'Grid search optimized for known multi-planet orbital periods'
    }
  ]

  const handleChange = <K extends keyof AnalysisParameters>(
    key: K,
    value: AnalysisParameters[K]
  ) => {
    onChangeParameters({
      ...parameters,
      [key]: value
    })
  }

  return (
    <Card className="border-slate-800/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <CardTitle>Detection Engine Parameters</CardTitle>
          </div>
          <Badge variant="cyan" className="font-mono text-[10px]">
            {parameters.algorithm} Active
          </Badge>
        </div>
        <CardDescription>
          Configure transit search grid, duration limits, and signal-to-noise ratio filters
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Algorithm Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Algorithm Pipeline
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {algorithms.map((algo) => {
              const isSelected = parameters.algorithm === algo.id
              return (
                <button
                  key={algo.id}
                  onClick={() => handleChange('algorithm', algo.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{algo.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                    {algo.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Period Grid Ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Min Period</span>
              <span className="font-mono text-cyan-400 font-bold">{parameters.minPeriodDays} d</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={10.0}
              step={0.1}
              value={parameters.minPeriodDays}
              onChange={(e) => handleChange('minPeriodDays', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Max Period</span>
              <span className="font-mono text-cyan-400 font-bold">{parameters.maxPeriodDays} d</span>
            </div>
            <input
              type="range"
              min={10.0}
              max={100.0}
              step={1.0}
              value={parameters.maxPeriodDays}
              onChange={(e) => handleChange('maxPeriodDays', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">SNR Threshold</span>
              <span className="font-mono text-violet-400 font-bold">{parameters.snrThreshold} σ</span>
            </div>
            <input
              type="range"
              min={5.0}
              max={15.0}
              step={0.5}
              value={parameters.snrThreshold}
              onChange={(e) => handleChange('snrThreshold', parseFloat(e.target.value))}
              className="w-full accent-violet-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Trigger */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-mono">
            Grid Resolution: <span className="text-slate-300 font-bold">{parameters.periodSteps.toLocaleString()} steps</span>
          </div>

          <Button
            variant="primary"
            size="md"
            isLoading={isAnalyzing}
            onClick={onRunAnalysis}
            leftIcon={<Play className="w-4 h-4 fill-current" />}
          >
            {isAnalyzing ? 'Searching Grid...' : 'Run Analysis Pipeline'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
