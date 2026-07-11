import type { CityBuilding } from "@/lib/city/types"
import { formatBytes, titleCase } from "@/lib/utils"

export type TooltipPosition = { x: number; y: number }

export function CityTooltip({
  building,
  position,
}: {
  building: CityBuilding
  position: TooltipPosition
}) {
  return (
    <div
      className="pointer-events-none fixed z-50 w-[min(21rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-[calc(100%+16px)] border border-white/15 bg-[#10161b]/96 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-md"
      style={{ left: position.x, top: position.y }}
      role="status"
    >
      <p className="truncate font-mono text-[12px] font-medium text-[#f2f4ee]">
        {building.path}
      </p>
      <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-[#aab3b5]">
        <span className="flex items-center gap-1.5 text-[#c7e739]">
          <span className="size-2 rounded-full bg-current" />
          {building.language}
        </span>
        <span>{titleCase(building.category)}</span>
        <span>{formatBytes(building.size)}</span>
      </div>
      {building.isAggregate ? (
        <p className="mt-2 text-[11px] text-[#8d979b]">
          Combined from {building.aggregateCount?.toLocaleString()} smaller
          files
        </p>
      ) : null}
    </div>
  )
}
