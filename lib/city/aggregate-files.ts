import type { NormalizedFile } from "@/lib/city/types"

export const MAX_BUILDINGS = 1200

export function aggregateFiles(
  files: NormalizedFile[],
  maxBuildings = MAX_BUILDINGS
): { files: NormalizedFile[]; aggregatedCount: number } {
  if (files.length <= maxBuildings) return { files, aggregatedCount: 0 }

  const keepCount = Math.max(1, Math.floor(maxBuildings * 0.78))
  const bySize = [...files].sort(
    (a, b) => b.size - a.size || a.path.localeCompare(b.path)
  )
  const topCount = Math.max(1, Math.floor(keepCount * 0.4))
  const largest = bySize.slice(0, topCount)
  const samplePool = bySize.slice(topCount)
  const sampleCount = keepCount - largest.length
  const sampled = Array.from({ length: sampleCount }, (_, index) => {
    const poolIndex = Math.min(
      samplePool.length - 1,
      Math.floor((index * samplePool.length) / Math.max(sampleCount, 1))
    )
    return samplePool[poolIndex]
  }).filter((file): file is NormalizedFile => Boolean(file))
  const keptPaths = new Set([...largest, ...sampled].map((file) => file.path))
  const kept = bySize.filter((file) => keptPaths.has(file.path))
  const remaining = bySize.filter((file) => !keptPaths.has(file.path))
  const groups = new Map<string, NormalizedFile[]>()

  for (const file of remaining) {
    const key = `${file.district}::${file.category}::${file.language}`
    const group = groups.get(key) ?? []
    group.push(file)
    groups.set(key, group)
  }

  const aggregates = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, Math.max(1, maxBuildings - keepCount))
    .map(([key, group]) => {
      const [district, category, language] = key.split("::")
      const first = group[0]
      return {
        ...first,
        path: `${district}/+${group.length}-smaller-${category}-files`,
        name: `${group.length} smaller ${category} files`,
        directory: district,
        district,
        category: first.category,
        language,
        extension: "",
        size: group.reduce((sum, file) => sum + file.size, 0),
        sha: `${district}-${category}-${language}`,
        url: first.url,
        isAggregate: true,
        aggregateCount: group.length,
      } satisfies NormalizedFile
    })

  return {
    files: [...kept, ...aggregates].sort((a, b) =>
      a.path.localeCompare(b.path)
    ),
    aggregatedCount: remaining.length,
  }
}
