/**
 * Webcam Controller
 * 
 * Manages HTML5 MediaStream lifecycle, hardware permission requests,
 * error classification, and clean hardware track teardown.
 */

export interface WebcamStartResult {
  stream: MediaStream
  videoElement: HTMLVideoElement
}

export type CameraErrorCode =
  | 'PERMISSION_DENIED'
  | 'NO_CAMERA'
  | 'CAMERA_IN_USE'
  | 'UNSUPPORTED_BROWSER'
  | 'UNKNOWN'

export class CameraError extends Error {
  code: CameraErrorCode

  constructor(code: CameraErrorCode, message: string) {
    super(message)
    this.name = 'CameraError'
    this.code = code
  }
}

/**
 * Checks whether the browser provides mediaDevices.getUserMedia capabilities.
 */
export function isWebcamSupported(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
    navigator?.mediaDevices?.getUserMedia
  )
}

/**
 * Requests webcam stream with graceful fallback and attaches it to a video element.
 */
export async function startWebcam(
  videoElement: HTMLVideoElement,
  width = 640,
  height = 480
): Promise<MediaStream> {
  if (!isWebcamSupported()) {
    throw new CameraError(
      'UNSUPPORTED_BROWSER',
      'Your browser or device does not support webcam video streaming.'
    )
  }

  // Stop any existing tracks on this video element before requesting a new stream
  stopWebcam(videoElement)

  let stream: MediaStream

  try {
    // Attempt preferred resolution and user-facing orientation
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: width },
        height: { ideal: height },
        facingMode: 'user'
      },
      audio: false
    })
  } catch (err: any) {
    // Overconstrained fallback: try basic video if ideal constraints failed
    if (err?.name === 'OverconstrainedError') {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
      } catch (innerErr: any) {
        throw mapMediaError(innerErr)
      }
    } else {
      throw mapMediaError(err)
    }
  }

  // Attach stream to video element
  if (videoElement) {
    videoElement.srcObject = stream
    videoElement.setAttribute('playsinline', 'true')
    videoElement.muted = true
    videoElement.defaultMuted = true
    videoElement.autoplay = true

    try {
      await videoElement.play()
    } catch {
      // Autoplay policy or already playing
    }

    // Wait for first frame or metadata, with 500ms fallback to prevent any deadlock
    await new Promise<void>((resolve) => {
      if (videoElement.readyState >= 1) {
        resolve()
        return
      }

      let done = false
      const onReady = () => {
        if (done) return
        done = true
        videoElement.removeEventListener('loadedmetadata', onReady)
        videoElement.removeEventListener('loadeddata', onReady)
        videoElement.removeEventListener('canplay', onReady)
        resolve()
      }

      videoElement.addEventListener('loadedmetadata', onReady, { once: true })
      videoElement.addEventListener('loadeddata', onReady, { once: true })
      videoElement.addEventListener('canplay', onReady, { once: true })

      // Guaranteed resolution fallback
      setTimeout(onReady, 500)
    })
  }

  return stream
}

/**
 * Stops all active tracks on the video element's media stream and disconnects hardware.
 */
export function stopWebcam(videoElement: HTMLVideoElement | null | undefined): void {
  if (!videoElement) return

  const stream = videoElement.srcObject as MediaStream | null
  if (stream) {
    stream.getTracks().forEach((track) => {
      try {
        track.stop()
      } catch {
        // Ignore errors during track stoppage
      }
    })
    videoElement.srcObject = null
  }
}

/**
 * Maps browser DOMExceptions to friendly user-facing CameraErrors.
 */
function mapMediaError(err: any): CameraError {
  const name = err?.name || ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return new CameraError(
      'PERMISSION_DENIED',
      'Camera permission was denied. Please allow camera access in your browser address bar to use hand tracking.'
    )
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return new CameraError(
      'NO_CAMERA',
      'No webcam device was found on this computer. Please connect a webcam and try again.'
    )
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return new CameraError(
      'CAMERA_IN_USE',
      'The webcam is currently in use by another application (e.g. Zoom or Teams). Please close other video apps and retry.'
    )
  }
  return new CameraError(
    'UNKNOWN',
    err?.message || 'An unexpected error occurred while starting the camera.'
  )
}
