"use client"

import { OrbitControls, OrthographicCamera } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"

import type {
  CityBuilding,
  CityDistrict,
  CityModel,
  FileCategory,
} from "@/lib/city/types"
import { CATEGORY_COLORS } from "@/lib/city/palette"

type SceneProps = {
  model: CityModel
  visibleCategories: Set<FileCategory>
  resetSignal: number
  selectedId: string | null
  onHover: (
    building: CityBuilding | null,
    position?: { x: number; y: number }
  ) => void
  onSelect: (building: CityBuilding) => void
  onCaptureReady: (capture: () => Promise<Blob | null>) => void
}

const CATEGORY_ROUGHNESS: Record<FileCategory, number> = {
  source: 0.3,
  test: 0.4,
  docs: 0.48,
  config: 0.34,
  other: 0.58,
}

function SceneCapture({
  onCaptureReady,
}: {
  onCaptureReady: SceneProps["onCaptureReady"]
}) {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    onCaptureReady(async () => {
      const blob = await Promise.race([
        new Promise<Blob | null>((resolve) => {
          gl.render(scene, camera)
          gl.domElement.toBlob(resolve, "image/png", 0.94)
        }),
        new Promise<null>((resolve) =>
          window.setTimeout(() => resolve(null), 1_500)
        ),
      ])
      if (blob) return blob

      try {
        gl.render(scene, camera)
        const dataUrl = gl.domElement.toDataURL("image/png", 0.94)
        const [metadata, encoded] = dataUrl.split(",")
        const mime = metadata.match(/data:(.*?);base64/)?.[1] ?? "image/png"
        const binary = window.atob(encoded)
        const bytes = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index)
        }
        return new Blob([bytes], { type: mime })
      } catch {
        return null
      }
    })
  }, [camera, gl, onCaptureReady, scene])

  return null
}

function stableVariation(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

function Tree({ x, z, scale }: { x: number; z: number; scale: number }) {
  return (
    <group position={[x, 0.18, z]} scale={scale}>
      <mesh castShadow position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.045, 0.065, 0.38, 6]} />
        <meshStandardMaterial color="#6b5439" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <coneGeometry args={[0.24, 0.66, 7]} />
        <meshStandardMaterial color="#6f8a34" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0, 0.79, 0]}>
        <coneGeometry args={[0.17, 0.5, 7]} />
        <meshStandardMaterial color="#8eaa3b" roughness={0.84} />
      </mesh>
    </group>
  )
}

function DistrictLabel({ district }: { district: CityDistrict }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 320
    canvas.height = 80
    const context = canvas.getContext("2d")
    if (context) {
      context.fillStyle = "rgba(8, 13, 17, 0.92)"
      context.strokeStyle = "rgba(210, 224, 230, 0.38)"
      context.lineWidth = 3
      context.beginPath()
      context.roundRect(2, 2, 316, 76, 10)
      context.fill()
      context.stroke()
      context.fillStyle = "#f1f4ef"
      context.font = "600 28px ui-monospace, SFMono-Regular, monospace"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(district.name.slice(0, 18), 160, 41)
    }
    const labelTexture = new THREE.CanvasTexture(canvas)
    labelTexture.colorSpace = THREE.SRGBColorSpace
    labelTexture.minFilter = THREE.LinearFilter
    return labelTexture
  }, [district.name])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <sprite
      position={[
        district.x - district.width / 2 + 1.25,
        1.22,
        district.z - district.depth / 2 + 0.9,
      ]}
      scale={[2.4, 0.6, 1]}
      raycast={() => null}
    >
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  )
}

