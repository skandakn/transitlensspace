import React from 'react'
import { Card } from './Card'
import { cn } from '../../lib/utils'

export interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  subtitle?: string
  icon?: React.ReactNode
  accentColor?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'slate'
  className?: string
}

export function MetricCard({
  label,
  value,
  unit,
  subtitle,
  icon,
  accentColor = 'cyan',
  className
}: MetricCardProps) {
  const accentBorders = {
    cyan: 'border-l-2 border-l-cyan-400',
    violet: 'border-l-2 border-l-violet-400',
    emerald: 'border-l-2 border-l-emerald-400',
    amber: 'border-l-2 border-l-amber-400',
    slate: 'border-l-2 border-l-slate-500'
  }

  const iconColors = {
    cyan: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
    violet: 'text-violet-400 bg-violet-950/40 border-violet-500/30',
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    slate: 'text-slate-400 bg-slate-900 border-slate-700'
  }

  return (
    <Card className={cn('p-4 overflow-hidden relative group', accentBorders[accentColor], className)}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">{label}</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
            {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
          </div>
          {subtitle && <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}
        </div>

        {icon && (
          <div
            className={cn(
              'p-2 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
              iconColors[accentColor]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
