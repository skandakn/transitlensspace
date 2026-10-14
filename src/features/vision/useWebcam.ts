import { useState, useEffect, useRef, useCallback } from 'react'
import type { CameraPosition, CameraState } from './types'

export interface UseWebcamOptions {
  initialPosition?: CameraPosition
  autoStart?: boolean
}

export function useWebcam(options: UseWebcamOptions = {}) {
  const { initialPosition = 'bottom-right', autoStart = false } = options

  const [state, setState] = useState<CameraState>({
    isActive: false,
    isPermissionGranted: false,
    permissionDenied: false,
    error: null,
    position: initialPosition,
    isMinimized: false,
    stream: null,
    isLoading: false,
  })

  const [isDemoMode, setIsDemoMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      stream: null,
      isLoading: false,
    }))
  }, [])

  const startCamera = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Webcam mediaDevices API is not supported in this browser.')
      }

      // Stop any existing stream before starting a new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {})
        }
        videoRef.current.play().catch(() => {})
      }

      setIsDemoMode(false)
      setState((prev) => ({
        ...prev,
        isActive: true,
        isPermissionGranted: true,
        permissionDenied: false,
        error: null,
        stream,
        isLoading: false,
      }))
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string }
      let errorMessage = 'Failed to access camera.'
      let isDenied = false

      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access was denied by your browser. Please allow camera permissions to use vision gestures.'
        isDenied = true
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera device detected on this system. You can explore using Demo Mode.'
      } else if (errorObj.message) {
        errorMessage = errorObj.message
      }

      setState((prev) => ({
        ...prev,
        isActive: false,
        isPermissionGranted: false,
        permissionDenied: isDenied,
        error: errorMessage,
        stream: null,
        isLoading: false,
      }))
    }
  }, [])

  const toggleCamera = useCallback(() => {
    if (state.isActive) {
      stopCamera()
    } else {
      startCamera()
    }
  }, [state.isActive, startCamera, stopCamera])

  const setPosition = useCallback((position: CameraPosition) => {
    setState((prev) => ({ ...prev, position }))
  }, [])

  const cyclePosition = useCallback(() => {
    const order: CameraPosition[] = ['bottom-right', 'top-right', 'top-left', 'bottom-left']
    setState((prev) => {
      const currentIndex = order.indexOf(prev.position)
      const nextIndex = (currentIndex + 1) % order.length
      return { ...prev, position: order[nextIndex] }
    })
  }, [])

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }))
  }, [])

  const enableDemoMode = useCallback(() => {
    stopCamera()
    setIsDemoMode(true)
    setState((prev) => ({
      ...prev,
      isActive: true,
      isPermissionGranted: true,
      permissionDenied: false,
      error: null,
      isLoading: false,
    }))
  }, [stopCamera])

  // Ensure video element receives stream whenever it becomes available or mounts
  useEffect(() => {
    if (videoRef.current && state.stream) {
      if (videoRef.current.srcObject !== state.stream) {
        videoRef.current.srcObject = state.stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {})
        }
        videoRef.current.play().catch(() => {})
      }
    }
  }, [state.stream, state.isActive])

  useEffect(() => {
    let timer: any = null
    if (autoStart) {
      timer = setTimeout(() => {
        startCamera()
      }, 0)
    }
    return () => {
      if (timer) clearTimeout(timer)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [autoStart, startCamera])

  return {
    state,
    videoRef,
    isDemoMode,
    startCamera,
    stopCamera,
    toggleCamera,
    setPosition,
    cyclePosition,
    toggleMinimize,
    enableDemoMode,
  }
}
