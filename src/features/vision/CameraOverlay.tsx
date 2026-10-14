import React, { useRef, useEffect } from 'react'
import {
  CameraOff,
  Minimize2,
  Maximize2,
  Move,
  Compass,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { CameraPosition, CameraState, FaceTrackingState, HandTrackingState } from './types'

export interface CameraOverlayProps {
  cameraState: CameraState
  faceState: FaceTrackingState
  handState?: HandTrackingState
  videoRef: React.RefObject<HTMLVideoElement | null>
  isDemoMode?: boolean
  onToggleCamera: () => void
  onToggleMinimize: () => void
  onCyclePosition: () => void
  onToggleHeadAdjustments: () => void
  onEnableDemoMode: () => void
  className?: string
}

const POSITION_STYLES: Record<CameraPosition, string> = {
  'top-right': 'top-16 right-4',
  'bottom-right': 'bottom-20 right-4',
  'top-left': 'top-16 left-4',
  'bottom-left': 'bottom-24 left-4',
}

export function CameraOverlay({
  cameraState,
  faceState,
  handState,
  videoRef,
  isDemoMode = false,
  onToggleCamera,
  onToggleMinimize,
  onCyclePosition,
  onToggleHeadAdjustments,
  onEnableDemoMode,
  className = '',
}: CameraOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Ensure mirrored preview video element is connected to active stream
  useEffect(() => {
    const el = videoRef.current
    if (cameraState.isActive && el && cameraState.stream) {
      el.muted = true
      el.defaultMuted = true
      el.playsInline = true
      el.autoplay = true
      if (el.srcObject !== cameraState.stream) {
        el.srcObject = cameraState.stream
      }
      el.play().catch(() => {})
    }
  }, [cameraState.isActive, cameraState.stream, videoRef])

  // Draw HUD face and hand landmarks onto overlay canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !cameraState.isActive || cameraState.isMinimized) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    // Draw Face Landmarks if detected
    if (faceState.isFaceDetected && faceState.landmarks) {
      ctx.save()
      // Mirror canvas horizontally to match mirrored video
      ctx.translate(width, 0)
      ctx.scale(-1, 1)

      // Draw face mesh points with cyan glow
      ctx.fillStyle = '#22d3ee'
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = 6

      faceState.landmarks.forEach((pt) => {
        const x = pt.x * width
        const y = pt.y * height
        ctx.beginPath()
        ctx.arc(x, y, 2.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw subtle face orientation reticle
      if (faceState.landmarks.length >= 5) {
        const nose = faceState.landmarks[0]
        const nx = nose.x * width
        const ny = nose.y * height

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(nx, ny, 16, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.restore()
    }

    // Draw Hand Landmarks if detected
    if (handState && handState.isHandDetected) {
      ctx.save()
      ctx.translate(width, 0)
      ctx.scale(-1, 1)

      // Draw hand landmarks with violet glow
      ctx.fillStyle = handState.isPinching ? '#f59e0b' : '#a855f7'
      ctx.shadowColor = handState.isPinching ? '#f59e0b' : '#8b5cf6'
      ctx.shadowBlur = 8

      if (handState.landmarks) {
        handState.landmarks.forEach((pt) => {
          const x = pt.x * width
          const y = pt.y * height
          ctx.beginPath()
          ctx.arc(x, y, 2.5, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      // Draw pinch indicator ring if active
      if (handState.isPinching && handState.landmarks && handState.landmarks.length > 8) {
        const thumb = handState.landmarks[4]
        const index = handState.landmarks[8]
        const pinchX = ((thumb.x + index.x) / 2) * width
        const pinchY = ((thumb.y + index.y) / 2) * height

        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(pinchX, pinchY, 14, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.restore()
    }
  }, [faceState, handState, cameraState.isActive, cameraState.isMinimized])

  // ── INACTIVE CAMERA: Sleek Launch Capsule ──
  if (!cameraState.isActive) {
    return null
  }

  // ── CAMERA ERROR / PERMISSION DENIED ──
  if (cameraState.error || cameraState.permissionDenied) {
    return (
      <div
        className={`absolute z-30 max-w-xs transition-all duration-300 pointer-events-auto ${
          POSITION_STYLES[cameraState.position]
        } ${className}`}
      >
        <div className="p-3.5 rounded-xl bg-[#090e1a]/95 border border-rose-500/40 backdrop-blur-md shadow-xl text-slate-200 text-xs font-mono space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Camera Notice</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {cameraState.error || 'Camera permission was denied in your browser.'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onToggleCamera}
              className="flex-1 py-1 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-[11px] text-center transition-colors cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={onEnableDemoMode}
              className="flex-1 py-1 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Demo Mode</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── MINIMIZED STATUS CAPSULE ──
  if (cameraState.isMinimized) {
    return (
      <div
        className={`absolute z-30 transition-all duration-300 pointer-events-auto ${
          POSITION_STYLES[cameraState.position]
        } ${className}`}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070b14]/95 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] text-xs font-mono text-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span className="text-[11px] text-cyan-300 font-bold">
              {isDemoMode ? 'DEMO CAM' : 'CAM LIVE'}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <span
            className={`text-[11px] ${
              faceState.isFaceDetected ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {faceState.isFaceDetected ? 'FACE LOCKED' : 'SEARCHING'}
          </span>

          {handState?.detectedGesture && handState.detectedGesture !== 'none' && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-violet-400 uppercase font-semibold">
                {handState.detectedGesture.replace('_', ' ')}
              </span>
            </>
          )}

          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-800">
            <button
              onClick={onCyclePosition}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Move camera corner (P)"
              aria-label="Reposition camera"
            >
              <Move className="w-3 h-3" />
            </button>
            <button
              onClick={onToggleMinimize}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expand camera preview (M)"
              aria-label="Expand camera preview"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Keep video element rendered so live tracking never resets when minimized */}
        <video ref={videoRef} playsInline muted autoPlay className="hidden" />
      </div>
    )
  }

  // ── FULL PREVIEW HUD WINDOW ──
  return (
    <div
      className={`absolute z-30 transition-all duration-300 pointer-events-auto ${
        POSITION_STYLES[cameraState.position]
      } ${className}`}
      role="region"
      aria-label="Vision Camera Feed"
    >
      <div className="relative w-56 sm:w-64 rounded-2xl bg-[#070b14]/90 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.2)] overflow-hidden font-mono text-slate-200">
        {/* Top Control Ribbon */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#090e1a]/95 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
              {isDemoMode ? 'SIMULATION' : 'OPTICAL HUD'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Subtle Head Orientation Camera Adjustment Toggle */}
            <button
              onClick={onToggleHeadAdjustments}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                faceState.headAdjustmentsEnabled
                  ? 'text-cyan-400 hover:bg-cyan-950/60'
                  : 'text-slate-500 hover:bg-slate-800/60'
              }`}
              title={
                faceState.headAdjustmentsEnabled
                  ? 'Head orientation parallax: ON (H)'
                  : 'Head orientation parallax: OFF (H)'
              }
              aria-label="Toggle head orientation adjustments"
            >
              {faceState.headAdjustmentsEnabled ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
            </button>

            {/* Reposition Corner Button */}
            <button
              onClick={onCyclePosition}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cycle corner position (P)"
              aria-label="Cycle corner position"
            >
              <Move className="w-3 h-3" />
            </button>

            {/* Minimize Preview Button */}
            <button
              onClick={onToggleMinimize}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Minimize preview (M)"
              aria-label="Minimize preview"
            >
              <Minimize2 className="w-3 h-3" />
            </button>

            {/* Disable Camera Button */}
            <button
              onClick={onToggleCamera}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Disable camera (C)"
              aria-label="Disable camera"
            >
              <CameraOff className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Video & Landmark Canvas Viewport */}
        <div className="relative w-full aspect-[4/3] bg-slate-950 overflow-hidden flex items-center justify-center">
          {/* Live Video Feed (mirrored front-facing) */}
          <video
            ref={(node) => {
              if (videoRef) {
                ;(videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node
              }
              if (node && cameraState.stream) {
                node.muted = true
                node.defaultMuted = true
                node.playsInline = true
                node.autoplay = true
                if (node.srcObject !== cameraState.stream) {
                  node.srcObject = cameraState.stream
                }
                node.play().catch(() => {})
              }
            }}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
              isDemoMode ? 'hidden' : 'block'
            }`}
          />

          {/* Demo Mode Virtual Cockpit Scanner Backdrop */}
          {isDemoMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#050914] via-[#091124] to-[#040813] text-cyan-400 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative z-0 flex flex-col items-center gap-1.5 text-center p-3 pointer-events-none">
                <span className="w-9 h-9 rounded-full border border-cyan-500/40 bg-cyan-950/70 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </span>
                <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
                  SIMULATION PILOT
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Virtual optical telemetry active
                </span>
              </div>
            </div>
          )}

          {/* Canvas for Landmark Overlay */}
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Corner Grid Crosshairs (Sci-Fi Aesthetic) */}
          <div className="absolute inset-2 pointer-events-none border border-cyan-500/10 rounded-lg">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400/60" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400/60" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400/60" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400/60" />
          </div>

          {/* Loading / Model Initializing Spinner (non-blocking so video feed is visible) */}
          {cameraState.isLoading && !isDemoMode && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/85 backdrop-blur-sm border border-cyan-500/40 text-cyan-300 text-[10px]">
              <div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <span>Starting Vision Engine...</span>
            </div>
          )}
        </div>

        {/* Bottom Telemetry Bar */}
        <div className="p-2 bg-[#080d19]/90 border-t border-slate-800/80 space-y-1 text-[10px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  faceState.isFaceDetected ? 'bg-cyan-400' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-400">FACE:</span>
              <span
                className={faceState.isFaceDetected ? 'text-cyan-300 font-bold' : 'text-slate-500'}
              >
                {faceState.isFaceDetected ? 'TRACKING' : 'SEARCHING'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <Compass className="w-2.5 h-2.5 text-cyan-400" />
              <span>
                Y:{faceState.headOrientation.yaw.toFixed(0)}° P:
                {faceState.headOrientation.pitch.toFixed(0)}°
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5 border-t border-slate-800/50">
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  handState?.isHandDetected ? 'bg-violet-400' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-400">HAND:</span>
              <span
                className={
                  handState?.isHandDetected ? 'text-violet-300 font-bold' : 'text-slate-500'
                }
              >
                {handState?.isHandDetected ? 'LOCKED' : 'OFF FRAME'}
              </span>
            </div>

            <span className="text-violet-400 uppercase font-semibold">
              {handState?.detectedGesture ? handState.detectedGesture.replace('_', ' ') : 'NONE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
