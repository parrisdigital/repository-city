import type { FileCategory } from "@/lib/city/types"

export const CATEGORY_COLORS: Record<FileCategory, string> = {
  source: "#3f78ff",
  test: "#8d5de7",
  docs: "#52c6ca",
  config: "#c7e739",
  other: "#7c8793",
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#4c8dff",
  JavaScript: "#d8ed43",
  Python: "#57a4e8",
  Rust: "#e1835b",
  Go: "#55c9d8",
  Ruby: "#d45f6b",
  Java: "#e59e45",
  Kotlin: "#9d68e8",
  Swift: "#ef784f",
  CSS: "#a465dc",
  HTML: "#e66b4a",
  Markdown: "#72c7cb",
  JSON: "#c7e739",
  YAML: "#d97d97",
  Shell: "#79c997",
  Other: "#89939e",
}

export function languageColor(language: string) {
  return LANGUAGE_COLORS[language] ?? LANGUAGE_COLORS.Other
}
