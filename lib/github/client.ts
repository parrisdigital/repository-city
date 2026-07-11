import { GitHubRequestError } from "@/lib/github/errors"
import type {
  GitHubRepositoryResponse,
  GitHubTreeResponse,
} from "@/lib/github/types"

const GITHUB_API = "https://api.github.com"

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "repository-city",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function githubFetch<T>(path: string, cacheResponse = true): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
    ...(cacheResponse
      ? { cache: "force-cache" as const, next: { revalidate: 3600 } }
      : { cache: "no-store" as const }),
    signal: AbortSignal.timeout(12_000),
  })

  if (response.status === 404) {
    throw new GitHubRequestError(
      "That public repository could not be found.",
      404,
      "NOT_FOUND"
    )
  }

  if (
    response.status === 403 &&
    response.headers.get("x-ratelimit-remaining") === "0"
  ) {
    throw new GitHubRequestError(
      "GitHub's public API limit has been reached. Please try again later.",
      429,
      "RATE_LIMITED"
    )
  }

  if (!response.ok) {
    throw new GitHubRequestError(
      "GitHub could not provide this repository right now.",
      502,
      "UPSTREAM"
    )
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new GitHubRequestError(
      "GitHub returned an unreadable response.",
      502,
      "INVALID_RESPONSE"
    )
  }
}

export async function fetchRepository(
  owner: string,
  repository: string
): Promise<GitHubRepositoryResponse> {
  return githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`
  )
}

export async function fetchRepositoryTree(
  owner: string,
  repository: string,
  ref: string
): Promise<GitHubTreeResponse> {
  return githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    false
  )
}
