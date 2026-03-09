export interface TickSnapshot {
  tickCount: number
  elapsedMs: number
}

export class TickManager {
  private tickCount = 0
  private elapsedMs = 0

  beginTick(fixedStepMs: number): TickSnapshot {
    this.tickCount += 1
    this.elapsedMs += fixedStepMs

    return {
      tickCount: this.tickCount,
      elapsedMs: this.elapsedMs,
    }
  }

  get currentTick(): number {
    return this.tickCount
  }

  get elapsedMilliseconds(): number {
    return this.elapsedMs
  }
}
