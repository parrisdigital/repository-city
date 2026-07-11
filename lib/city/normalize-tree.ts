import { classifyFile, shouldIncludeFile } from "@/lib/city/classify-file"
import type { NormalizedFile } from "@/lib/city/types"
import type { GitHubTreeEntry } from "@/lib/github/types"

export function normalizeTree(
  entries: GitHubTreeEntry[],
  repositoryUrl: string,
  branch: string
): NormalizedFile[] {
  return entries
    .filter((entry) => entry.type === "blob")
    .filter((entry) => shouldIncludeFile(entry.path, entry.size ?? 0))
    .map((entry) => {
      const parts = entry.path.split("/")
      const name = parts.at(-1) ?? entry.path
      const directory = parts.slice(0, -1).join("/")
      const district = parts.length > 1 ? parts[0] : "Root Plaza"
      const classification = classifyFile(entry.path)

      return {
        path: entry.path,
        name,
        directory,
        district,
        size: entry.size ?? 0,
        sha: entry.sha,
        url: `${repositoryUrl}/blob/${encodeURIComponent(branch)}/${entry.path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`,
        ...classification,
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))
}
