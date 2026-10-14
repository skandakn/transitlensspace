import React from 'react'
import { Clock, Play, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react'
import type { AnalysisStatus } from '../../types'
import { Badge } from './Badge'

export interface StatusBadgeProps {
  status: AnalysisStatus
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  switch (status) {
    case 'idle':
      return (
        <Badge variant="outline" className={className}>
          {showIcon && <Clock className="w-3 h-3 text-slate-400" />}
          <span className="uppercase tracking-wider text-[10px]">Standby</span>
        </Badge>
      )
    case 'queued':
      return (
        <Badge variant="warning" className={className}>
          {showIcon && <Clock className="w-3 h-3 text-amber-400" />}
          <span className="uppercase tracking-wider text-[10px]">Queued</span>
        </Badge>
      )
    case 'running':
      return (
        <Badge variant="cyan" pulseDot className={className}>
          {showIcon && <Play className="w-3 h-3 fill-cyan-400 text-cyan-400 animate-pulse" />}
          <span className="uppercase tracking-wider text-[10px] font-semibold">Running</span>
        </Badge>
      )
    case 'completed':
      return (
        <Badge variant="success" className={className}>
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          <span className="uppercase tracking-wider text-[10px] font-semibold">Completed</span>
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="danger" className={className}>
          {showIcon && <AlertTriangle className="w-3 h-3 text-rose-400" />}
          <span className="uppercase tracking-wider text-[10px]">Failed</span>
        </Badge>
      )
    case 'aborted':
      return (
        <Badge variant="default" className={className}>
          {showIcon && <RotateCcw className="w-3 h-3 text-slate-400" />}
          <span className="uppercase tracking-wider text-[10px]">Aborted</span>
        </Badge>
      )
    default:
      return (
        <Badge variant="default" className={className}>
          <span className="uppercase tracking-wider text-[10px]">{status}</span>
        </Badge>
      )
  }
}
