import type { HandTrackingState } from './types'

export interface GestureHUDProps {
  handState?: HandTrackingState
  isCameraActive: boolean
}

export function GestureHUD({
  handState,
  isCameraActive,
}: GestureHUDProps) {
  const isHandDetected = Boolean(handState?.isHandDetected)
  const gesture = handState?.detectedGesture ?? 'none'
  const isPinching = Boolean(handState?.isPinching)
  const handPos = handState?.handPosition

  if (!isCameraActive || !isHandDetected || !handPos) return null

  return (
    <div
          className="fixed pointer-events-none z-40 transition-transform duration-75 ease-out"
          style={{
            left: `${handPos.x * 100}%`,
            top: `${handPos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          aria-hidden="true"
        >
          <div className="relative flex items-center justify-center">
            {/* Outer Reticle Ring */}
            <div
              className={`rounded-full border transition-all duration-150 ${
                isPinching
                  ? 'w-10 h-10 border-amber-400 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-ping-slow'
                  : 'w-8 h-8 border-cyan-400/80 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
              }`}
            />

            {/* Center Aiming Dot */}
            <div
              className={`absolute w-1.5 h-1.5 rounded-full ${
                isPinching ? 'bg-amber-300' : 'bg-cyan-300'
              }`}
            />

            {/* Gesture Badge Next to Hand */}
            <div
              className={`absolute left-7 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap backdrop-blur-md uppercase border ${
                isPinching
                  ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                  : 'bg-[#070b14]/90 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {isPinching ? 'LOCK PINCH' : gesture.replace('_', ' ')}
            </div>
          </div>
    </div>
  )
}
