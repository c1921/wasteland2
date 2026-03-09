import { Container, Graphics, Text, type Application } from "pixi.js"

import { EntityManager } from "./core/EntityManager"
import { JobManager } from "./core/JobManager"
import { TickManager } from "./core/TickManager"
import { World } from "./core/World"
import { GameLoop } from "./GameLoop"
import { CameraController } from "./input/CameraController"
import type { CameraViewport } from "./input/CameraController"
import { CommandController } from "./input/CommandController"
import { InputController } from "./input/InputController"
import { SelectionManager } from "./input/SelectionManager"
import type {
  PlayerCommandIntent,
  PlayerCommandMode,
  SelectionState,
} from "./input/types"
import { MapRenderer } from "./render/MapRenderer"
import { BuildSystem } from "./systems/BuildSystem"
import { NeedSystem } from "./systems/NeedSystem"
import type { GameConfig, GameContext } from "./types"
import {
  WORLD_PIXEL_HEIGHT,
  WORLD_PIXEL_WIDTH,
} from "./world/constants"

const DEFAULT_GAME_CONFIG: Required<GameConfig> = {
  tickRate: 10,
  debugTickLogging: true,
  backgroundColor: 0x08111d,
  maxFrameMs: 250,
}

interface GameOptions {
  app: Application
  config?: GameConfig
  uiBridge?: GameUiBridge
}

interface GameUiBridge {
  initialCommandMode?: PlayerCommandMode
  onCommandIntent?: (intent: PlayerCommandIntent) => void
  onSelectionChange?: (selection: SelectionState | null) => void
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
  readonly mapRenderer = new MapRenderer()
  readonly cameraController = new CameraController({
    worldHeight: WORLD_PIXEL_HEIGHT,
    worldWidth: WORLD_PIXEL_WIDTH,
  })
  readonly selectionManager = new SelectionManager()
  readonly gameLoop: GameLoop

  private readonly sceneFrame = new Graphics()
  private readonly viewportMask = new Graphics()
  private readonly viewportRoot = new Container()
  private readonly statusBackdrop = new Graphics()
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
  private readonly commandController: CommandController
  private readonly inputController: InputController
  private readonly onCommandIntent?: (intent: PlayerCommandIntent) => void
  private readonly onSelectionChange?: (selection: SelectionState | null) => void

  private destroyed = false
  private hoverTile: SelectionState["tile"] | null = null
  private lastDebugText = ""
  private lastRenderAlpha = 0
  private lastSelectionSummary = "none"
  private lastScreenHeight = -1
  private lastScreenWidth = -1

  constructor({ app, config, uiBridge }: GameOptions) {
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
    this.commandController = new CommandController(
      uiBridge?.initialCommandMode ?? "inspect"
    )
    this.onCommandIntent = uiBridge?.onCommandIntent
    this.onSelectionChange = uiBridge?.onSelectionChange

    this.sceneRoot.addChild(this.sceneFrame)
    this.sceneRoot.addChild(this.viewportMask)
    this.viewportRoot.mask = this.viewportMask
    this.viewportRoot.addChild(this.mapRenderer.container)
    this.sceneRoot.addChild(this.viewportRoot)
    this.sceneRoot.addChild(this.statusBackdrop)
    this.sceneRoot.addChild(this.statusText)
    this.app.stage.addChild(this.sceneRoot)
    this.inputController = new InputController({
      cameraController: this.cameraController,
      canvas: this.app.canvas,
      getScreenSize: () => ({
        height: this.app.screen.height,
        width: this.app.screen.width,
      }),
      onHoverTileChange: (tile) => {
        this.hoverTile = tile
      },
      onTileActivate: (tile) => this.handleTileActivation(tile),
    })
    this.sceneRoot.addChild(this.inputController.overlay)

    this.gameLoop = new GameLoop({
      tickRate: this.config.tickRate,
      maxFrameMs: this.config.maxFrameMs,
      onTick: (fixedStepMs) => this.tick(fixedStepMs),
      onRender: (alpha) => this.render(alpha),
    })

    this.syncSceneLayout()
    this.syncMapLayout()
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

    this.inputController.destroy()
    this.sceneRoot.destroy({ children: true })
    this.destroyed = true
  }

  setCommandMode(mode: PlayerCommandMode): void {
    this.commandController.setMode(mode)
    this.updateDebugText()
  }

  resetCamera(): void {
    this.cameraController.resetToFit()
    this.updateDebugText()
  }

