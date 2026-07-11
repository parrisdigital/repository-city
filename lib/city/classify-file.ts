import type { FileCategory } from "@/lib/city/types"

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  mts: "TypeScript",
  cts: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rs: "Rust",
  go: "Go",
  rb: "Ruby",
  java: "Java",
  kt: "Kotlin",
  kts: "Kotlin",
  swift: "Swift",
  css: "CSS",
  scss: "CSS",
  sass: "CSS",
  less: "CSS",
  html: "HTML",
  htm: "HTML",
  md: "Markdown",
  mdx: "Markdown",
  json: "JSON",
  jsonc: "JSON",
  yaml: "YAML",
  yml: "YAML",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
  c: "C",
  h: "C",
  cpp: "C++",
  cc: "C++",
  hpp: "C++",
  cs: "C#",
  php: "PHP",
  vue: "Vue",
  svelte: "Svelte",
  sql: "SQL",
  graphql: "GraphQL",
  gql: "GraphQL",
}

const BINARY_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "ico",
  "bmp",
  "tiff",
  "mp3",
  "wav",
  "ogg",
  "mp4",
  "mov",
  "webm",
  "pdf",
  "zip",
  "gz",
  "tar",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  "exe",
  "dll",
  "so",
  "dylib",
  "wasm",
])

const EXCLUDED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  "vendor",
  "target",
  ".git",
  ".turbo",
  ".cache",
  "out",
  "generated",
])

const LOCKFILES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "composer.lock",
  "cargo.lock",
  "gemfile.lock",
  "poetry.lock",
])

export function fileExtension(path: string) {
  const name = path.split("/").pop() ?? path
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ""
}

export function shouldIncludeFile(path: string, size: number) {
  const lower = path.toLowerCase()
  const segments = lower.split("/")
  const name = segments.at(-1) ?? lower
  const extension = fileExtension(lower)

  if (size <= 0 || size > 2_000_000) return false
  if (segments.some((segment) => EXCLUDED_DIRECTORIES.has(segment)))
    return false
  if (LOCKFILES.has(name)) return false
  if (BINARY_EXTENSIONS.has(extension)) return false
  if (/\.min\.(js|css)$/.test(lower)) return false
  if (name.endsWith(".map")) return false
  return true
}

export function classifyFile(path: string): {
  category: FileCategory
  language: string
  extension: string
} {
  const lower = path.toLowerCase()
  const extension = fileExtension(lower)
  const language = LANGUAGE_BY_EXTENSION[extension] ?? "Other"
  const segments = lower.split("/")
  const name = segments.at(-1) ?? lower

  if (
    segments.some((segment) =>
      ["test", "tests", "__tests__", "spec", "specs", "e2e"].includes(segment)
    ) ||
    /(?:^|\.)+(test|spec)\.[^.]+$/.test(name)
  ) {
    return { category: "test", language, extension }
  }

  if (
    segments.some((segment) =>
      ["docs", "documentation", ".github"].includes(segment)
    ) ||
    ["md", "mdx", "rst", "adoc"].includes(extension) ||
    /^readme(?:\.|$)/.test(name)
  ) {
    return { category: "docs", language, extension }
  }

  if (
    segments.some((segment) =>
      ["config", "configs", ".config"].includes(segment)
    ) ||
    name.startsWith(".") ||
    ["json", "jsonc", "yaml", "yml", "toml", "ini", "env"].includes(
      extension
    ) ||
    /(?:config|rc)\.[^.]+$/.test(name)
  ) {
    return { category: "config", language, extension }
  }

  if (language !== "Other") return { category: "source", language, extension }
  return { category: "other", language, extension }
}
