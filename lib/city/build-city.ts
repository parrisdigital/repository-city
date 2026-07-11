import { aggregateFiles } from "@/lib/city/aggregate-files"
import { layoutCity } from "@/lib/city/layout"
import { normalizeTree } from "@/lib/city/normalize-tree"
import type {
  CityModel,
  CityWarning,
  RepositorySummary,
} from "@/lib/city/types"
import type { GitHubTreeEntry } from "@/lib/github/types"

export function buildCityModel({
  repository,
  tree,
  treeSha,
  truncated,
}: {
  repository: RepositorySummary
  tree: GitHubTreeEntry[]
  treeSha: string
  truncated: boolean
}): CityModel {
  const normalized = normalizeTree(
    tree,
    repository.url,
    repository.defaultBranch
  )
  const totalFiles = normalized.length
  const totalBytes = normalized.reduce((sum, file) => sum + file.size, 0)
  const aggregated = aggregateFiles(normalized)
  const layout = layoutCity(aggregated.files)
  const warnings: CityWarning[] = []

  if (truncated) {
    warnings.push({
      code: "TRUNCATED",
      message:
        "GitHub truncated this unusually large tree; the city represents the available structure.",
    })
  }
  if (aggregated.aggregatedCount > 0) {
    warnings.push({
      code: "AGGREGATED",
      message: `${aggregated.aggregatedCount.toLocaleString()} smaller files were combined to keep the city fast.`,
    })
  }
  if (normalized.length === 0) {
    warnings.push({
      code: "EMPTY",
      message: "No visualizable source files were found in this repository.",
    })
  }

  return {
    repository,
    treeSha,
    generatedAt: new Date().toISOString(),
    totalFiles,
    renderedBuildings: layout.buildings.length,
    totalBytes,
    ...layout,
    warnings,
  }
}
