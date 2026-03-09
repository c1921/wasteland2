import { startTransition, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import type {
  PixiGameViewHandle,
  PlayerCommandIntent,
  PlayerCommandMode,
  SelectionState,
} from "@/game/input/types"
import { PixiGameErrorBoundary } from "@/game/PixiGameErrorBoundary"
import { PixiGameView } from "@/game/PixiGameView"

const MODE_OPTIONS: Array<{
  description: string
  label: string
  mode: PlayerCommandMode
}> = [
  {
    description: "Select tiles and inspect the current target.",
    label: "Inspect",
    mode: "inspect",
  },
  {
    description: "Emit a chop-tree intent when clicking a tree.",
    label: "Chop",
    mode: "chop",
  },
  {
    description: "Emit a place-blueprint intent for wall on buildable ground.",
    label: "Wall",
    mode: "build-wall",
  },
  {
    description: "Emit a place-blueprint intent for bed on buildable ground.",
    label: "Bed",
    mode: "build-bed",
  },
  {
    description: "Emit a cancel-blueprint intent when clicking a blueprint.",
    label: "Cancel",
    mode: "cancel-blueprint",
  },
]

export function App() {
  const gameViewRef = useRef<PixiGameViewHandle | null>(null)
  const [commandMode, setCommandMode] = useState<PlayerCommandMode>("inspect")
  const [lastIntent, setLastIntent] = useState<PlayerCommandIntent | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(66,153,225,0.16),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
      <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <header className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-cyan-950/25 backdrop-blur md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                Phase 3
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Wasteland Camera And Input
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                  The runtime now supports camera pan and zoom, tile picking,
                  sticky command modes, and an intent bridge from Pixi into the
                  React shell.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-left font-mono text-xs text-slate-300 md:text-right">
              <div>world: 50 x 50 tiles @ 32px logic size</div>
              <div>camera: wheel zoom, middle drag, space + left drag</div>
              <div>input: selection + command intent bridge</div>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Command mode
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => gameViewRef.current?.resetCamera()}
                  >
                    Reset view
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {MODE_OPTIONS.map((option) => (
                    <Button
                      key={option.mode}
                      variant={commandMode === option.mode ? "default" : "outline"}
                      size="sm"
                      title={option.description}
                      onClick={() => setCommandMode(option.mode)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Current selection
                </p>
                <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 font-mono text-xs leading-6 text-slate-200">
                  {formatSelectionSummary(selection)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Last intent
                </p>
                <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 font-mono text-xs leading-6 text-slate-200">
                  {formatIntentSummary(lastIntent)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Controls
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  <li>Left click selects a tile and tries the active command mode.</li>
                  <li>Middle drag or `Space + Left drag` pans the camera.</li>
                  <li>Mouse wheel zooms toward the cursor position.</li>
                  <li>Reset view returns to fit-to-world.</li>
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Phase boundary
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This phase stops at selection and command intents. World
                  mutation, jobs, and blueprint creation stay in later phases.
                </p>
              </div>
            </div>
          </aside>

          <div className="min-h-[540px] overflow-hidden rounded-[32px] border border-cyan-300/20 bg-slate-950/55 shadow-2xl shadow-cyan-950/30">
            <PixiGameErrorBoundary className="h-full min-h-[540px] w-full">
              <PixiGameView
                ref={gameViewRef}
                className="h-full min-h-[540px] w-full"
                commandMode={commandMode}
                onCommandIntent={(intent) => {
                  startTransition(() => {
                    setLastIntent(intent)
                  })
                }}
                onSelectionChange={(nextSelection) => {
                  startTransition(() => {
                    setSelection(nextSelection)
                  })
                }}
              />
            </PixiGameErrorBoundary>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

function formatSelectionSummary(selection: SelectionState | null): string {
  if (!selection) {
    return "none"
  }

  const objectLabel = selection.objectKind ? ` ${selection.objectKind}` : " empty"

  return `tile ${selection.tile.x},${selection.tile.y}${objectLabel}`
}

function formatIntentSummary(intent: PlayerCommandIntent | null): string {
  if (!intent) {
    return "none"
  }

  switch (intent.type) {
    case "chopTree":
      return `chop tree ${intent.targetId} @ ${intent.tile.x},${intent.tile.y}`
    case "placeBlueprint":
      return `place ${intent.recipeType} blueprint @ ${intent.tile.x},${intent.tile.y}`
    case "cancelBlueprint":
      return `cancel blueprint ${intent.targetId} @ ${intent.tile.x},${intent.tile.y}`
  }
}
