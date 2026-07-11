export class GitHubRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code:
      "NOT_FOUND" | "RATE_LIMITED" | "UPSTREAM" | "INVALID_RESPONSE"
  ) {
    super(message)
    this.name = "GitHubRequestError"
  }
}
