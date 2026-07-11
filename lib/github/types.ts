export type GitHubRepositoryResponse = {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  default_branch: string
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  pushed_at: string | null
  size: number
  fork: boolean
  archived: boolean
  is_template: boolean
  owner: { login: string }
}

export type GitHubProfileResponse = {
  login: string
  name: string | null
  bio: string | null
  html_url: string
  avatar_url: string
  public_repos: number
  followers: number
  following: number
  updated_at: string
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
