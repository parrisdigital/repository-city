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

export function parseRepositoryInput(
  input: string
): RepositoryReference | null {
  const trimmed = input.trim().replace(/\.git$/i, "")
  if (!trimmed || trimmed.length > 300) return null

  let candidate = trimmed

  if (trimmed.includes("github.com")) {
    try {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
      )
      if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
        return null
      }
      candidate = url.pathname
    } catch {
      return null
    }
  }

  const [owner, repository, ...rest] = candidate.split("/").filter(Boolean)
  if (!owner || !repository || rest.length > 0) return null

  const ownerResult = ownerSchema.safeParse(owner)
  const repositoryResult = repositorySchema.safeParse(repository)
  if (!ownerResult.success || !repositoryResult.success) return null

  return { owner: ownerResult.data, repository: repositoryResult.data }
}
