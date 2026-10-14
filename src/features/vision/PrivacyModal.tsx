import React from 'react'
import { Shield, EyeOff, Cpu, Video, Check, X, Sparkles } from 'lucide-react'

export interface PrivacyModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onTryDemo: () => void
}

export function PrivacyModal({ isOpen, onClose, onConfirm, onTryDemo }: PrivacyModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vision-privacy-title"
    >
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-[#070b14]/95 border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100 font-sans hud-scroll">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="vision-privacy-title" className="text-sm font-bold tracking-wider uppercase text-cyan-300 font-mono">
                Vision & Camera Privacy
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Local In-Browser MediaPipe Processing
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close privacy notice"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guarantees List */}
        <div className="my-5 space-y-3">
          <div className="p-3 rounded-xl bg-[#090f1e] border border-slate-800/80 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white">100% On-Device Processing</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Face and hand landmark detection runs directly on your CPU/GPU using Google MediaPipe WebAssembly. No frames leave your computer.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090f1e] border border-slate-800/80 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white">Zero Facial Recognition</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Only geometric position contours are calculated for motion tracking. Identity, biometrics, or personal identifiers are never stored or analyzed.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#090f1e] border border-slate-800/80 flex items-start gap-3">
            <Video className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white">No Recording or Uploads</div>
              <p className="text-[11px] text-slate-400 leading-normal">
                The video stream exists strictly in temporary browser memory. You can disable, reposition, or minimize the camera feed at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Grant Camera Access & Launch</span>
          </button>

          <button
            onClick={() => {
              onTryDemo()
              onClose()
            }}
            className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-750 text-slate-300 text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Try in Interactive Demo Mode (No Camera)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
