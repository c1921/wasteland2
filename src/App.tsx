import { PixiGameView } from "@/game/PixiGameView"

export function App() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(66,153,225,0.16),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
      <main className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <header className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-cyan-950/25 backdrop-blur md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                Phase 1
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Wasteland Runtime Skeleton
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                  React owns the shell. Pixi owns the canvas. Simulation ticks
                  run on a fixed clock, separate from render.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-left font-mono text-xs text-slate-300 md:text-right">
              <div>simulation: fixed 10 TPS</div>
              <div>render: requestAnimationFrame</div>
              <div>status: check the dev console for tick logs</div>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5 shadow-xl shadow-slate-950/20 backdrop-blur">
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Architecture
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  <li>`Game` composes world, managers, and systems.</li>
                  <li>`GameLoop` accumulates delta and drives fixed ticks.</li>
                  <li>React does not store simulation state.</li>
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Phase 1 checks
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  <li>Pixi canvas mounts inside the page shell.</li>
                  <li>Tick logs advance at a stable cadence.</li>
                  <li>Future systems can plug into `Game.tick()`.</li>
                </ul>
              </div>
            </div>
          </aside>

          <div className="min-h-[540px] overflow-hidden rounded-[32px] border border-cyan-300/20 bg-slate-950/55 shadow-2xl shadow-cyan-950/30">
            <PixiGameView className="h-full min-h-[540px] w-full" />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
