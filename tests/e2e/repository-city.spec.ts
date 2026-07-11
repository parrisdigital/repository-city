import { expect, test } from "@playwright/test"

import { buildCityModel } from "../../lib/city/build-city"
import type { GitHubTreeEntry } from "../../lib/github/types"

const tree: GitHubTreeEntry[] = [
  blob("app/page.tsx", 5400, "page"),
  blob("app/layout.tsx", 2100, "layout"),
  blob("lib/city/layout.ts", 8800, "city-layout"),
  blob("lib/city/layout.test.ts", 3400, "city-layout-test"),
  blob("docs/architecture.md", 1800, "architecture"),
  blob("next.config.ts", 600, "next-config"),
]

const model = buildCityModel({
  repository: {
    owner: "parrisdigital",
    name: "repository-city",
    fullName: "parrisdigital/repository-city",
    description: "Explore code as architecture.",
    url: "https://github.com/parrisdigital/repository-city",
    defaultBranch: "main",
    stars: 0,
    forks: 0,
    primaryLanguage: "TypeScript",
    updatedAt: "2026-07-10T00:00:00Z",
  },
  tree,
  treeSha: "fixture-tree",
  truncated: false,
})

test.beforeEach(async ({ page }) => {
  await page.route("**/api/city?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(model),
    })
  })
})

test("loads a city and toggles a category", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("parrisdigital/repository-city")).toBeVisible()
  const source = page.getByRole("button", { name: /Source/ })
  await expect(source).toHaveAttribute("aria-pressed", "true")
  await source.click()
  await expect(source).toHaveAttribute("aria-pressed", "false")
})

test("opens the repository sheet on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.getByRole("button", { name: "Layers & repository" }).click()
  await expect(
    page.getByRole("heading", { name: "Language distribution" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Close repository panel" })
  ).toBeVisible()
})

function blob(path: string, size: number, sha: string): GitHubTreeEntry {
  return {
    path,
    size,
    sha,
    mode: "100644",
    type: "blob",
    url: `https://api.github.com/blobs/${sha}`,
  }
}
