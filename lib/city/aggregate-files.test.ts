import { describe, expect, it } from "vitest"

import { aggregateFiles } from "@/lib/city/aggregate-files"
import type { NormalizedFile } from "@/lib/city/types"

describe("aggregateFiles", () => {
  it("preserves small inputs", () => {
    const files = [createFile(0), createFile(1)]
    expect(aggregateFiles(files, 10)).toEqual({
      files,
      aggregatedCount: 0,
    })
  })

  it("caps large inputs and records aggregation", () => {
    const files = Array.from({ length: 100 }, (_, index) => createFile(index))
    const result = aggregateFiles(files, 20)
    expect(result.files.length).toBeLessThanOrEqual(20)
    expect(result.aggregatedCount).toBeGreaterThan(0)
    expect(result.files.some((file) => file.isAggregate)).toBe(true)
    const renderedSizes = result.files
      .filter((file) => !file.isAggregate)
      .map((file) => file.size)
    expect(Math.min(...renderedSizes)).toBeLessThan(50)
    expect(Math.max(...renderedSizes)).toBeGreaterThan(90)
  })
})

function createFile(index: number): NormalizedFile {
  return {
    path: `src/file-${index}.ts`,
    name: `file-${index}.ts`,
    directory: "src",
    district: "src",
    extension: "ts",
    language: "TypeScript",
    category: "source",
    size: index + 1,
    sha: String(index),
    url: `https://github.com/example/repo/blob/main/src/file-${index}.ts`,
  }
}
