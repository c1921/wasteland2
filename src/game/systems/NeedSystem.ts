import type { GameContext, TickableSystem } from "../types"

export class NeedSystem implements TickableSystem {
  tick(context: GameContext, fixedStepMs: number): void {
    void context
    void fixedStepMs
  }
}
