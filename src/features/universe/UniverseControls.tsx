import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type NavigationMode = 'orbit' | 'free'

export interface UniverseControlsProps {
  mode: NavigationMode
  controlsRef?: RefObject<OrbitControlsImpl | null>
  movementSpeed?: number
  minDistance?: number
  maxDistance?: number
}

/**
 * Orbit mode provides a stable target-centric camera. Free mode retains smooth
 * mouse rotation, zoom and pan, and adds WASD plus Q/E movement through space.
 */
export function UniverseControls({
  mode,
  controlsRef,
  movementSpeed = 12,
  minDistance = 2,
  maxDistance = 140,
}: UniverseControlsProps) {
  const localControlsRef = useRef<OrbitControlsImpl | null>(null)
  const activeControlsRef = controlsRef ?? localControlsRef
  const keys = useRef(new Set<string>())
  const { camera } = useThree()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => keys.current.add(event.key.toLowerCase())
    const onKeyUp = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (mode !== 'free' || keys.current.size === 0) return
    const forward = camera.getWorldDirection(new Vector3())
    const right = new Vector3().crossVectors(forward, camera.up).normalize()
    const movement = new Vector3()

    if (keys.current.has('w')) movement.add(forward)
    if (keys.current.has('s')) movement.sub(forward)
    if (keys.current.has('d')) movement.add(right)
    if (keys.current.has('a')) movement.sub(right)
    if (keys.current.has('e')) movement.y += 1
    if (keys.current.has('q')) movement.y -= 1
    if (movement.lengthSq() === 0) return

    movement.normalize().multiplyScalar(movementSpeed * delta)
    camera.position.add(movement)
    activeControlsRef.current?.target.add(movement)
    activeControlsRef.current?.update()
  })

  return (
    <OrbitControls
      ref={activeControlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      minDistance={minDistance}
      maxDistance={maxDistance}
      rotateSpeed={mode === 'free' ? 0.72 : 0.56}
      zoomSpeed={0.86}
      panSpeed={mode === 'free' ? 0.92 : 0.72}
    />
  )
}
