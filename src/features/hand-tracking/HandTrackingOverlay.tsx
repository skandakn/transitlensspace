/**
 * HandTrackingOverlay Component
 * 
 * Picture-in-picture floating overlay rendering real-time webcam stream,
 * 21-point hand skeleton canvas, pinch indicators, gesture badges,
 * and user camera controls with complete privacy assurances.
 */

import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CameraOff,
  Minimize2,
  Maximize2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react'
import type { UseHandTrackingReturn } from './useHandTracking'
import type { SingleHandData } from '../../types/gestures'

// 21-point hand skeleton connection graph (MediaPipe HandLandmarker topology)
const SKELETON_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm knuckle loop
  [5, 9], [9, 13], [13, 17]
]

export interface HandTrackingOverlayProps {
  tracking: UseHandTrackingReturn
  className?: string
  onToggleDemoPanel?: () => void
  showDemoButton?: boolean
}

export function HandTrackingOverlay({
  tracking,
  className = '',
  onToggleDemoPanel,
  showDemoButton = true
}: HandTrackingOverlayProps) {
  const {
    videoRef,
    status,
    currentFrame,
    errorMessage,
    isCameraActive,
    isLoading,
    fps,
    enableCamera,
    disableCamera
  } = tracking

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  // Ensure mirrored preview video element is connected to active stream
  useEffect(() => {
    const el = videoRef.current
    if (isCameraActive && el && tracking.stream) {
      el.muted = true
      el.defaultMuted = true
      el.playsInline = true
      el.autoplay = true
      if (el.srcObject !== tracking.stream) {
        el.srcObject = tracking.stream
      }
      el.play().catch(() => {})
    }
  }, [isCameraActive, tracking.stream, videoRef])

  // Draw 21-point skeleton and gesture reticles on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)

    if (!currentFrame || !currentFrame.hands || currentFrame.hands.length === 0) {
      return
    }

    currentFrame.hands.forEach((hand: SingleHandData) => {
      const landmarks = hand.smoothedLandmarks
      if (!landmarks || landmarks.length < 21) return

      // Determine color palette based on active gesture
      let strokeColor = 'rgba(89, 214, 226, 0.7)' // Cyan for navigation
      let jointColor = '#59d6e2'
      if (hand.isPinching) {
        strokeColor = 'rgba(234, 179, 8, 0.9)' // Amber / Gold for pinch
        jointColor = '#eab308'
      } else if (hand.gesture === 'closed-fist') {
        strokeColor = 'rgba(244, 63, 94, 0.8)' // Rose for fist
        jointColor = '#f43f5e'
      }

      // Draw skeleton bones
      ctx.lineWidth = 2.5
      ctx.strokeStyle = strokeColor
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      SKELETON_CONNECTIONS.forEach(([i, j]) => {
        const pt1 = landmarks[i]
        const pt2 = landmarks[j]
        if (!pt1 || !pt2) return

        // Invert X because camera preview is mirrored for natural interaction
        const x1 = (1 - pt1.x) * width
        const y1 = pt1.y * height
        const x2 = (1 - pt2.x) * width
        const y2 = pt2.y * height

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // Draw landmark joints
      landmarks.forEach((pt, idx) => {
        const x = (1 - pt.x) * width
        const y = pt.y * height

        ctx.beginPath()
        const isTip = [4, 8, 12, 16, 20].includes(idx)
        const radius = isTip ? 4.5 : 2.5
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = isTip ? '#ffffff' : jointColor
        ctx.fill()
        ctx.strokeStyle = jointColor
        ctx.lineWidth = 1.2
        ctx.stroke()
      })

      // Draw Palm Center Reticle
      const palmX = (1 - hand.palmCenter.x) * width
      const palmY = hand.palmCenter.y * height
      ctx.beginPath()
      ctx.arc(palmX, palmY, 7, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)' // Purple target ring
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.stroke()
      ctx.setLineDash([])

      // Draw Pinch Indicator between Thumb Tip (4) and Index Tip (8)
      const thumbX = (1 - hand.thumbTip.x) * width
      const thumbY = hand.thumbTip.y * height
      const indexX = (1 - hand.indexTip.x) * width
      const indexY = hand.indexTip.y * height

      ctx.beginPath()
      ctx.moveTo(thumbX, thumbY)
      ctx.lineTo(indexX, indexY)
      ctx.strokeStyle = hand.isPinching
        ? 'rgba(234, 179, 8, 1)'
        : 'rgba(255, 255, 255, 0.35)'
      ctx.lineWidth = hand.isPinching ? 3 : 1.5
      ctx.stroke()

      if (hand.isPinching) {
        // Pinch midpoint burst ring
        const midX = (thumbX + indexX) / 2
        const midY = (thumbY + indexY) / 2
        ctx.beginPath()
        ctx.arc(midX, midY, 9, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(234, 179, 8, 0.35)'
        ctx.fill()
        ctx.strokeStyle = '#fef08a'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })

    // If two hands are detected, draw zoom connection line between palm centers
    if (currentFrame.hands.length >= 2) {
      const h1 = currentFrame.hands[0]
      const h2 = currentFrame.hands[1]
      const p1x = (1 - h1.palmCenter.x) * width
      const p1y = h1.palmCenter.y * height
      const p2x = (1 - h2.palmCenter.x) * width
      const p2y = h2.palmCenter.y * height

      ctx.beginPath()
      ctx.moveTo(p1x, p1y)
      ctx.lineTo(p2x, p2y)
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [currentFrame])

  // Friendly gesture label descriptor
  const getGestureBadge = () => {
    if (!currentFrame || !currentFrame.isTracking) {
      if (status === 'tracking-lost') {
        return { label: 'Hand Not Detected', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
      }
      return { label: 'Awaiting Hand', color: 'bg-slate-700/40 text-slate-400 border-slate-600/30' }
    }

    if (currentFrame.gesture === 'two-hand-zoom') {
      return { label: '👐 Two-Hand Zoom', color: 'bg-purple-500/20 text-purple-300 border-purple-500/50' }
    }

    switch (currentFrame.gesture) {
      case 'pinch':
        return { label: '🤏 Pinch (Select/Grab)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/50' }
      case 'open-palm':
        return { label: '🖐️ Open Palm (Navigate)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' }
      case 'closed-fist':
        return { label: '✊ Closed Fist (Paused)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/50' }
      case 'pointing':
        return { label: '☝️ Pointing', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' }
      default:
        return { label: '🖐️ Tracking Hand', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' }
    }
  }

  const badge = getGestureBadge()

  return (
    <div
      className={`hud-interactive fixed bottom-6 left-6 z-40 transition-all duration-200 select-none ${className}`}
      id="hand-tracking-overlay"
    >
      <div className="relative rounded-xl border border-cyan-500/30 bg-[#060c18]/90 backdrop-blur-md shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Top Header Strip */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'tracking'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : status === 'tracking-lost'
                  ? 'bg-amber-400 animate-pulse'
                  : isLoading
                  ? 'bg-cyan-400 animate-spin'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              Hand Tracking
              {isCameraActive && fps > 0 && (
                <span className="text-[10px] font-mono text-cyan-400 font-normal">
                  ({fps} fps)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            {showDemoButton && onToggleDemoPanel && (
              <button
                type="button"
                onClick={onToggleDemoPanel}
                className="p-1 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                title="Open Gesture Recognition Telemetry & Inspector"
                aria-label="Toggle Gesture Telemetry Panel"
              >
                <Layers size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowInstructions((prev) => !prev)}
              className="p-1 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
              title="Show gesture guide"
              aria-label="Toggle Gesture Guide"
            >
              <HelpCircle size={14} />
            </button>

            {isCameraActive && (
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                className="p-1 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                title={isMinimized ? 'Expand camera' : 'Minimize camera'}
                aria-label={isMinimized ? 'Expand Camera Feed' : 'Minimize Camera Feed'}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
            )}

            {isCameraActive ? (
              <button
                type="button"
                onClick={disableCamera}
                className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded transition-colors"
                title="Stop camera"
                aria-label="Stop Camera"
              >
                <CameraOff size={14} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Instructions Drawer */}
        {showInstructions && (
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 text-[11px] space-y-1.5 text-slate-300">
            <div className="font-semibold text-cyan-300 flex items-center gap-1">
              <Sparkles size={12} /> Gesture Controls:
            </div>
            <ul className="space-y-1 pl-1 font-mono text-[10px]">
              <li><span className="text-cyan-300">🖐️ Open Palm:</span> Pan & orbit universe</li>
              <li><span className="text-amber-300">🤏 Thumb-Index Pinch:</span> Select target body</li>
              <li><span className="text-rose-300">✊ Closed Fist:</span> Pause navigation</li>
              <li><span className="text-purple-300">👐 Two Hands Apart:</span> Proportional zoom</li>
            </ul>
          </div>
        )}

        {/* Inactive / Permission Prompt State */}
        {!isCameraActive && (
          <div className="p-4 w-72 text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera size={20} />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-100">
                Webcam Hand Control
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Control the 3D universe with hand gestures. Camera starts only when enabled.
              </p>
            </div>

            {errorMessage && (
              <div className="p-2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] text-left flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={enableCamera}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(89,214,226,0.25)] cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Camera size={14} />
                  <span>Enable Camera</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>100% on-device · No video recorded</span>
            </div>
          </div>
        )}

        {/* Active Webcam Feed with Canvas Skeleton Overlay */}
        {isCameraActive && (
          <div className={isMinimized ? 'hidden' : 'block'}>
            <div className="relative w-64 h-48 bg-black overflow-hidden">
              {/* Hidden or mirrored raw video element */}
              <video
                ref={(node) => {
                  if (videoRef) {
                    ;(videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node
                  }
                  if (node && tracking.stream) {
                    node.muted = true
                    node.defaultMuted = true
                    node.playsInline = true
                    node.autoplay = true
                    if (node.srcObject !== tracking.stream) {
                      node.srcObject = tracking.stream
                    }
                    node.play().catch(() => {})
                  }
                }}
                className="w-full h-full object-cover transform scale-x-[-1]"
                playsInline
                muted
                autoPlay
              />

              {/* Real-time 21-point Skeleton Drawing Canvas */}
              <canvas
                ref={canvasRef}
                width={256}
                height={192}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Live Gesture Badge pill */}
              <div className="absolute top-2 left-2 pointer-events-none">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border backdrop-blur-md shadow-sm ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>

              {/* Status Banner when searching for hands */}
              {status === 'tracking-lost' && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center text-center p-3 pointer-events-none">
                  <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg p-2 text-amber-300 text-[11px] shadow-lg animate-pulse">
                    🖐️ Wave hand in front of camera
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status bar */}
            <div className="px-3 py-1.5 bg-[#040810] border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck size={11} />
                <span>On-Device</span>
              </span>
              <span>
                {currentFrame?.hands.length
                  ? `${currentFrame.hands.length} Hand${currentFrame.hands.length > 1 ? 's' : ''}`
                  : 'Searching'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
