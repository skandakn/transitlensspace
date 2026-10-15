/**
 * NavigationHint - contextual floating overlay that shows navigation shortcuts.
 */
import { useState, useEffect } from 'react'
import { X, Keyboard, Hand, Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface NavigationHintProps {
  isCameraActive?: boolean
  isVisible?: boolean
  onDismiss?: () => void
}

export function NavigationHint({ isCameraActive = false, isVisible, onDismiss }: NavigationHintProps) {
  const [internalVisible, setInternalVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const visible = isVisible !== undefined ? isVisible : internalVisible

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true)
      setTimeout(() => { setInternalVisible(false); onDismiss?.() }, 400)
    }, 9000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const handleDismiss = () => {
    setIsAnimating(true)
    setTimeout(() => { setInternalVisible(false); onDismiss?.() }, 300)
  }

  if (!visible) return null

  return (
    <div
      className={`pointer-events-auto transition-all duration-300 ${
        isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      role="tooltip"
      aria-label="Navigation guide"
    >
      <div className="relative p-3 rounded-2xl bg-[#070b14]/92 border border-slate-700/60 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-[11px] font-mono w-60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Navigation Guide</span>
          <button onClick={handleDismiss} className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer" title="Dismiss" aria-label="Dismiss">
            <X size={11} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Keyboard size={9} className="text-slate-500 shrink-0" />
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Keyboard</span>
        </div>
        <div className="ml-3 space-y-1 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Cycle stars</span>
            <div className="flex gap-0.5">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[9px]"><ChevronLeft size={8} className="inline" /></kbd>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[9px]"><ChevronRight size={8} className="inline" /></kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Search</span>
            <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[9px] flex items-center gap-0.5"><Search size={7} /><span>Ctrl+K</span></kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Close panel</span>
            <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[9px]">Esc</kbd>
          </div>
        </div>
        <div className="border-t border-slate-800/80 mb-1.5" />
        <div className="flex items-center gap-1.5 mb-1.5">
          <Hand size={9} className="text-slate-500 shrink-0" />
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Gesture {isCameraActive ? '' : '(camera off)'}</span>
        </div>
        <div className="ml-3 space-y-1 mb-2">
          {!isCameraActive ? (
            <p className="text-slate-500 text-[9px] italic">Enable camera for gesture control</p>
          ) : (
            <>
              <div className="flex justify-between"><span className="text-slate-400">Navigate</span><span className="text-cyan-400">🤚 Open palm</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Select star</span><span className="text-amber-400">🤌 Pinch</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Zoom</span><span className="text-violet-400">🤲 Two hands</span></div>
            </>
          )}
        </div>
        <div className="border-t border-slate-800/80 mb-1.5" />
        <div className="ml-3 space-y-1">
          <div className="flex justify-between"><span className="text-slate-400">Rotate</span><span className="text-slate-500">Left drag</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Zoom</span><span className="text-slate-500">Scroll</span></div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-600 text-center">Click a system below • Press ? to reopen</div>
      </div>
    </div>
  )
}
