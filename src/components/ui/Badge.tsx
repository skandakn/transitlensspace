import React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'cyan' | 'violet' | 'success' | 'warning' | 'danger' | 'outline'
  pulseDot?: boolean
}

export function Badge({
  className,
  variant = 'default',
  pulseDot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    cyan: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    violet: 'bg-violet-950/70 text-violet-300 border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    danger: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
    outline: 'bg-transparent text-slate-300 border-slate-700'
  }

  const dotColors = {
    default: 'bg-slate-400',
    cyan: 'bg-cyan-400',
    violet: 'bg-violet-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    outline: 'bg-slate-400'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {pulseDot && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              dotColors[variant]
            )}
          />
          <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColors[variant])} />
        </span>
      )}
      {children}
    </span>
  )
}
