import { buildCityModel } from "@/lib/city/build-city"
import { buildProfileCityModel } from "@/lib/city/build-profile-city"
import {
  fetchProfile,
  fetchProfileRepositories,
  fetchRepository,
  fetchRepositoryTree,
} from "@/lib/github/client"
import { GitHubRequestError } from "@/lib/github/errors"
import { parseGitHubInput } from "@/lib/github/parse-repository"

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
      return Response.json(buildProfileCityModel({ profile, repositories }), {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
        },
      })
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
          "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
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
