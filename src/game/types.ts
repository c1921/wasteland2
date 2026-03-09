import type { EntityManager } from "./core/EntityManager"
import type { JobManager } from "./core/JobManager"
import type { TickManager } from "./core/TickManager"
import type { World } from "./core/World"
import type { BuildSystem } from "./systems/BuildSystem"
import type { NeedSystem } from "./systems/NeedSystem"

export interface GameConfig {
  tickRate?: number
  debugTickLogging?: boolean
  backgroundColor?: number
  maxFrameMs?: number
}

export interface GameContext {
  world: World
  entityManager: EntityManager
  jobManager: JobManager
  needSystem: NeedSystem
  buildSystem: BuildSystem
  tickManager: TickManager
}

export interface TickableSystem {
  tick(context: GameContext, fixedStepMs: number): void
}
