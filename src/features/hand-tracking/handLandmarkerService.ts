/**
 * MediaPipe Tasks Vision Hand Landmarker Service
 * 
 * Manages asynchronous WASM asset loading, neural network model instantiation,
 * GPU/CPU delegate fallback, and frame inference.
 */

import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision'
import type { HandTrackingConfig } from '../../types/gestures'
import { DEFAULT_HAND_TRACKING_CONFIG } from '../../types/gestures'

export class HandLandmarkerService {
  private static instance: HandLandmarkerService | null = null
  private landmarker: HandLandmarker | null = null
  private initPromise: Promise<HandLandmarker> | null = null
  private isInitializing = false

  public static getInstance(): HandLandmarkerService {
    if (!HandLandmarkerService.instance) {
      HandLandmarkerService.instance = new HandLandmarkerService()
    }
    return HandLandmarkerService.instance
  }

  /**
   * Initializes the HandLandmarker model. Idempotent across multiple concurrent calls.
   */
  public async initialize(
    config: HandTrackingConfig = DEFAULT_HAND_TRACKING_CONFIG
  ): Promise<HandLandmarker> {
    if (this.landmarker) {
      return this.landmarker
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.isInitializing = true
    this.initPromise = (async () => {
      try {
        const wasmPath =
          config.wasmLoaderPath ||
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm'

        const modelPath =
          config.modelAssetPath ||
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

        // 1. Resolve WASM assets
        const vision = await FilesetResolver.forVisionTasks(wasmPath)

        // 2. Attempt model initialization with preferred delegate (GPU by default)
        try {
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: config.delegate || 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: config.numHands || 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          })
        } catch (gpuErr) {
          console.warn(
            '[HandTracking] GPU delegate initialization failed, falling back to CPU delegate:',
            gpuErr
          )
          // Fallback to CPU delegate if GPU/WebGL is not supported or context lost
          this.landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numHands: config.numHands || 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          })
        }

        return this.landmarker
      } finally {
        this.isInitializing = false
        this.initPromise = null
      }
    })()

    return this.initPromise
  }

  /**
   * Detects hand landmarks for a single video frame.
   */
  public detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number
  ): HandLandmarkerResult | null {
    if (!this.landmarker) {
      return null
    }

    // Video must have valid dimensions and ready state
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return null
    }

    try {
      return this.landmarker.detectForVideo(video, timestampMs)
    } catch (err) {
      console.error('[HandTracking] Inference error on video frame:', err)
      return null
    }
  }

  public isReady(): boolean {
    return Boolean(this.landmarker)
  }

  public isLoading(): boolean {
    return this.isInitializing
  }

  /**
   * Closes the underlying MediaPipe landmarker and frees WASM/WebGL memory.
   */
  public dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close()
      } catch {
        // ignore errors on close
      }
      this.landmarker = null
    }
    this.initPromise = null
    this.isInitializing = false
  }
}
