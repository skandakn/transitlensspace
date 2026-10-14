import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer'

    const variants = {
      primary:
        'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_18px_rgba(6,182,212,0.35)] hover:shadow-[0_0_24px_rgba(6,182,212,0.55)] border border-cyan-400/30',
      secondary:
        'bg-violet-600/80 hover:bg-violet-500 text-white font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_22px_rgba(139,92,246,0.5)] border border-violet-500/40',
      outline:
        'border border-slate-750 hover:border-cyan-500/70 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 hover:text-cyan-300 backdrop-blur-sm',
      ghost:
        'text-slate-300 hover:text-white hover:bg-slate-800/60',
      danger:
        'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400/60'
    }

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'h-9 w-9 p-0'
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
