export const FILE_CATEGORIES = [
  "source",
  "test",
  "docs",
  "config",
  "other",
] as const

export type FileCategory = (typeof FILE_CATEGORIES)[number]

export type RepositorySummary = {
  owner: string
  name: string
  fullName: string
  description: string | null
  url: string
  defaultBranch: string
  stars: number
  forks: number
  primaryLanguage: string | null
  updatedAt: string
}

export type NormalizedFile = {
  path: string
  name: string
  directory: string
  district: string
  extension: string
  language: string
  category: FileCategory
  size: number
  sha: string
  url: string
  isAggregate?: boolean
  aggregateCount?: number
}

export type CityBuilding = NormalizedFile & {
  id: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  color: string
  delay: number
}

export type CityDistrict = {
  id: string
  name: string
  x: number
  z: number
  width: number
  depth: number
  fileCount: number
  totalBytes: number
  dominantCategory: FileCategory
}

export type CategoryStat = {
  category: FileCategory
  count: number
  bytes: number
  color: string
}

export type LanguageStat = {
  language: string
  count: number
  bytes: number
  color: string
}

export type CityWarning = {
  code: "TRUNCATED" | "AGGREGATED" | "EMPTY"
  message: string
}

export type CityModel = {
  kind: "repository" | "profile"
  repository: RepositorySummary
  profile?: {
    name: string | null
    avatarUrl: string
    publicRepositories: number
    followers: number
    following: number
  }
  treeSha: string
  generatedAt: string
  totalFiles: number
  renderedBuildings: number
  totalBytes: number
  districts: CityDistrict[]
  buildings: CityBuilding[]
  categories: CategoryStat[]
  languages: LanguageStat[]
  bounds: { width: number; depth: number; maxHeight: number }
  warnings: CityWarning[]
}