function DistrictGround({ district }: { district: CityDistrict }) {
  const trees = useMemo(() => {
    const perimeter = Math.max(
      4,
      Math.min(18, Math.floor((district.width + district.depth) / 2.4))
    )
    return Array.from({ length: perimeter }, (_, index) => {
      const edge = index % 4
      const t = (Math.floor(index / 4) + 0.5) / Math.ceil(perimeter / 4)
      const jitter = stableVariation(`${district.id}-tree-${index}`) - 0.5
      if (edge === 0 || edge === 2) {
        return {
          x: district.x + (t - 0.5) * (district.width - 1.6) + jitter * 0.28,
          z:
            district.z +
            (edge === 0
              ? -district.depth / 2 + 0.48
              : district.depth / 2 - 0.48),
          scale: 0.72 + stableVariation(`${district.id}-scale-${index}`) * 0.45,
        }
      }
      return {
        x:
          district.x +
          (edge === 1 ? district.width / 2 - 0.48 : -district.width / 2 + 0.48),
        z: district.z + (t - 0.5) * (district.depth - 1.6) + jitter * 0.28,
        scale: 0.72 + stableVariation(`${district.id}-scale-${index}`) * 0.45,
      }
    })
  }, [district])

  const districtTint = useMemo(
    () =>
      new THREE.Color(CATEGORY_COLORS[district.dominantCategory])
        .lerp(new THREE.Color("#263129"), 0.82)
        .getStyle(),
    [district.dominantCategory]
  )

  return (
    <group>
      <mesh position={[district.x, -0.2, district.z]} castShadow receiveShadow>
        <boxGeometry
          args={[district.width + 0.22, 0.42, district.depth + 0.22]}
        />
        <meshStandardMaterial
          color="#354047"
          roughness={0.74}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[district.x, 0.025, district.z]} receiveShadow>
        <boxGeometry
          args={[district.width - 0.2, 0.08, district.depth - 0.2]}
        />
        <meshStandardMaterial color="#252c31" roughness={0.94} />
      </mesh>
      <mesh position={[district.x, 0.085, district.z]} receiveShadow>
        <boxGeometry
          args={[district.width - 1.02, 0.08, district.depth - 1.02]}
        />
        <meshStandardMaterial color={districtTint} roughness={0.91} />
      </mesh>
      {trees.map((tree, index) => (
        <Tree key={`${district.id}-${index}`} {...tree} />
      ))}
      {district.fileCount > 3 ? <DistrictLabel district={district} /> : null}
    </group>
  )
}

function BridgeNetwork({ districts }: { districts: CityDistrict[] }) {
  const bridges = useMemo(() => {
    return districts.slice(1).flatMap((district, index) => {
      const previous = districts.slice(0, index + 1)
      const nearest = previous.reduce(
        (best, candidate) => {
          const distance = Math.hypot(
            district.x - candidate.x,
            district.z - candidate.z
          )
          return !best || distance < best.distance
            ? { district: candidate, distance }
            : best
        },
        null as { district: CityDistrict; distance: number } | null
      )
      if (!nearest) return []

      const dx = nearest.district.x - district.x
      const dz = nearest.district.z - district.z
      const distance = Math.hypot(dx, dz)
      const ux = dx / distance
      const uz = dz / distance
      const reach = (item: CityDistrict, vx: number, vz: number) =>
        Math.min(
          Math.abs(vx) > 0.001 ? item.width / 2 / Math.abs(vx) : Infinity,
          Math.abs(vz) > 0.001 ? item.depth / 2 / Math.abs(vz) : Infinity
        )
      const fromReach = reach(district, ux, uz)
      const toReach = reach(nearest.district, -ux, -uz)
      const from = {
        x: district.x + ux * (fromReach - 0.18),
        z: district.z + uz * (fromReach - 0.18),
      }
      const to = {
        x: nearest.district.x - ux * (toReach - 0.18),
        z: nearest.district.z - uz * (toReach - 0.18),
      }
      const length = Math.hypot(to.x - from.x, to.z - from.z)
      if (length < 0.35) return []
      return [
        {
          id: `${district.id}-${nearest.district.id}`,
          x: (from.x + to.x) / 2,
          z: (from.z + to.z) / 2,
          length,
          rotation: -Math.atan2(to.z - from.z, to.x - from.x),
        },
      ]
    })
  }, [districts])

  return bridges.map((bridge) => (
    <group
      key={bridge.id}
      position={[bridge.x, 0.01, bridge.z]}
      rotation={[0, bridge.rotation, 0]}
    >
      <mesh castShadow receiveShadow position={[0, -0.06, 0]}>
        <boxGeometry args={[bridge.length + 0.45, 0.18, 0.88]} />
        <meshStandardMaterial color="#39434a" roughness={0.77} />
      </mesh>
      <mesh receiveShadow position={[0, 0.045, 0]}>
        <boxGeometry args={[bridge.length + 0.42, 0.045, 0.64]} />
        <meshStandardMaterial color="#20272c" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <boxGeometry args={[bridge.length * 0.86, 0.018, 0.025]} />
        <meshStandardMaterial
          color="#c6b86c"
          emissive="#84793f"
          emissiveIntensity={0.16}
        />
      </mesh>
    </group>
  ))
}

