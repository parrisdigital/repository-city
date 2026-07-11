import { layoutCity } from "@/lib/city/layout"
import type {
  CityModel,
  CityWarning,
  FileCategory,
  NormalizedFile,
  RepositorySummary,
} from "@/lib/city/types"
import type {
  GitHubProfileResponse,
  GitHubRepositoryResponse,
} from "@/lib/github/types"

function repositoryCategory(
  repository: GitHubRepositoryResponse
): FileCategory {
  if (repository.archived) return "docs"
  if (repository.is_template) return "config"
  if (repository.fork) return "test"
  return "source"
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
}: {
  profile: GitHubProfileResponse
  repositories: GitHubRepositoryResponse[]
}): CityModel {
  const visibleRepositories = repositories.filter(
    (repository) => repository.owner.login === profile.login
  )
  const files: NormalizedFile[] = visibleRepositories.map((repository) => {
    const language = repository.language ?? "Other"
    return {
      path: repository.name,
      name: repository.name,
      directory: language,
      district: language,
      extension: "",
      language,
      category: repositoryCategory(repository),
      size: Math.max(1, repository.size * 1024),
      sha: `repository-${repository.id}`,
      url: repository.html_url,
    }
  })
  const totalBytes = files.reduce((sum, repository) => sum + repository.size, 0)
  const layout = layoutCity(files)
  const warnings: CityWarning[] = []
  if (files.length === 0) {
    warnings.push({
      code: "EMPTY",
      message: "No public repositories were found for this profile.",
    })
  }

  const primaryLanguage = dominantLanguage(visibleRepositories) ?? null
  const latestUpdate = visibleRepositories
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
    stars: visibleRepositories.reduce(
      (sum, item) => sum + item.stargazers_count,
      0
    ),
    forks: visibleRepositories.reduce((sum, item) => sum + item.forks_count, 0),
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
      followers: profile.followers,
      following: profile.following,
    },
    treeSha: visibleRepositories
      .map((item) => `${item.id}:${item.updated_at}`)
      .join("|"),
    generatedAt: new Date().toISOString(),
    totalFiles: visibleRepositories.length,
    renderedBuildings: layout.buildings.length,
    totalBytes,
    ...layout,
    warnings,
  }
}
