# 3D planetary system components

These components are designed for the universe scene owned by Member 1. They do not create a `Canvas`, route, layout, or toolbar.

## Exports

| Export | Responsibility |
| --- | --- |
| `PlanetarySystem` | Places one `CelestialObject` star system in world space, renders its planets, orbit paths, and selection highlights. |
| `Planet` | An independently rotating planet with procedural surface data texture, cloud layer, atmosphere shader, optional rings, orbital motion, and click selection. |
| `OrbitPath` | Parent-relative orbital guide for a planet. |
| `UniverseControls` | Controlled Orbit / Free Exploration camera controls. Free mode supports `W`, `A`, `S`, `D`, `Q`, and `E`. |
| `CameraController` | Delta-time-smoothed flight to a `CelestialObject`, plus the return-to-universe view when `focus` is `null`. |

`PlanetarySystem` and `Planet` emit the existing shared `CelestialObject` contract through `onSelectObject` / `onSelect`. Each emitted planet retains its catalog `id`, has `type: 'planet'`, and includes its current world-space position.

## Scene integration

```tsx
import { Canvas } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { CelestialObject } from '../../types'
import {
  CameraController,
  PlanetarySystem,
  UniverseControls,
  type NavigationMode,
} from './features/universe'

function SystemView({ star }: { star: CelestialObject }) {
  const [selected, setSelected] = useState<CelestialObject | null>(null)
  const [mode, setMode] = useState<NavigationMode>('orbit')
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <>
      <button onClick={() => setMode(mode === 'orbit' ? 'free' : 'orbit')}>
        {mode === 'orbit' ? 'Free exploration' : 'Orbit mode'}
      </button>
      <button onClick={() => setSelected(null)}>Return to universe</button>
      <Canvas onPointerMissed={() => setSelected(null)}>
        <ambientLight intensity={0.16} />
        <PlanetarySystem
          star={star}
          selectedObjectId={selected?.id}
          onSelectObject={setSelected}
          onDeselect={() => setSelected(null)}
        />
        <UniverseControls mode={mode} controlsRef={controlsRef} />
        <CameraController focus={selected} controlsRef={controlsRef} />
      </Canvas>
    </>
  )
}
```

Use `renderParentStar={false}` if the host universe scene already renders the star. Keep `PlanetarySystem` under a scene group that is not scaled non-uniformly, so reported world-space positions stay accurate.
