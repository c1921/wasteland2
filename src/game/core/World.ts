export class World {
  tickCount = 0
  elapsedMs = 0

  setSimulationState(tickCount: number, elapsedMs: number): void {
    this.tickCount = tickCount
    this.elapsedMs = elapsedMs
  }
}
