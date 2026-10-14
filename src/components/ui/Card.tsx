import React from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowBorder?: boolean
}

export function Card({ className, glowBorder = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#0c1322]/85 border border-slate-800/90 text-slate-100 shadow-xl backdrop-blur-md transition-all duration-200',
        glowBorder && 'hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-5 border-b border-slate-800/60', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-semibold text-lg leading-tight tracking-wide text-slate-100 flex items-center gap-2', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-slate-400 leading-relaxed', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center p-5 pt-0 border-t border-slate-800/60 mt-4', className)} {...props}>
      {children}
    </div>
  )
}
