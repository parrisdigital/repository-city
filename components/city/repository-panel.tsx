"use client"

import { Building2, Code2, FileCode2, Layers3 } from "lucide-react"

import { CATEGORY_COLORS } from "@/lib/city/palette"
import type { CityModel, FileCategory } from "@/lib/city/types"
import { cn, formatBytes, titleCase } from "@/lib/utils"

export function RepositoryPanel({
  model,
  visibleCategories,
  onToggleCategory,
  compact = false,
}: {
  model: CityModel
  visibleCategories: Set<FileCategory>
  onToggleCategory: (category: FileCategory) => void
  compact?: boolean
}) {
  const isProfile = model.kind === "profile"
  const totalLanguageBytes = Math.max(
    1,
    model.languages.reduce((sum, language) => sum + language.bytes, 0)
  )

  return (
    <div className={cn("text-[#f1f3ee]", compact ? "pb-6" : "")}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center border border-white/12 bg-[#1b2329] text-[#c7e739]">
          <Code2 className="size-5" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 pt-0.5">
          <a
            href={model.repository.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-[15px] font-semibold tracking-[-0.02em] hover:text-[#c7e739]"
          >
            {model.repository.fullName}
          </a>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#8f9a9e]">
            {model.repository.description ??
              "A public GitHub repository rendered as a city."}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-3 gap-px bg-white/10",
          compact ? "mt-5" : "mt-4"
        )}
      >
        <Stat
          icon={<FileCode2 className="size-4" />}
          label={isProfile ? "Repositories" : "Files"}
          value={model.totalFiles.toLocaleString()}
        />
        <Stat
          icon={<Building2 className="size-4" />}
          label={isProfile ? "Languages" : "Districts"}
          value={model.districts.length.toLocaleString()}
        />
        <Stat
          icon={<Code2 className="size-4" />}
          label="Language"
          value={
            model.repository.primaryLanguage ??
            model.languages[0]?.language ??
            "Other"
          }
          small
        />
      </div>

      <div
        className={cn(
          "border-t border-white/10",
          compact ? "mt-5 pt-5" : "mt-4 pt-4"
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[11px] font-medium text-[#dfe3dd]">
            <Layers3 className="size-3.5 text-[#c7e739]" />{" "}
            {isProfile ? "Repository types" : "File categories"}
          </h2>
          <span className="font-mono text-[9px] text-[#727d81]">
            {formatBytes(model.totalBytes)}
          </span>
        </div>
        <div className="space-y-1">
          {model.categories.map((stat) => {
            const visible = visibleCategories.has(stat.category)
            return (
              <button
                key={stat.category}
                type="button"
                onClick={() => onToggleCategory(stat.category)}
                aria-pressed={visible}
                className={cn(
                  "flex min-h-9 w-full items-center gap-2.5 px-2 text-left text-[11px] transition-colors",
                  visible
                    ? "bg-white/[0.045] text-[#edf0eb] hover:bg-white/[0.075]"
                    : "text-[#697478] hover:bg-white/[0.035]"
                )}
              >
                <span
                  className="size-2.5 shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[stat.category] }}
                />
                <span className="flex-1">
                  {isProfile
                    ? profileCategoryLabel(stat.category)
                    : titleCase(stat.category)}
                </span>
                <span className="font-mono text-[9px] tabular-nums">
                  {stat.count.toLocaleString()}
                </span>
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    visible ? "bg-[#c7e739]" : "border border-current"
                  )}
                />
              </button>
            )
          })}
        </div>
      </div>

      {compact ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <h2 className="text-[11px] font-medium text-[#dfe3dd]">
            Language distribution
          </h2>
          <div className="mt-3 space-y-2.5">
            {model.languages.slice(0, 5).map((language) => {
              const percentage = (language.bytes / totalLanguageBytes) * 100
              return (
                <div
                  key={language.language}
                  className="grid grid-cols-[5rem_1fr_2.8rem] items-center gap-2 text-[10px]"
                >
                  <span className="truncate text-[#9aa4a8]">
                    {language.language}
                  </span>
                  <span className="h-1 overflow-hidden bg-white/8">
                    <span
                      className="block h-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: language.color,
                      }}
                    />
                  </span>
                  <span className="text-right font-mono text-[#7d888c]">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function profileCategoryLabel(category: FileCategory) {
  return {
    source: "Original",
    test: "Forks",
    docs: "Archived",
    config: "Templates",
    other: "Other",
  }[category]
}

function Stat({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode
  label: string
  value: string
  small?: boolean
}) {
  return (
    <div className="bg-[#12191e] px-2.5 py-3">
      <div className="flex items-center gap-1.5 text-[#c7e739]">{icon}</div>
      <p
        className={cn(
          "mt-2 truncate font-mono font-medium",
          small ? "text-[9px]" : "text-[12px]"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[9px] text-[#737e82]">{label}</p>
    </div>
  )
}
