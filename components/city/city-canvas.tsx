"use client"

import dynamic from "next/dynamic"

import type { TooltipPosition } from "@/components/city/city-tooltip"
import type { CityBuilding, CityModel, FileCategory } from "@/lib/city/types"

const CityScene = dynamic(
  () =>
    import("@/components/city/city-scene").then((module) => module.CityScene),
  {
    ssr: false,
    loading: () => (
      <div className="grid size-full place-items-center bg-[#090d11]">
        <div className="flex items-center gap-3 font-mono text-xs text-[#9aa4a8]">
          <span className="size-2 animate-pulse rounded-full bg-[#c7e739]" />
          Preparing the 3D renderer
        </div>
      </div>
    ),
  }
)

export function CityCanvas({
  model,
  visibleCategories,
  resetSignal,
  selectedId,
  onHover,
  onSelect,
  onCaptureReady,
}: {
  model: CityModel
  visibleCategories: Set<FileCategory>
  resetSignal: number
  selectedId: string | null
  onHover: (building: CityBuilding | null, position?: TooltipPosition) => void
  onSelect: (building: CityBuilding) => void
  onCaptureReady: (capture: () => Promise<Blob | null>) => void
}) {
  return (
    <CityScene
      model={model}
      visibleCategories={visibleCategories}
      resetSignal={resetSignal}
      selectedId={selectedId}
      onHover={onHover}
      onSelect={onSelect}
      onCaptureReady={onCaptureReady}
    />
  )
}
