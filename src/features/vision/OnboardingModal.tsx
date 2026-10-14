import React, { useState, useEffect } from 'react'
import {
  Camera,
  Hand,
  RotateCw,
  Crosshair,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

export interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onEnableCamera?: () => void
}

interface Step {
  title: string
  action: string
  description: string
  icon: React.ReactNode
  badge: string
}

const STEPS: Step[] = [
  {
    title: 'Enable Cockpit Vision',
    action: 'Enable Camera',
    description:
      'Activate your browser camera for optical tracking. Processing runs 100% locally on your machine via WebAssembly—zero video is stored or transmitted.',
    icon: <Camera className="w-8 h-8 text-cyan-400" />,
    badge: 'Step 1 of 5',
  },
  {
    title: 'Engage Hand Tracker',
    action: 'Show an Open Palm',
    description:
      'Hold your hand upright in front of the camera with all five fingers spread. The neural tracker will lock onto your hand coordinates immediately.',
    icon: <Hand className="w-8 h-8 text-cyan-300" />,
    badge: 'Step 2 of 5',
  },
  {
    title: 'Navigate Cosmic Space',
    action: 'Move Hand to Rotate',
    description:
      'Glide your open hand left, right, up, or down to rotate the 3D celestial sphere. Tilt your head for subtle parallax depth adjustments.',
    icon: <RotateCw className="w-8 h-8 text-violet-400" />,
    badge: 'Step 3 of 5',
  },
  {
    title: 'Lock Celestial Target',
    action: 'Pinch to Select',
    description:
      'Bring your thumb and index fingertip together into a pinch gesture to lock onto and select an exoplanetary system or star.',
    icon: <Crosshair className="w-8 h-8 text-amber-400" />,
    badge: 'Step 4 of 5',
  },
  {
    title: 'Inspect & Analyze',
    action: 'Release Pinch to Finish',
    description:
      'Release the pinch gesture to confirm your selection and open high-resolution transit telemetry and light curve inspection.',
    icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
    badge: 'Step 5 of 5',
  },
]

export function OnboardingModal({ isOpen, onClose, onEnableCamera }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < STEPS.length - 1) {
          setCurrentStep((s) => s + 1)
        } else {
          onClose()
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((s) => s - 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep, onClose])

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      if (onEnableCamera) onEnableCamera()
      onClose()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vision-onboarding-title"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-[#070b14]/95 border border-cyan-500/30 p-5 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100 font-sans hud-scroll">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 id="vision-onboarding-title" className="text-sm font-bold tracking-wider uppercase text-cyan-300 font-mono">
                Cockpit Vision Flight Guide
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Body & Gesture Control for Space Simulator
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Visual Body */}
        <div className="my-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {step.badge}
            </span>
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  aria-label={`Go to step ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'w-2 bg-slate-800 hover:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800/80 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-violet-950/60 border border-cyan-500/30 shadow-inner flex-shrink-0">
              <div className="absolute inset-0 rounded-2xl animate-pulse bg-cyan-500/5" />
              {step.icon}
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                {step.action}
              </div>
              <h3 className="text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-200/90 mb-5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Local Privacy Guaranteed:</strong> MediaPipe processes frames strictly inside your browser. No video is ever recorded or uploaded.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <span>{isLast ? 'Enter Space Simulator' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
