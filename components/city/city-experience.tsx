"use client"

import {
  Check,
  Download,
  ExternalLink,
  Layers3,
  LoaderCircle,
  Menu,
  RefreshCw,
  Search,
  Share2,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { CityCanvas } from "@/components/city/city-canvas"
import {
  CityTooltip,
  type TooltipPosition,
} from "@/components/city/city-tooltip"
import { RepositoryPanel } from "@/components/city/repository-panel"
import {
  GitHubMark,
  RepositoryCityLogo,
} from "@/components/repository-city-logo"
import {
  FILE_CATEGORIES,
  type CityBuilding,
  type CityModel,
  type FileCategory,
} from "@/lib/city/types"
import { parseRepositoryInput } from "@/lib/github/parse-repository"

const DEFAULT_REPOSITORY = "vercel/next.js"
const EXAMPLES = [
  DEFAULT_REPOSITORY,
  "react/react",
  "radiumcoders/Isometric-Github-Contributions",
]

export function CityExperience({
  initialRepository = DEFAULT_REPOSITORY,
}: {
  initialRepository?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialRepository)
  const [model, setModel] = useState<CityModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCategories, setVisibleCategories] = useState<Set<FileCategory>>(
    () => new Set(FILE_CATEGORIES)
  )
  const [hovered, setHovered] = useState<CityBuilding | null>(null)
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [webglAvailable, setWebglAvailable] = useState(true)
  const captureRef = useRef<(() => Promise<Blob | null>) | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const handleCaptureReady = useCallback(
    (capture: () => Promise<Blob | null>) => {
      captureRef.current = capture
    },
    []
  )

  const loadRepository = useCallback(async (value: string) => {
    setLoading(true)
    setError(null)
    setModel(null)
    setSelectedId(null)
    setHovered(null)
    setVisibleCategories(new Set(FILE_CATEGORIES))
    try {
      const response = await fetch(
        `/api/city?repository=${encodeURIComponent(value)}`
      )
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error ?? "The repository could not be loaded.")
      }
      setModel(payload as CityModel)
      setQuery((payload as CityModel).repository.fullName)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The repository could not be loaded."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadRepository(initialRepository),
      0
    )
    return () => window.clearTimeout(timer)
  }, [initialRepository, loadRepository])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const canvas = document.createElement("canvas")
      setWebglAvailable(
        Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
      )
    })
    return () => {
      window.cancelAnimationFrame(frame)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  function navigateTo(value: string) {
    const parsed = parseRepositoryInput(value)
    if (!parsed) {
      setModel(null)
      setLoading(false)
      setError("Enter a valid GitHub repository URL or owner/repository.")
      return
    }
    router.push(
      `/city/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repository)}`
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigateTo(query)
  }

  function toggleCategory(category: FileCategory) {
    setVisibleCategories((current) => {
      const next = new Set(current)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  const handleHover = useCallback(
    (building: CityBuilding | null, position?: TooltipPosition) => {
      setHovered(building)
      setTooltipPosition(building && position ? position : null)
      if (building) setSelectedId(building.id)
    },
    []
  )

  const handleSelect = useCallback((building: CityBuilding) => {
    setSelectedId(building.id)
    window.open(building.url, "_blank", "noopener,noreferrer")
  }, [])

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: model
            ? `${model.repository.fullName} — Repository City`
            : "Repository City",
          text: "Explore this GitHub repository as an isometric city.",
          url,
        })
        showToast("Share link ready")
        return
      } catch (shareError) {
        if ((shareError as Error).name === "AbortError") return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      showToast("Share link ready")
    } catch {
      showToast("Could not share this city")
    }
  }

  async function handleExport() {
    if (!model) return
    if (!captureRef.current) {
      showToast("The 3D scene is still preparing")
      return
    }
    try {
      const blob = await captureRef.current()
      if (!blob) throw new Error("No image")
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `${model.repository.owner}-${model.repository.name}-repository-city.png`
      anchor.style.display = "none"
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
      showToast("City image exported")
    } catch {
      showToast("Could not export this city")
    }
  }

  const warnings = useMemo(() => model?.warnings ?? [], [model])

  return (
    <main className="relative h-dvh min-h-[640px] overflow-hidden bg-[#090d11] text-[#f1f3ee]">
      <header className="absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#090d11]/92 px-4 backdrop-blur-md md:px-5">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5"
          aria-label="Repository City home"
        >
          <RepositoryCityLogo className="size-7" />
          <span className="text-[15px] font-semibold tracking-[-0.025em]">
            Repository City
          </span>
        </button>
        <a
          href="https://github.com/parrisdigital/repository-city"
          target="_blank"
          rel="noreferrer"
          className="hidden min-h-10 items-center gap-2 px-2 text-[11px] text-[#a5afb2] transition-colors hover:text-white md:flex"
        >
          <GitHubMark className="size-4" /> View on GitHub{" "}
          <ExternalLink className="size-3" />
        </a>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="grid size-11 place-items-center text-[#dfe3dd] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </button>
      </header>

      <div className="absolute inset-x-0 top-14 z-20 border-b border-white/8 bg-[#0c1217]/94 p-3 backdrop-blur md:right-auto md:left-0 md:w-[34rem] md:border-r md:p-4">
        <form
          onSubmit={handleSubmit}
          className="flex h-11 border border-white/16 bg-[#11181d]"
        >
          <span className="grid w-11 shrink-0 place-items-center border-r border-white/10 text-[#aab3b5]">
            <GitHubMark className="size-4" />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="github.com/owner/repository"
            aria-label="GitHub repository"
            className="min-w-0 flex-1 bg-transparent px-3 font-mono text-[11px] text-[#e7eae5] outline-none placeholder:text-[#667176] focus-visible:ring-1 focus-visible:ring-[#c7e739] focus-visible:ring-inset"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex min-w-24 items-center justify-center gap-2 bg-[#c7e739] px-4 text-[11px] font-semibold text-[#0b0f0c] transition-colors hover:bg-[#d9f55a] disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            Build city
          </button>
        </form>
        <div className="mt-2 hidden items-center gap-3 overflow-hidden font-mono text-[9px] text-[#6f7a7f] md:flex">
          <span className="shrink-0">Examples</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => navigateTo(example)}
              className="truncate text-[#a6bc37] hover:text-[#d9f55a]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="absolute inset-x-3 top-[7.2rem] z-40 border border-white/12 bg-[#12191e] p-3 shadow-2xl md:hidden">
          <a
            href="https://github.com/parrisdigital/repository-city"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-3 text-sm"
          >
            <GitHubMark className="size-5 text-[#c7e739]" /> View on GitHub
          </a>
        </div>
      ) : null}

      <div className="absolute inset-0 pt-[7.15rem] md:pt-14">
        {model && webglAvailable ? (
          <CityCanvas
            model={model}
            visibleCategories={visibleCategories}
            resetSignal={resetSignal}
            selectedId={selectedId}
            onHover={handleHover}
            onSelect={handleSelect}
            onCaptureReady={handleCaptureReady}
          />
        ) : null}

        {loading ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#090d11]">
            <div className="text-center">
              <div className="mx-auto mb-5 grid size-12 place-items-center border border-[#c7e739]/40">
                <LoaderCircle className="size-5 animate-spin text-[#c7e739]" />
              </div>
              <p className="text-sm font-medium">Reading the repository</p>
              <p className="mt-2 font-mono text-[10px] text-[#778287]">
                classifying files · planning districts · raising buildings
              </p>
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#090d11] p-6">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-5 grid size-12 place-items-center border border-[#f08080]/35 text-[#f08080]">
                <X className="size-5" />
              </div>
              <h1 className="text-xl font-semibold tracking-[-0.03em]">
                This city could not be built
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#929da1]">{error}</p>
              <button
                type="button"
                onClick={() => void loadRepository(query)}
                className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[#c7e739] px-5 text-xs font-semibold text-[#0a0e0b]"
              >
                <RefreshCw className="size-4" /> Try again
              </button>
            </div>
          </div>
        ) : null}

        {!loading && model && !webglAvailable ? (
          <div className="absolute inset-0 grid place-items-center overflow-auto bg-[#090d11] p-6">
            <div className="max-w-xl">
              <h1 className="text-xl font-semibold">WebGL is unavailable</h1>
              <p className="mt-2 text-sm text-[#8f9a9e]">
                The 3D renderer cannot start in this browser. The repository
                model was generated successfully.
              </p>
              <div className="mt-6">
                <RepositoryPanel
                  model={model}
                  visibleCategories={visibleCategories}
                  onToggleCategory={toggleCategory}
                  compact
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {model && !loading ? (
        <>
          <aside className="absolute top-[10.6rem] left-4 z-20 hidden w-64 border border-white/12 bg-[#10171c]/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-md md:block">
            <RepositoryPanel
              model={model}
              visibleCategories={visibleCategories}
              onToggleCategory={toggleCategory}
            />
          </aside>

          <div className="absolute top-[4.5rem] right-4 z-20 hidden items-center gap-2 md:flex">
            <ToolButton
              label="Reset view"
              icon={<RefreshCw />}
              onClick={() => setResetSignal((value) => value + 1)}
            />
            <ToolButton
              label="Share"
              icon={<Share2 />}
              onClick={() => void handleShare()}
            />
            <ToolButton
              label="Export"
              icon={<Download />}
              onClick={() => void handleExport()}
            />
          </div>

          <div className="absolute inset-x-3 bottom-3 z-30 flex gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobilePanelOpen(true)}
              className="flex min-h-12 flex-1 items-center gap-2 border border-white/14 bg-[#12191e]/96 px-4 text-xs font-medium backdrop-blur"
            >
              <Layers3 className="size-4 text-[#c7e739]" /> Layers & repository
            </button>
            <button
              type="button"
              onClick={() => setResetSignal((value) => value + 1)}
              className="grid size-12 place-items-center border border-white/14 bg-[#12191e]/96"
              aria-label="Reset view"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="grid size-12 place-items-center border border-white/14 bg-[#12191e]/96"
              aria-label="Share"
            >
              <Share2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              className="grid size-12 place-items-center border border-white/14 bg-[#12191e]/96"
              aria-label="Export"
            >
              <Download className="size-4" />
            </button>
          </div>

          {mobilePanelOpen ? (
            <div
              className="absolute inset-0 z-50 flex items-end bg-black/55 md:hidden"
              onClick={() => setMobilePanelOpen(false)}
            >
              <section
                className="max-h-[76dvh] w-full overflow-y-auto rounded-t-[2rem] border-t border-white/15 bg-[#12191e] px-5 pt-3 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setMobilePanelOpen(false)}
                  className="mx-auto mb-4 block h-1 w-20 rounded-full bg-white/35"
                  aria-label="Close repository panel"
                />
                <RepositoryPanel
                  model={model}
                  visibleCategories={visibleCategories}
                  onToggleCategory={toggleCategory}
                  compact
                />
              </section>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="absolute bottom-20 left-1/2 z-20 hidden max-w-xl -translate-x-1/2 border border-[#c7e739]/20 bg-[#10171c]/92 px-4 py-2 font-mono text-[9px] text-[#aab3b5] backdrop-blur lg:block">
              {warnings.map((warning) => warning.message).join(" · ")}
            </div>
          ) : null}
        </>
      ) : null}

      {hovered && tooltipPosition ? (
        <CityTooltip building={hovered} position={tooltipPosition} />
      ) : null}

      {toast ? (
        <div className="absolute bottom-20 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 border border-white/15 bg-[#171f24] px-4 py-2 text-[11px] shadow-2xl md:bottom-6">
          <Check className="size-3.5 text-[#c7e739]" /> {toast}
        </div>
      ) : null}
    </main>
  )
}

function ToolButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ReactElement<{ className?: string }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-2 border border-white/14 bg-[#10171c]/92 px-4 text-[11px] text-[#e2e6e0] backdrop-blur transition-colors hover:border-[#c7e739]/45 hover:bg-[#151e22]"
    >
      {icon && <span className="[&>svg]:size-3.5">{icon}</span>}
      {label}
    </button>
  )
}
