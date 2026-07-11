import { z } from "zod"

const ownerSchema = z
  .string()
  .min(1)
  .max(39)
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/)

const repositorySchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/)

export type RepositoryReference = { owner: string; repository: string }
export type GitHubReference =
  | ({ kind: "repository" } & RepositoryReference)
  | { kind: "profile"; owner: string }

function normalizedCandidate(input: string) {
  const trimmed = input.trim().replace(/\.git$/i, "")
  if (!trimmed || trimmed.length > 300) return null

  if (!trimmed.includes("github.com")) return trimmed.replace(/^@/, "")

  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    )
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      return null
    }
    return url.pathname
  } catch {
    return null
  }
}

export function parseRepositoryInput(
  input: string
): RepositoryReference | null {
  const candidate = normalizedCandidate(input)
  if (!candidate) return null

  const [owner, repository, ...rest] = candidate.split("/").filter(Boolean)
  if (!owner || !repository || rest.length > 0) return null

  const ownerResult = ownerSchema.safeParse(owner)
  const repositoryResult = repositorySchema.safeParse(repository)
  if (!ownerResult.success || !repositoryResult.success) return null

  return { owner: ownerResult.data, repository: repositoryResult.data }
}

export function parseGitHubInput(input: string): GitHubReference | null {
  const repository = parseRepositoryInput(input)
  if (repository) return { kind: "repository", ...repository }

  const candidate = normalizedCandidate(input)
  if (!candidate) return null
  const [owner, ...rest] = candidate.split("/").filter(Boolean)
  if (!owner || rest.length > 0) return null

  const ownerResult = ownerSchema.safeParse(owner)
  if (!ownerResult.success) return null
  return { kind: "profile", owner: ownerResult.data }
}
