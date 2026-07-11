import { CATEGORY_COLORS, languageColor } from "@/lib/city/palette"
import {
  FILE_CATEGORIES,
  type CategoryStat,
  type CityBuilding,
  type CityDistrict,
  type LanguageStat,
  type NormalizedFile,
} from "@/lib/city/types"

const CELL = 0.94
const DISTRICT_PADDING = 1.28
const ROAD = 2.35
const BLOCK_SIZE = 5
const INTERNAL_ROAD = 0.82

function buildingHeight(size: number, minLog: number, maxLog: number) {
  const value = Math.log2(size + 1)
  const normalized =
    maxLog > minLog ? (value - minLog) / (maxLog - minLog) : 0.5
  return 0.48 + Math.pow(Math.max(0, Math.min(1, normalized)), 1.28) * 6.9
}

function internalRoads(cells: number) {
  return Math.max(0, Math.floor((cells - 1) / BLOCK_SIZE)) * INTERNAL_ROAD
}

function cellOffset(index: number) {
  return Math.floor(index / BLOCK_SIZE) * INTERNAL_ROAD
}

function pathVariation(path: string) {
  let hash = 2166136261
  for (let index = 0; index < path.length; index += 1) {
    hash ^= path.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

function dominantCategory(files: NormalizedFile[]) {
  const counts = new Map<string, number>()
  for (const file of files) {
    counts.set(file.category, (counts.get(file.category) ?? 0) + file.size)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as
    NormalizedFile["category"] | undefined
}

export function layoutCity(files: NormalizedFile[]) {
  const grouped = new Map<string, NormalizedFile[]>()
  for (const file of files) {
    const group = grouped.get(file.district) ?? []
    group.push(file)
    grouped.set(file.district, group)
  }

  const plans = [...grouped.entries()]
    .map(([name, districtFiles]) => {
      const columns = Math.max(
        1,
        Math.ceil(Math.sqrt(districtFiles.length * 1.25))
      )
      const rows = Math.max(1, Math.ceil(districtFiles.length / columns))
      return {
        name,
        files: [...districtFiles].sort(
          (a, b) => b.size - a.size || a.path.localeCompare(b.path)
        ),
        columns,
        rows,
        width: columns * CELL + internalRoads(columns) + DISTRICT_PADDING * 2,
        depth: rows * CELL + internalRoads(rows) + DISTRICT_PADDING * 2,
        bytes: districtFiles.reduce((sum, file) => sum + file.size, 0),
      }
    })
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name))

  const totalArea = plans.reduce(
    (sum, plan) => sum + plan.width * plan.depth,
    0
  )
  const targetRowWidth = Math.max(18, Math.sqrt(totalArea) * 1.35)
  const placed: Array<(typeof plans)[number] & { x: number; z: number }> = []
  let cursorX = 0
  let cursorZ = 0
  let rowDepth = 0

  for (const plan of plans) {
    if (cursorX > 0 && cursorX + plan.width > targetRowWidth) {
      cursorX = 0
      cursorZ += rowDepth + ROAD
      rowDepth = 0
    }
    placed.push({ ...plan, x: cursorX, z: cursorZ })
    cursorX += plan.width + ROAD
    rowDepth = Math.max(rowDepth, plan.depth)
  }

  const rawWidth = Math.max(...placed.map((plan) => plan.x + plan.width), 1)
  const rawDepth = Math.max(...placed.map((plan) => plan.z + plan.depth), 1)
  const centerX = rawWidth / 2
  const centerZ = rawDepth / 2
  const districts: CityDistrict[] = []
  const buildings: CityBuilding[] = []
  const logs = files.map((file) => Math.log2(file.size + 1))
  const minLog = logs.length > 0 ? Math.min(...logs) : 0
  const maxLog = logs.length > 0 ? Math.max(...logs) : 1

  placed.forEach((plan, districtIndex) => {
    const districtX = plan.x - centerX + plan.width / 2
    const districtZ = plan.z - centerZ + plan.depth / 2
    districts.push({
      id: plan.name,
      name: plan.name,
      x: districtX,
      z: districtZ,
      width: plan.width,
      depth: plan.depth,
      fileCount: plan.files.reduce(
        (sum, file) => sum + (file.aggregateCount ?? 1),
        0
      ),
      totalBytes: plan.bytes,
      dominantCategory: dominantCategory(plan.files) ?? "other",
    })

    plan.files.forEach((file, index) => {
      const column = index % plan.columns
      const row = Math.floor(index / plan.columns)
      const variation = pathVariation(file.path)
      const height =
        buildingHeight(file.size, minLog, maxLog) +
        Math.pow(variation, 3) * 2.25
      buildings.push({
        ...file,
        id: `${file.sha}-${index}`,
        x:
          plan.x -
          centerX +
          DISTRICT_PADDING +
          column * CELL +
          cellOffset(column) +
          CELL / 2,
        z:
          plan.z -
          centerZ +
          DISTRICT_PADDING +
          row * CELL +
          cellOffset(row) +
          CELL / 2,
        width: file.isAggregate ? 0.82 : 0.56 + variation * 0.19,
        depth: file.isAggregate ? 0.82 : 0.58 + (1 - variation) * 0.17,
        height,
        color: CATEGORY_COLORS[file.category],
        delay: Math.min(0.7, districtIndex * 0.035 + index * 0.0008),
      })
    })
  })

  const categories: CategoryStat[] = FILE_CATEGORIES.map((category) => {
    const categoryFiles = files.filter((file) => file.category === category)
    return {
      category,
      count: categoryFiles.reduce(
        (sum, file) => sum + (file.aggregateCount ?? 1),
        0
      ),
      bytes: categoryFiles.reduce((sum, file) => sum + file.size, 0),
      color: CATEGORY_COLORS[category],
    }
  }).filter((stat) => stat.count > 0)

  const languageMap = new Map<string, { count: number; bytes: number }>()
  for (const file of files) {
    const current = languageMap.get(file.language) ?? { count: 0, bytes: 0 }
    current.count += file.aggregateCount ?? 1
    current.bytes += file.size
    languageMap.set(file.language, current)
  }
  const languages: LanguageStat[] = [...languageMap.entries()]
    .map(([language, stat]) => ({
      language,
      ...stat,
      color: languageColor(language),
    }))
    .sort((a, b) => b.bytes - a.bytes || a.language.localeCompare(b.language))

  return {
    districts,
    buildings,
    categories,
    languages,
    bounds: {
      width: rawWidth,
      depth: rawDepth,
      maxHeight: Math.max(...buildings.map((building) => building.height), 1),
    },
  }
}
