import { Container, Graphics, Text, type Application } from "pixi.js"

import { EntityManager } from "./core/EntityManager"
import { JobManager } from "./core/JobManager"
import { TickManager } from "./core/TickManager"
import { World } from "./core/World"
import { GameLoop } from "./GameLoop"
import { BuildSystem } from "./systems/BuildSystem"
import { NeedSystem } from "./systems/NeedSystem"
import type { GameConfig, GameContext } from "./types"

const DEFAULT_GAME_CONFIG: Required<GameConfig> = {
  tickRate: 10,
  debugTickLogging: true,
  backgroundColor: 0x08111d,
  maxFrameMs: 250,
}

interface GameOptions {
  app: Application
  config?: GameConfig
}

export class Game {
  readonly app: Application
  readonly config: Required<GameConfig>
  readonly world = new World()
  readonly entityManager = new EntityManager()
  readonly jobManager = new JobManager()
  readonly needSystem = new NeedSystem()
  readonly buildSystem = new BuildSystem()
  readonly tickManager = new TickManager()
  readonly sceneRoot = new Container()
  readonly gameLoop: GameLoop

  private readonly sceneFrame = new Graphics()
  private readonly statusText = new Text({
    text: "",
    style: {
      fill: 0xe2e8f0,
      fontFamily: "'Courier New', monospace",
      fontSize: 15,
      lineHeight: 22,
      wordWrap: true,
    },
  })
  private readonly context: GameContext

  private destroyed = false
  private lastDebugText = ""
  private lastRenderAlpha = 0
  private lastScreenHeight = -1
  private lastScreenWidth = -1

  constructor({ app, config }: GameOptions) {
    this.app = app
    this.config = { ...DEFAULT_GAME_CONFIG, ...config }
    this.context = {
      world: this.world,
      entityManager: this.entityManager,
      jobManager: this.jobManager,
      needSystem: this.needSystem,
      buildSystem: this.buildSystem,
      tickManager: this.tickManager,
    }

    this.sceneRoot.addChild(this.sceneFrame)
    this.sceneRoot.addChild(this.statusText)
    this.app.stage.addChild(this.sceneRoot)

    this.gameLoop = new GameLoop({
      tickRate: this.config.tickRate,
      maxFrameMs: this.config.maxFrameMs,
      onTick: (fixedStepMs) => this.tick(fixedStepMs),
      onRender: (alpha) => this.render(alpha),
    })

    this.syncSceneLayout()
    this.updateDebugText()
  }

  start(): void {
    if (this.destroyed) {
      return
    }

    this.gameLoop.start()
  }

  stop(): void {
    this.gameLoop.stop()
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }

    this.stop()

    if (this.sceneRoot.parent) {
      this.sceneRoot.parent.removeChild(this.sceneRoot)
    }

    this.sceneRoot.destroy({ children: true })
    this.destroyed = true
  }

  tick(fixedStepMs: number): void {
    const tickSnapshot = this.tickManager.beginTick(fixedStepMs)

    this.world.setSimulationState(tickSnapshot.tickCount, tickSnapshot.elapsedMs)
    this.needSystem.tick(this.context, fixedStepMs)
    this.jobManager.tick(this.context, fixedStepMs)
    this.buildSystem.tick(this.context, fixedStepMs)
    this.entityManager.flush()
    this.updateDebugText()

    if (this.config.debugTickLogging) {
      console.info(
        `[Game] tick=${tickSnapshot.tickCount} step=${fixedStepMs.toFixed(0)}ms`
      )
    }
  }

  render(alpha: number): void {
    if (this.destroyed) {
      return
    }

    const didResize = this.syncSceneLayout()
    const roundedAlpha = Math.round(alpha * 10) / 10

    if (didResize || roundedAlpha !== this.lastRenderAlpha) {
      this.lastRenderAlpha = roundedAlpha
      this.updateDebugText()
    }

    this.app.render()
  }

  private syncSceneLayout(): boolean {
    const width = Math.round(this.app.screen.width)
    const height = Math.round(this.app.screen.height)

    if (width === this.lastScreenWidth && height === this.lastScreenHeight) {
      return false
    }

    this.lastScreenWidth = width
    this.lastScreenHeight = height

    const inset = Math.max(18, Math.floor(Math.min(width, height) * 0.045))
    const panelWidth = Math.max(width - inset * 2, 180)
    const panelHeight = Math.max(height - inset * 2, 180)

    this.sceneFrame
      .clear()
      .roundRect(inset, inset, panelWidth, panelHeight, 28)
      .fill({ color: 0x0f172a, alpha: 0.32 })
      .stroke({ color: 0x67e8f9, width: 2, alpha: 0.75 })

    this.statusText.x = inset + 24
    this.statusText.y = inset + 20
    this.statusText.style.wordWrapWidth = Math.max(panelWidth - 48, 160)

    return true
  }

  private updateDebugText(): void {
    const nextDebugText = [
      "Wasteland runtime online",
      `tick rate: ${this.config.tickRate} TPS`,
      `ticks executed: ${this.tickManager.currentTick}`,
      `sim time: ${(this.tickManager.elapsedMilliseconds / 1000).toFixed(1)}s`,
      `render alpha: ${this.lastRenderAlpha.toFixed(1)}`,
      `canvas: ${this.lastScreenWidth} x ${this.lastScreenHeight}`,
    ].join("\n")

    if (nextDebugText === this.lastDebugText) {
      return
    }

    this.lastDebugText = nextDebugText
    this.statusText.text = nextDebugText
  }
}