function BuildingLayer({
  buildings,
  category,
  selectedId,
  onHover,
  onSelect,
}: {
  buildings: CityBuilding[]
  category: FileCategory
  selectedId: string | null
  onHover: SceneProps["onHover"]
  onSelect: SceneProps["onSelect"]
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const capRef = useRef<THREE.InstancedMesh>(null)
  const crownRef = useRef<THREE.InstancedMesh>(null)
  const accentRef = useRef<THREE.InstancedMesh>(null)
  const startedAt = useRef<number | null>(null)
  const done = useRef(false)
  const temp = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.045), [])
  const detailGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        emissive: CATEGORY_COLORS[category],
        emissiveIntensity: 0.1,
        roughness: CATEGORY_ROUGHNESS[category],
        metalness: 0.03,
        clearcoat: category === "source" || category === "config" ? 0.24 : 0.12,
        clearcoatRoughness: 0.55,
        vertexColors: true,
      }),
    [category]
  )
  const capMaterial = useMemo(() => {
    const color = new THREE.Color(CATEGORY_COLORS[category]).lerp(
      new THREE.Color("#dbe5e8"),
      0.24
    )
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.32,
      metalness: 0.12,
    })
  }, [category])
  const crownMaterial = useMemo(() => {
    const color = new THREE.Color(CATEGORY_COLORS[category]).multiplyScalar(
      0.72
    )
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.42,
      metalness: 0.08,
    })
  }, [category])
  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b9d4dd",
        emissive: CATEGORY_COLORS[category],
        emissiveIntensity: 0.22,
        roughness: 0.38,
      }),
    [category]
  )

  const setMatrix = useCallback(
    (index: number, progress: number) => {
      const building = buildings[index]
      const height = Math.max(0.03, building.height * progress)
      temp.position.set(building.x, height / 2, building.z)
      temp.scale.set(building.width, height, building.depth)
      temp.updateMatrix()
      meshRef.current?.setMatrixAt(index, temp.matrix)

      const capHeight = 0.09 * progress
      temp.position.set(building.x, height + capHeight / 2, building.z)
      temp.scale.set(
        building.width * 0.9,
        Math.max(0.001, capHeight),
        building.depth * 0.9
      )
      temp.updateMatrix()
      capRef.current?.setMatrixAt(index, temp.matrix)

      const variation = stableVariation(building.path)
      const crownHeight =
        building.height > 2.15
          ? (0.25 + variation * Math.min(0.72, building.height * 0.1)) *
            progress
          : 0.001
      temp.position.set(
        building.x,
        height + capHeight + crownHeight / 2,
        building.z
      )
      temp.scale.set(
        building.width * (0.44 + variation * 0.18),
        crownHeight,
        building.depth * (0.44 + variation * 0.18)
      )
      temp.updateMatrix()
      crownRef.current?.setMatrixAt(index, temp.matrix)

      const bandHeight = Math.max(0.001, 0.055 * progress)
      temp.position.set(
        building.x,
        height * (0.46 + variation * 0.22),
        building.z + building.depth / 2 + 0.012
      )
      temp.scale.set(building.width * 0.76, bandHeight, 0.026)
      temp.updateMatrix()
      accentRef.current?.setMatrixAt(index, temp.matrix)
    },
    [buildings, temp]
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    buildings.forEach((_, index) => {
      setMatrix(index, 0)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (capRef.current) capRef.current.instanceMatrix.needsUpdate = true
    if (crownRef.current) crownRef.current.instanceMatrix.needsUpdate = true
    if (accentRef.current) accentRef.current.instanceMatrix.needsUpdate = true
    startedAt.current = null
    done.current = false
  }, [buildings, setMatrix])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    buildings.forEach((building, index) => {
      const color = tempColor.set(building.color)
      if (building.id === selectedId)
        color.lerp(new THREE.Color("#e6ff4f"), 0.74)
      mesh.setColorAt(index, color)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [buildings, selectedId, tempColor])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh || done.current) return
    if (startedAt.current === null) startedAt.current = clock.elapsedTime
    const elapsed = clock.elapsedTime - startedAt.current
    let complete = true
    buildings.forEach((building, index) => {
      const raw = (elapsed - building.delay) / 0.88
      const clamped = Math.min(1, Math.max(0, raw))
      const eased = 1 - Math.pow(1 - clamped, 3)
      if (clamped < 1) complete = false
      setMatrix(index, eased)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (capRef.current) capRef.current.instanceMatrix.needsUpdate = true
    if (crownRef.current) crownRef.current.instanceMatrix.needsUpdate = true
    if (accentRef.current) accentRef.current.instanceMatrix.needsUpdate = true
    done.current = complete
  })

  const getBuilding = (event: { instanceId?: number }) =>
    buildings[event.instanceId ?? -1]

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, buildings.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
        onPointerMove={(event) => {
          event.stopPropagation()
          const building = getBuilding(event)
          if (building)
            onHover(building, { x: event.clientX, y: event.clientY })
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          onHover(null)
        }}
        onClick={(event) => {
          event.stopPropagation()
          const building = getBuilding(event)
          if (building) onSelect(building)
        }}
      />
      <instancedMesh
        ref={capRef}
        args={[detailGeometry, capMaterial, buildings.length]}
        castShadow
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        ref={crownRef}
        args={[detailGeometry, crownMaterial, buildings.length]}
        castShadow
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        ref={accentRef}
        args={[detailGeometry, accentMaterial, buildings.length]}
        frustumCulled={false}
        raycast={() => null}
      />
    </group>
  )
}

