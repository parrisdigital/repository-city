import { describe, expect, it } from "vitest"

import { buildProfileCityModel } from "@/lib/city/build-profile-city"
import type {
  GitHubRepositoryResponse,
  GitHubTreeEntry,
} from "@/lib/github/types"

function repository(
  id: number,
  name: string,
  language: string,
  overrides: Partial<GitHubRepositoryResponse> = {}
): GitHubRepositoryResponse {
  return {
    id,
    name,
    full_name: `parrisdigital/${name}`,
    description: null,
    html_url: `https://github.com/parrisdigital/${name}`,
    default_branch: "main",
    stargazers_count: 0,
    forks_count: 0,
    language,
    updated_at: "2026-07-10T00:00:00Z",
    pushed_at: "2026-07-10T00:00:00Z",
    size: id * 100,
    fork: false,
    archived: false,
    is_template: false,
    owner: { login: "parrisdigital" },
    ...overrides,
  }
}

describe("buildProfileCityModel", () => {
  it("maps every public repository into a language district", () => {
    const city = buildProfileCityModel({
      profile: {
        login: "parrisdigital",
        name: "Parris Digital",
        bio: "Building useful things.",
        html_url: "https://github.com/parrisdigital",
        avatar_url: "https://avatars.githubusercontent.com/u/1",
        public_repos: 3,
        followers: 10,
        following: 2,
        updated_at: "2026-07-10T00:00:00Z",
      },
      repositories: [
        repository(1, "city", "TypeScript"),
        repository(2, "site", "TypeScript", { fork: true }),
        repository(3, "tools", "Python", { archived: true }),
      ],
      repositoryTrees: [
        tree(repository(1, "city", "TypeScript"), "app/page.tsx"),
        tree(
          repository(2, "site", "TypeScript", { fork: true }),
          "src/site.test.ts"
        ),
        tree(repository(3, "tools", "Python", { archived: true }), "README.md"),
      ],
    })

    expect(city.kind).toBe("profile")
    expect(city.totalFiles).toBe(3)
    expect(city.renderedBuildings).toBe(3)
    expect(city.districts.map((district) => district.name).sort()).toEqual([
      "city",
      "site",
      "tools",
    ])
    expect(city.categories.map((category) => category.category)).toEqual([
      "source",
      "test",
      "docs",
    ])
  })
})

function tree(sourceRepository: GitHubRepositoryResponse, path: string) {
  const entry: GitHubTreeEntry = {
    path,
    mode: "100644",
    type: "blob",
    sha: `${sourceRepository.id}-${path}`,
    size: sourceRepository.id * 1000,
    url: `https://api.github.com/repos/parrisdigital/${sourceRepository.name}/git/blobs/${sourceRepository.id}`,
  }
  return {
    repository: sourceRepository,
    tree: [entry],
    treeSha: `tree-${sourceRepository.id}`,
    truncated: false,
  }
}