  setPanModifierActive(active: boolean): void {
    this.inputController.setPanModifierActive(active)
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
    const didCameraLayoutChange = this.syncMapLayout()
    this.mapRenderer.sync(this.world, {
      hoverIsValid: this.commandController.canIssueAt(this.world.map, this.hoverTile),
      hoverMode: this.commandController.currentMode,
      hoverTile: this.hoverTile,
      selection: this.selectionManager.currentSelection,
    })
    const roundedAlpha = Math.round(alpha * 10) / 10
    const selectionSummary = this.getSelectionSummary()

    if (
      didResize ||
      didCameraLayoutChange ||
      roundedAlpha !== this.lastRenderAlpha ||
      selectionSummary !== this.lastSelectionSummary
    ) {
      this.lastRenderAlpha = roundedAlpha
      this.lastSelectionSummary = selectionSummary
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
    const viewport = this.createViewport(inset, panelWidth, panelHeight)

    this.syncSceneFrame(inset, panelWidth, panelHeight)
    this.viewportMask
      .clear()
      .rect(viewport.x, viewport.y, viewport.width, viewport.height)
      .fill({ color: 0xffffff, alpha: 1 })
    this.viewportMask.alpha = 0

    this.viewportRoot.position.set(viewport.x, viewport.y)
    this.inputController.setViewport(viewport)
    this.cameraController.setViewport(viewport)

    this.statusText.x = inset + 24
    this.statusText.y = inset + 20
    this.statusText.style.wordWrapWidth = Math.min(
      Math.max(panelWidth - 48, 160),
      340
    )

    this.statusBackdrop
      .clear()
      .roundRect(this.statusText.x - 12, this.statusText.y - 10, 308, 174, 18)
      .fill({ color: 0x020617, alpha: 0.72 })
      .stroke({ color: 0x67e8f9, alpha: 0.35, width: 1 })

    return true
  }

  private syncMapLayout(): boolean {
    const transform = this.cameraController.getTransform()

    return this.mapRenderer.setLayout({
      x: transform.worldOffsetX - transform.viewport.x,
      y: transform.worldOffsetY - transform.viewport.y,
      scale: transform.zoom,
    })
  }

  private syncSceneFrame(
    inset: number,
    panelWidth: number,
    panelHeight: number
  ): void {
    this.sceneFrame
      .clear()
      .roundRect(inset, inset, panelWidth, panelHeight, 28)
      .fill({ color: 0x0f172a, alpha: 0.32 })
      .stroke({ color: 0x67e8f9, width: 2, alpha: 0.75 })
  }

  private createViewport(
    inset: number,
    panelWidth: number,
    panelHeight: number
  ): CameraViewport {
    const viewportPadding = 24
    const viewportWidth = Math.max(panelWidth - viewportPadding * 2, 64)
    const viewportHeight = Math.max(panelHeight - viewportPadding * 2, 64)
    return {
      x: inset + viewportPadding,
      y: inset + viewportPadding,
      width: viewportWidth,
      height: viewportHeight,
    }
  }

  private updateDebugText(): void {
    const worldSummary = this.world.getSummary()
    const mealPileCount = worldSummary.objectCounts.itemPile
    const cameraTransform = this.cameraController.getTransform()
    const selectionSummary = this.getSelectionSummary()

    const nextDebugText = [
      "Wasteland camera + input online",
      `seed: ${this.world.seed}`,
      `map: ${this.world.width} x ${this.world.height} tiles`,
      `spawn: ${worldSummary.spawnCount}`,
      `trees: ${worldSummary.objectCounts.tree}`,
      `meal piles: ${mealPileCount}`,
      `meal total: ${worldSummary.itemTotals.meal}`,
      `mode: ${this.commandController.currentMode}`,
      `selection: ${selectionSummary}`,
      `zoom: ${cameraTransform.zoom.toFixed(2)}x`,
      `tick rate: ${this.config.tickRate} TPS`,
      `ticks executed: ${this.tickManager.currentTick}`,
      `sim time: ${(this.tickManager.elapsedMilliseconds / 1000).toFixed(1)}s`,
      `render alpha: ${this.lastRenderAlpha.toFixed(1)}`,
      `canvas: ${this.lastScreenWidth} x ${this.lastScreenHeight}`,
      `world px: ${WORLD_PIXEL_WIDTH} x ${WORLD_PIXEL_HEIGHT}`,
    ].join("\n")

    if (nextDebugText === this.lastDebugText) {
      return
    }

    this.lastDebugText = nextDebugText
    this.statusText.text = nextDebugText
  }

  private handleTileActivation(tile: SelectionState["tile"] | null): void {
    const selection = this.selectionManager.selectTile(this.world.map, tile)

    this.onSelectionChange?.(selection)

    const intent = this.commandController.tryCreateIntent(this.world.map, tile)

    if (intent) {
      this.onCommandIntent?.(intent)
    }

    this.updateDebugText()
  }

  private getSelectionSummary(): string {
    const selection = this.selectionManager.currentSelection

    if (!selection) {
      return "none"
    }

    const objectLabel = selection.objectKind ? ` ${selection.objectKind}` : " empty"

    return `${selection.tile.x},${selection.tile.y}${objectLabel}`
  }
}
