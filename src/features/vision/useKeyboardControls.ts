import { useEffect } from 'react'

export interface KeyboardControlsOptions {
  onToggleCamera: () => void
  onToggleMinimize: () => void
  onCyclePosition: () => void
  onToggleHeadAdjustments: () => void
  onToggleGuide: () => void
  onCloseModals?: () => void
  enabled?: boolean
}

export function useKeyboardControls({
  onToggleCamera,
  onToggleMinimize,
  onCyclePosition,
  onToggleHeadAdjustments,
  onToggleGuide,
  onCloseModals,
  enabled = true,
}: KeyboardControlsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const key = e.key.toLowerCase()

      switch (key) {
        case 'c':
          e.preventDefault()
          onToggleCamera()
          break
        case 'm':
          e.preventDefault()
          onToggleMinimize()
          break
        case 'p':
          e.preventDefault()
          onCyclePosition()
          break
        case 'h':
          e.preventDefault()
          onToggleHeadAdjustments()
          break
        case 'g':
        case '?':
          e.preventDefault()
          onToggleGuide()
          break
        case 'escape':
          if (onCloseModals) {
            e.preventDefault()
            onCloseModals()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    enabled,
    onToggleCamera,
    onToggleMinimize,
    onCyclePosition,
    onToggleHeadAdjustments,
    onToggleGuide,
    onCloseModals,
  ])
}
