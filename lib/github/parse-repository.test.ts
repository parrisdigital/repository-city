import { describe, expect, it } from "vitest"

import {
  parseGitHubInput,
  parseRepositoryInput,
} from "@/lib/github/parse-repository"

describe("parseRepositoryInput", () => {
  it.each([
    ["vercel/next.js", { owner: "vercel", repository: "next.js" }],
    [
      "https://github.com/facebook/react",
      { owner: "facebook", repository: "react" },
    ],
    [
      "github.com/parrisdigital/Repository-City.git",
      { owner: "parrisdigital", repository: "Repository-City" },
    ],
  ])("parses %s", (input, expected) => {
    expect(parseRepositoryInput(input)).toEqual(expected)
  })

  it.each([
    "",
    "github.com/owner",
    "https://gitlab.com/owner/repo",
    "owner/repo/issues",
    "-owner/repo",
  ])("rejects %s", (input) => {
    expect(parseRepositoryInput(input)).toBeNull()
  })
})

describe("parseGitHubInput", () => {
  it.each([
    ["parrisdigital", { kind: "profile", owner: "parrisdigital" }],
    ["@parrisdigital", { kind: "profile", owner: "parrisdigital" }],
    [
      "https://github.com/parrisdigital",
      { kind: "profile", owner: "parrisdigital" },
    ],
    [
      "parrisdigital/repository-city",
      {
        kind: "repository",
        owner: "parrisdigital",
        repository: "repository-city",
      },
    ],
  ])("parses %s", (input, expected) => {
    expect(parseGitHubInput(input)).toEqual(expected)
  })
})
