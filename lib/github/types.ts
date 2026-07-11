export type GitHubRepositoryResponse = {
  name: string
  full_name: string
  description: string | null
  html_url: string
  default_branch: string
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  owner: { login: string }
}

export type GitHubTreeEntry = {
  path: string
  mode: string
  type: "blob" | "tree" | "commit"
  sha: string
  size?: number
  url: string
}

export type GitHubTreeResponse = {
  sha: string
  tree: GitHubTreeEntry[]
  truncated: boolean
}