function CameraRig({
  model,
  resetSignal,
}: {
  model: CityModel
  resetSignal: number
}) {
  const { size } = useThree()
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const span = Math.max(model.bounds.width, model.bounds.depth, 12)
  const distance = span * 1.05
  const zoom =
    model.renderedBuildings > 600
      ? Math.min(48, Math.max(14, 520 / span))
      : Math.min(68, Math.max(19, 620 / span))
  const targetY = Math.min(model.bounds.maxHeight * 0.22, 1.4)
  const mobileScale = size.width < 640 ? 0.58 : 1
  const effectiveZoom = zoom * mobileScale
  const targetX = size.width < 640 ? 0 : -span * 0.065

  useEffect(() => {
    controlsRef.current?.reset()
  }, [resetSignal])

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[distance, distance * 0.82, distance]}
        zoom={effectiveZoom}
        near={0.1}
        far={1000}
        onUpdate={(camera) => camera.lookAt(targetX, targetY, 0)}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[targetX, targetY, 0]}
        enableDamping
        dampingFactor={0.08}
        minZoom={effectiveZoom * 0.45}
        maxZoom={effectiveZoom * 3}
        maxPolarAngle={Math.PI / 2.12}
      />
    </>
  )
}

export function CityScene(props: SceneProps) {
  const grouped = useMemo(() => {
    const groups = new Map<FileCategory, CityBuilding[]>()
    props.model.buildings.forEach((building) => {
      if (!props.visibleCategories.has(building.category)) return
      const group = groups.get(building.category) ?? []
      group.push(building)
      groups.set(building.category, group)
    })
    return [...groups.entries()]
  }, [props.model.buildings, props.visibleCategories])

  const groundSize =
    Math.max(props.model.bounds.width, props.model.bounds.depth) + 100

  return (
    <Canvas
      shadows="basic"
      dpr={[1, 1.7]}
      className="size-full cursor-grab active:cursor-grabbing"
      gl={{ antialias: true, preserveDrawingBuffer: true, alpha: false }}
      onPointerMissed={() => props.onHover(null)}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.06
      }}
    >
      <color attach="background" args={["#081019"]} />
      <fog
        attach="fog"
        args={["#081019", groundSize * 0.82, groundSize * 1.55]}
      />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#eaf3ff", "#07141b", 1.04]} />
      <directionalLight
        castShadow
        position={[26, 38, 24]}
        intensity={2.8}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.00025}
      />
      <directionalLight
        position={[-22, 16, -20]}
        intensity={0.78}
        color="#789fff"
      />
      <directionalLight
        position={[4, 20, -30]}
        intensity={0.5}
        color="#c7e739"
      />

      <mesh position={[0, -0.34, 0]} receiveShadow>
        <boxGeometry args={[groundSize, 0.18, groundSize]} />
        <meshStandardMaterial
          color="#020b12"
          roughness={0.86}
          metalness={0.06}
        />
      </mesh>
      {props.model.districts.map((district) => (
        <DistrictGround key={district.id} district={district} />
      ))}
      <BridgeNetwork districts={props.model.districts} />
      {grouped.map(([category, buildings]) => (
        <BuildingLayer
          key={category}
          category={category}
          buildings={buildings}
          selectedId={props.selectedId}
          onHover={props.onHover}
          onSelect={props.onSelect}
        />
      ))}
      <CameraRig model={props.model} resetSignal={props.resetSignal} />
      <SceneCapture onCaptureReady={props.onCaptureReady} />
    </Canvas>
  )
}
