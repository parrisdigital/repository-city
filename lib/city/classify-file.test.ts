import { describe, expect, it } from "vitest"

import { classifyFile, shouldIncludeFile } from "@/lib/city/classify-file"

describe("classifyFile", () => {
  it("classifies source files", () => {
    expect(classifyFile("app/page.tsx")).toMatchObject({
      category: "source",
      language: "TypeScript",
    })
  })

  it("prioritizes tests over source", () => {
    expect(classifyFile("lib/__tests__/layout.test.ts").category).toBe("test")
  })

  it("classifies documentation and configuration", () => {
    expect(classifyFile("docs/architecture.md").category).toBe("docs")
    expect(classifyFile("next.config.ts").category).toBe("config")
  })
})

describe("shouldIncludeFile", () => {
  it("filters generated, binary, lock, and minified files", () => {
    expect(shouldIncludeFile("dist/index.js", 100)).toBe(false)
    expect(shouldIncludeFile("public/hero.png", 100)).toBe(false)
    expect(shouldIncludeFile("pnpm-lock.yaml", 100)).toBe(false)
    expect(shouldIncludeFile("app.min.js", 100)).toBe(false)
  })

  it("keeps normal source files", () => {
    expect(shouldIncludeFile("src/index.ts", 1200)).toBe(true)
  })
})
