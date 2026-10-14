import { useEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { CelestialObject } from '../../types'

export interface CameraControllerProps {
  /** Object currently framed by the camera. Pass null to return to the universe view. */
  focus?: CelestialObject | null
  controlsRef?: RefObject<OrbitControlsImpl | null>
  homePosition?: [number, number, number]
  homeTarget?: [number, number, number]
  flightSpeed?: number
}

const smoothFactor = (speed: number, delta: number) => 1 - Math.exp(-speed * delta)

/** Smoothly frames a selected object without interrupting the Canvas render loop. */
export function CameraController({
  focus = null,
  controlsRef,
  homePosition = [0, 8, 24],
  homeTarget = [0, 0, 0],
  flightSpeed = 3.1,
}: CameraControllerProps) {
  const { camera } = useThree()
  const desiredPosition = useRef(new Vector3())
  const desiredTarget = useRef(new Vector3())
  const direction = useRef(new Vector3(0.5, 0.25, 1).normalize())

  useEffect(() => {
    const target = focus ? new Vector3(...focus.position) : new Vector3(...homeTarget)
    const offset = camera.position.clone().sub(target)
    if (offset.lengthSq() > 0.0001) direction.current.copy(offset.normalize())
  }, [camera, focus, homeTarget])

  useFrame((_, delta) => {
    const isFocusing = Boolean(focus)
    desiredTarget.current.set(...(focus?.position ?? homeTarget))

    if (isFocusing && focus) {
      const distance = MathUtils.clamp(Math.max(focus.radius * 5.7, 4.8), 4.8, 32)
      desiredPosition.current.copy(desiredTarget.current).addScaledVector(direction.current, distance)
    } else {
      desiredPosition.current.set(...homePosition)
    }

    const factor = smoothFactor(flightSpeed, delta)
    camera.position.lerp(desiredPosition.current, factor)
    if (controlsRef?.current) {
      controlsRef.current.target.lerp(desiredTarget.current, factor)
      controlsRef.current.update()
    } else {
      camera.lookAt(desiredTarget.current)
    }
  })

  return null
}
