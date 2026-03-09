import { PixiGameErrorBoundary } from "@/game/PixiGameErrorBoundary"
import { PixiGameView } from "@/game/PixiGameView"

export function App() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(66,153,225,0.16),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
      <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <header className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-cyan-950/25 backdrop-blur md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                Phase 2
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Wasteland Map System
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                  The world now boots with a deterministic 50x50 grid, seeded
                  resource layout, and a scale-to-fit overview rendered in Pixi.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-left font-mono text-xs text-slate-300 md:text-right">
              <div>world: 50 x 50 tiles @ 32px logic size</div>
              <div>spawn: 3 markers, 12 trees, 20 meal</div>
              <div>view: auto-fit overview, camera later</div>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Phase 2 scope
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  <li>`World` owns `MapGrid`, spawn points, and summary data.</li>
                  <li>`MapRenderer` draws terrain, objects, and spawn markers.</li>
                  <li>Input, camera control, and pawns stay out of scope.</li>
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Validation targets
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  <li>Initial world generation is deterministic from a fixed seed.</li>
                  <li>Blocking vs non-blocking objects follow the MVP spec.</li>
                  <li>The whole map stays visible as the canvas resizes.</li>
                </ul>
              </div>
            </div>
          </aside>

          <div className="min-h-[540px] overflow-hidden rounded-[32px] border border-cyan-300/20 bg-slate-950/55 shadow-2xl shadow-cyan-950/30">
            <PixiGameErrorBoundary className="h-full min-h-[540px] w-full">
              <PixiGameView className="h-full min-h-[540px] w-full" />
            </PixiGameErrorBoundary>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
