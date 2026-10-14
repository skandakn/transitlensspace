/**
 * GestureCalibrationModal Component
 *
 * Provides real-time gesture calibration, sensitivity fine-tuning,
 * deadzone threshold visualizers, live hand kinematics meters,
 * and quick-pause toggle controls for TransitLens gesture navigation.
 */

import React, { useEffect } from 'react'
import {
  Sliders,
  X,
  RotateCcw,
  Pause,
  Play,
  Hand,
  Compass,
  ZoomIn,
  Target,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react'
import type { GestureNavigationSettings, GestureNavigationMode } from '../universe/gestures/types'
import { DEFAULT_GESTURE_SETTINGS } from '../universe/gestures/types'
import type { GestureFrame } from '../../types/gestures'

export interface GestureCalibrationModalProps {
  isOpen: boolean
  onClose: () => void
  settings: GestureNavigationSettings
  onUpdateSettings: (newSettings: GestureNavigationSettings) => void
  mode: GestureNavigationMode
  onModeChange: (mode: GestureNavigationMode) => void
  gestureFrame: GestureFrame
  fps?: number
}

export function GestureCalibrationModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  mode,
  onModeChange,
  gestureFrame,
  fps = 30
}: GestureCalibrationModalProps) {
  // Close on Escape, pause/unpause on Spacebar when modal is open
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault()
        onModeChange(mode === 'paused' ? 'explore' : 'paused')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, mode, onClose, onModeChange])

  if (!isOpen) return null

  const primaryHand = gestureFrame.primaryHand
  const isTracking = gestureFrame.isTracking && primaryHand !== null
  const isPaused = mode === 'paused'

  // Live displacement delta
  const deltaX = primaryHand?.navigationDelta.deltaX ?? 0
  const deltaY = primaryHand?.navigationDelta.deltaY ?? 0
  const movementMagnitude = Math.hypot(deltaX, deltaY)
  const isMovingBeyondDeadzone = movementMagnitude > settings.movementDeadzone

  // Pinch distance metric
  const pinchDist = primaryHand?.pinchDistance ?? 1.0
  const isPinching = primaryHand?.isPinching ?? false

  const handleSliderChange = <K extends keyof GestureNavigationSettings>(
    key: K,
    val: number | boolean
  ) => {
    onUpdateSettings({
      ...settings,
      [key]: val
    })
  }

  const handleResetDefaults = () => {
    onUpdateSettings({ ...DEFAULT_GESTURE_SETTINGS })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#070b14]/95 border border-cyan-800/60 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl text-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Gesture Calibration & Kinematics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                  AI Vision 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Calibrate tracking deadzones, rotation speeds, and pinch sensitivity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
              title="Reset all settings to default values"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Close Calibration Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Pause & Mode Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onModeChange(isPaused ? 'explore' : 'paused')}
                className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isPaused
                    ? 'bg-rose-500 text-slate-950 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Resume Gestures</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Gesture Controls</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                (Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Space</kbd>)
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Mode:</span>
              {(['explore', 'grab', 'select'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  disabled={isPaused}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
                    mode === m
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
                  } ${isPaused ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calibration Telemetry Meters */}
          <div className="p-4 rounded-xl bg-[#040810] border border-cyan-900/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Kinematics Meter</span>
              </span>
              <span className="text-slate-400">
                {isTracking ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{primaryHand?.handedness} Hand Active · {fps} FPS</span>
                  </span>
                ) : (
                  <span className="text-amber-400">Hand Not In Frame</span>
                )}
              </span>
            </div>

            {/* Movement Deadzone Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Hand Movement Delta:</span>
                <span className={isMovingBeyondDeadzone ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                  {movementMagnitude.toFixed(4)}{' '}
                  {isMovingBeyondDeadzone ? '(Active Rotation)' : '(Inside Deadzone Tremor Filter)'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden relative">
                {/* Deadzone indicator line */}
                <div
                  className="absolute top-0 bottom-0 border-r-2 border-amber-400 z-10"
                  style={{ left: `${Math.min(100, (settings.movementDeadzone / 0.05) * 100)}%` }}
                  title="Tremor Deadzone Threshold"
                />
                {/* Current movement fill */}
                <div
                  className={`h-full transition-all duration-75 ${
                    isMovingBeyondDeadzone ? 'bg-cyan-400' : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.min(100, (movementMagnitude / 0.05) * 100)}%` }}
                />
              </div>
            </div>

            {/* Pinch Distance Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Index-Thumb Pinch Proximity:</span>
                <span className={isPinching ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {pinchDist.toFixed(3)} {isPinching ? '· [PINCH ENGAGED]' : '· Open'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    isPinching ? 'bg-amber-400' : 'bg-cyan-500/60'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (1 - pinchDist / 0.25) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sensitivity Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
            {/* Horizontal Rotation Sensitivity */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Orbit Rotation (X)</span>
                </span>
                <span className="text-cyan-400 font-bold">{settings.rotationSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={settings.rotationSensitivity}
                onChange={(e) => handleSliderChange('rotationSensitivity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5x (Gentle)</span>
                <span>Default: 2.4x</span>
                <span>5.0x (Rapid)</span>
              </div>
            </div>

            {/* Vertical Elevation Sensitivity */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400 rotate-90" />
                  <span>Pitch Elevation (Y)</span>
                </span>
                <span className="text-cyan-400 font-bold">{settings.verticalSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={settings.verticalSensitivity}
                onChange={(e) => handleSliderChange('verticalSensitivity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5x (Gentle)</span>
                <span>Default: 1.8x</span>
                <span>5.0x (Rapid)</span>
              </div>
            </div>

            {/* Zoom Sensitivity */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Zoom Multiplier</span>
                </span>
                <span className="text-cyan-400 font-bold">{settings.zoomSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={settings.zoomSensitivity}
                onChange={(e) => handleSliderChange('zoomSensitivity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5x (Smooth)</span>
                <span>Default: 2.2x</span>
                <span>5.0x (Fast)</span>
              </div>
            </div>

            {/* Tremor Deadzone */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Hand className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tremor Deadzone</span>
                </span>
                <span className="text-cyan-400 font-bold">{settings.movementDeadzone.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.001"
                max="0.025"
                step="0.001"
                value={settings.movementDeadzone}
                onChange={(e) => handleSliderChange('movementDeadzone', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.001 (Sensitive)</span>
                <span>Default: 0.005</span>
                <span>0.025 (Filtered)</span>
              </div>
            </div>

            {/* Pinch Selection Cooldown */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Selection Cooldown</span>
                </span>
                <span className="text-cyan-400 font-bold">{settings.selectionCooldownMs} ms</span>
              </div>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={settings.selectionCooldownMs}
                onChange={(e) => handleSliderChange('selectionCooldownMs', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>200 ms</span>
                <span>Default: 650 ms</span>
                <span>1500 ms</span>
              </div>
            </div>

            {/* Hover Stability Frames */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target Stability Frames</span>
                </span>
                <span className="text-cyan-400 font-bold">{settings.minHoverFramesBeforeSelect} frames</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={settings.minHoverFramesBeforeSelect}
                onChange={(e) => handleSliderChange('minHoverFramesBeforeSelect', parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 (Instant)</span>
                <span>Default: 3</span>
                <span>8 (Rock solid)</span>
              </div>
            </div>
          </div>

          {/* Invert Axes Toggles */}
          <div className="flex flex-wrap items-center gap-6 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={settings.invertX}
                onChange={(e) => handleSliderChange('invertX', e.target.checked)}
                className="accent-cyan-400 rounded cursor-pointer"
              />
              <span>Invert Horizontal Camera Orbit</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={settings.invertY}
                onChange={(e) => handleSliderChange('invertY', e.target.checked)}
                className="accent-cyan-400 rounded cursor-pointer"
              />
              <span>Invert Vertical Camera Pitch</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/40 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mouse and keyboard controls always remain fully functional</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
