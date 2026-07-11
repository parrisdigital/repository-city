import { aggregateFiles } from "@/lib/city/aggregate-files"
import { layoutCity } from "@/lib/city/layout"
import { normalizeTree } from "@/lib/city/normalize-tree"
import type {
  CityModel,
  CityWarning,
  RepositorySummary,
} from "@/lib/city/types"
import type {
  GitHubProfileResponse,
  GitHubRepositoryResponse,
  GitHubTreeEntry,
} from "@/lib/github/types"

export type ProfileRepositoryTree = {
  repository: GitHubRepositoryResponse
  tree: GitHubTreeEntry[]
  treeSha: string
  truncated: boolean
}

function aggregatePortfolio(files: ReturnType<typeof normalizeTree>) {
  const districts = new Map<string, typeof files>()
  files.forEach((file) => {
    const district = districts.get(file.district) ?? []
    district.push(file)
    districts.set(file.district, district)
  })
  const districtBudget = Math.max(
    30,
    Math.min(320, Math.floor(1200 / Math.max(1, districts.size)))
  )
  let aggregatedCount = 0
  const portfolioFiles = [...districts.values()].flatMap((districtFiles) => {
    const aggregated = aggregateFiles(districtFiles, districtBudget)
    aggregatedCount += aggregated.aggregatedCount
    return aggregated.files
  })
  return { files: portfolioFiles, aggregatedCount }
}

function dominantLanguage(repositories: GitHubRepositoryResponse[]) {
  const sizes = new Map<string, number>()
  for (const repository of repositories) {
    const language = repository.language ?? "Other"
    sizes.set(language, (sizes.get(language) ?? 0) + repository.size)
  }
  return [...sizes.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  )[0]?.[0]
}

export function buildProfileCityModel({
  profile,
  repositories,
  repositoryTrees,
  failedRepositories = 0,
  omittedRepositories = 0,
}: {
  profile: GitHubProfileResponse
  repositories: GitHubRepositoryResponse[]
  repositoryTrees: ProfileRepositoryTree[]
  failedRepositories?: number
  omittedRepositories?: number
}): CityModel {
  const normalized = repositoryTrees.flatMap(({ repository, tree }) =>
    normalizeTree(tree, repository.html_url, repository.default_branch).map(
      (file) => ({
        ...file,
        path: `${repository.name}/${file.path}`,
        directory: file.directory
          ? `${repository.name}/${file.directory}`
          : repository.name,
        district: repository.name,
        sha: `${repository.id}-${file.sha}`,
      })
    )
  )
  const totalFiles = normalized.reduce(
    (sum, file) => sum + (file.aggregateCount ?? 1),
    0
  )
  const totalBytes = normalized.reduce((sum, file) => sum + file.size, 0)
  const aggregated = aggregatePortfolio(normalized)
  const layout = layoutCity(aggregated.files)
  const warnings: CityWarning[] = []

  const truncatedTrees = repositoryTrees.filter((item) => item.truncated).length
  if (truncatedTrees > 0) {
    warnings.push({
      code: "TRUNCATED",
      message: `GitHub truncated ${truncatedTrees.toLocaleString()} unusually large repository ${truncatedTrees === 1 ? "tree" : "trees"}.`,
    })
  }
  if (failedRepositories > 0) {
    warnings.push({
      code: "TRUNCATED",
      message: `${failedRepositories.toLocaleString()} public ${failedRepositories === 1 ? "repository" : "repositories"} could not be read and were skipped.`,
    })
  }
  if (omittedRepositories > 0) {
    warnings.push({
      code: "TRUNCATED",
      message: `${omittedRepositories.toLocaleString()} older ${omittedRepositories === 1 ? "repository was" : "repositories were"} omitted to stay within GitHub's API limits.`,
    })
  }
  if (aggregated.aggregatedCount > 0) {
    warnings.push({
      code: "AGGREGATED",
      message: `${aggregated.aggregatedCount.toLocaleString()} smaller files were combined to keep the portfolio city fast.`,
    })
  }
  if (normalized.length === 0) {
    warnings.push({
      code: "EMPTY",
      message:
        "No visualizable files were found across this profile's public repositories.",
    })
  }

  const primaryLanguage = dominantLanguage(repositories) ?? null
  const latestUpdate = repositories
    .map((repository) => repository.updated_at)
    .sort()
    .at(-1)
  const repository: RepositorySummary = {
    owner: profile.login,
    name: profile.name ?? profile.login,
    fullName: `@${profile.login}`,
    description:
      profile.bio ??
      `${profile.public_repos.toLocaleString()} public GitHub repositories`,
    url: profile.html_url,
    defaultBranch: "",
    stars: repositories.reduce((sum, item) => sum + item.stargazers_count, 0),
    forks: repositories.reduce((sum, item) => sum + item.forks_count, 0),
    primaryLanguage,
    updatedAt: latestUpdate ?? profile.updated_at,
  }

  return {
    kind: "profile",
    repository,
    profile: {
      name: profile.name,
      avatarUrl: profile.avatar_url,
      publicRepositories: profile.public_repos,
      visualizedRepositories: repositoryTrees.length,
      followers: profile.followers,
      following: profile.following,
    },
    treeSha: repositoryTrees
      .map((item) => `${item.repository.id}:${item.treeSha}`)
      .join("|"),
    generatedAt: new Date().toISOString(),
    totalFiles,
    renderedBuildings: layout.buildings.length,
    totalBytes,
    ...layout,
    warnings,
  }
}
