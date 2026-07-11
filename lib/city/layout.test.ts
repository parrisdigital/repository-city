import { describe, expect, it } from "vitest"

import { layoutCity } from "@/lib/city/layout"
import type { NormalizedFile } from "@/lib/city/types"

function file(path: string, district: string, size: number): NormalizedFile {
  return {
    path,
    name: path.split("/").at(-1) ?? path,
    directory: district,
    district,
    extension: "ts",
    language: "TypeScript",
    category: path.includes("test") ? "test" : "source",
    size,
    sha: `${path}-${size}`,
    url: `https://github.com/example/repo/blob/main/${path}`,
  }
}

describe("layoutCity", () => {
  const files = [
    file("app/page.tsx", "app", 5000),
    file("app/layout.tsx", "app", 3000),
    file("lib/layout.ts", "lib", 8000),
    file("lib/layout.test.ts", "lib", 2000),
  ]

  it("is deterministic", () => {
    expect(layoutCity(files)).toEqual(layoutCity(files))
  })

  it("keeps buildings inside their districts", () => {
    const result = layoutCity(files)
    for (const building of result.buildings) {
      const district = result.districts.find(
        (candidate) => candidate.name === building.district
      )
      expect(district).toBeDefined()
      expect(Math.abs(building.x - district!.x)).toBeLessThanOrEqual(
        district!.width / 2
      )
      expect(Math.abs(building.z - district!.z)).toBeLessThanOrEqual(
        district!.depth / 2
      )
    }
  })

  it("does not overlap districts", () => {
    const { districts } = layoutCity(files)
    for (let leftIndex = 0; leftIndex < districts.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < districts.length;
        rightIndex += 1
      ) {
        const left = districts[leftIndex]
        const right = districts[rightIndex]
        const separated =
          Math.abs(left.x - right.x) >= (left.width + right.width) / 2 ||
          Math.abs(left.z - right.z) >= (left.depth + right.depth) / 2
        expect(separated).toBe(true)
      }
    }
  })
})
