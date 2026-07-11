import { buildCityModel } from "@/lib/city/build-city"
import {
  buildProfileCityModel,
  type ProfileRepositoryTree,
} from "@/lib/city/build-profile-city"
import {
  fetchProfile,
  fetchProfileRepositories,
  fetchRepository,
  fetchRepositoryTree,
} from "@/lib/github/client"
import { GitHubRequestError } from "@/lib/github/errors"
import { parseGitHubInput } from "@/lib/github/parse-repository"
import type { GitHubRepositoryResponse } from "@/lib/github/types"

const PROFILE_FETCH_CONCURRENCY = 6

async function fetchProfileTrees(repositories: GitHubRepositoryResponse[]) {
  const trees: ProfileRepositoryTree[] = []
  let failedRepositories = 0

  for (
    let index = 0;
    index < repositories.length;
    index += PROFILE_FETCH_CONCURRENCY
  ) {
    const batch = repositories.slice(index, index + PROFILE_FETCH_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(async (repository) => {
        const tree = await fetchRepositoryTree(
          repository.owner.login,
          repository.name,
          repository.default_branch
        )
        return {
          repository,
          tree: tree.tree,
          treeSha: tree.sha,
          truncated: tree.truncated,
        } satisfies ProfileRepositoryTree
      })
    )

    results.forEach((result) => {
      if (result.status === "fulfilled") trees.push(result.value)
      else failedRepositories += 1
    })
  }

  return { trees, failedRepositories }
}

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("repository") ?? ""
  const parsed = parseGitHubInput(input)

  if (!parsed) {
    return Response.json(
      {
        error:
          "Enter a valid GitHub profile, repository URL, username, or owner/repository.",
      },
      { status: 400 }
    )
  }

  try {
    if (parsed.kind === "profile") {
      const [profile, repositories] = await Promise.all([
        fetchProfile(parsed.owner),
        fetchProfileRepositories(parsed.owner),
      ])
      const selectedRepositories = repositories.slice(
        0,
        process.env.GITHUB_TOKEN ? 100 : 40
      )
      const { trees, failedRepositories } =
        await fetchProfileTrees(selectedRepositories)
      return Response.json(
        buildProfileCityModel({
          profile,
          repositories,
          repositoryTrees: trees,
          failedRepositories,
          omittedRepositories: Math.max(
            0,
            repositories.length - selectedRepositories.length
          ),
        }),
        {
          headers: {
            "Cache-Control":
              "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
          },
        }
      )
    }

    const rawRepository = await fetchRepository(parsed.owner, parsed.repository)
    const tree = await fetchRepositoryTree(
      parsed.owner,
      parsed.repository,
      rawRepository.default_branch
    )
    const repository = {
      owner: rawRepository.owner.login,
      name: rawRepository.name,
      fullName: rawRepository.full_name,
      description: rawRepository.description,
      url: rawRepository.html_url,
      defaultBranch: rawRepository.default_branch,
      stars: rawRepository.stargazers_count,
      forks: rawRepository.forks_count,
      primaryLanguage: rawRepository.language,
      updatedAt: rawRepository.updated_at,
    }
    const city = buildCityModel({
      repository,
      tree: tree.tree,
      treeSha: tree.sha,
      truncated: tree.truncated,
    })

    return Response.json(city, {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    if (error instanceof GitHubRequestError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "GitHub took too long to respond. Please try again."
        : "The city could not be generated right now."
    return Response.json({ error: message }, { status: 502 })
  }
}
