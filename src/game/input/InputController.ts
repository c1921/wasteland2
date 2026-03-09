import { Graphics, Rectangle } from "pixi.js"
import type { FederatedPointerEvent } from "pixi.js"

import { TILE_SIZE } from "../world/constants"
import type { TileCoord } from "../world/types"

import type { CameraController, CameraViewport, ScreenPoint } from "./CameraController"

interface InputControllerOptions {
  cameraController: CameraController
  canvas: HTMLCanvasElement
  getScreenSize: () => { height: number; width: number }
  onHoverTileChange: (tile: TileCoord | null) => void
  onTileActivate: (tile: TileCoord | null) => void
}

interface ActivePointerSession {
  button: number
  dragMode: "click" | "pan"
  dragged: boolean
  lastScreenPoint: ScreenPoint
  pointerId: number
  startScreenPoint: ScreenPoint
}

const DRAG_THRESHOLD_PX = 4
const WHEEL_ZOOM_SENSITIVITY = 0.0015

export class InputController {
  readonly overlay = new Graphics()

  private activePointerSession: ActivePointerSession | null = null
  private readonly cameraController: CameraController
  private readonly canvas: HTMLCanvasElement
  private hoveredTile: TileCoord | null = null
  private panModifierActive = false
  private readonly onHoverTileChange: (tile: TileCoord | null) => void
  private readonly onTileActivate: (tile: TileCoord | null) => void
  private readonly removeWheelListener: () => void
  private readonly getScreenSize: () => { height: number; width: number }

  constructor({
    cameraController,
    canvas,
    getScreenSize,
    onHoverTileChange,
    onTileActivate,
  }: InputControllerOptions) {
    this.cameraController = cameraController
    this.canvas = canvas
    this.getScreenSize = getScreenSize
    this.onHoverTileChange = onHoverTileChange
    this.onTileActivate = onTileActivate

    this.overlay.eventMode = "static"
    this.overlay.cursor = "crosshair"

    this.overlay.on("pointerdown", this.handlePointerDown, this)
    this.overlay.on("pointermove", this.handlePointerMove, this)
    this.overlay.on("pointerup", this.handlePointerUp, this)
    this.overlay.on("pointerupoutside", this.handlePointerUp, this)
    this.overlay.on("pointerleave", this.handlePointerLeave, this)
    this.overlay.on("globalpointermove", this.handleGlobalPointerMove, this)

    const handleWheel = (event: WheelEvent): void => {
      const screenPoint = this.mapClientToScreenPoint(event.clientX, event.clientY)

      if (!screenPoint || !this.cameraController.containsScreenPoint(screenPoint)) {
        return
      }

      event.preventDefault()

      const zoomFactor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY)
      this.cameraController.zoomAtScreenPoint(zoomFactor, screenPoint)
      this.updateHoveredTileFromScreenPoint(screenPoint)
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false })
    this.removeWheelListener = () => {
      canvas.removeEventListener("wheel", handleWheel)
    }
  }

  setViewport(viewport: CameraViewport): void {
    this.overlay.position.set(viewport.x, viewport.y)
    this.overlay.hitArea = new Rectangle(0, 0, viewport.width, viewport.height)
    this.overlay
      .clear()
      .rect(0, 0, viewport.width, viewport.height)
      .fill({ color: 0xffffff, alpha: 0.001 })
  }

  setPanModifierActive(active: boolean): void {
    this.panModifierActive = active
    this.syncCursor()
  }

  destroy(): void {
    this.overlay.removeAllListeners()
    this.removeWheelListener()
  }

  private handlePointerDown(event: FederatedPointerEvent): void {
    const screenPoint = toScreenPoint(event)

    event.preventDefault()

    if (event.button === 1 || (event.button === 0 && this.panModifierActive)) {
      this.activePointerSession = {
        button: event.button,
        dragMode: "pan",
        dragged: false,
        lastScreenPoint: screenPoint,
        pointerId: event.pointerId,
        startScreenPoint: screenPoint,
      }
      this.syncCursor()
      return
    }

    if (event.button !== 0) {
      return
    }

    this.activePointerSession = {
      button: event.button,
      dragMode: "click",
      dragged: false,
      lastScreenPoint: screenPoint,
      pointerId: event.pointerId,
      startScreenPoint: screenPoint,
    }
  }

  private handlePointerMove(event: FederatedPointerEvent): void {
    if (this.activePointerSession) {
      return
    }

    this.updateHoveredTileFromScreenPoint(toScreenPoint(event))
  }

  private handleGlobalPointerMove(event: FederatedPointerEvent): void {
    const activePointerSession = this.activePointerSession

    if (!activePointerSession || activePointerSession.pointerId !== event.pointerId) {
      return
    }

    const screenPoint = toScreenPoint(event)
    const totalDeltaX = screenPoint.x - activePointerSession.startScreenPoint.x
    const totalDeltaY = screenPoint.y - activePointerSession.startScreenPoint.y
    const dragDistance = Math.hypot(totalDeltaX, totalDeltaY)

    if (
      !activePointerSession.dragged &&
      dragDistance >= DRAG_THRESHOLD_PX
    ) {
      activePointerSession.dragged = true
      this.syncCursor()
    }

    if (activePointerSession.dragMode === "pan" && activePointerSession.dragged) {
      this.cameraController.panByScreenDelta(
        screenPoint.x - activePointerSession.lastScreenPoint.x,
        screenPoint.y - activePointerSession.lastScreenPoint.y
      )
    }

    if (
      activePointerSession.dragMode === "click" &&
      activePointerSession.dragged
    ) {
      this.setHoveredTile(null)
    }

    activePointerSession.lastScreenPoint = screenPoint
  }

  private handlePointerUp(event: FederatedPointerEvent): void {
    const activePointerSession = this.activePointerSession

    if (!activePointerSession || activePointerSession.pointerId !== event.pointerId) {
      return
    }

    const screenPoint = toScreenPoint(event)

    if (
      activePointerSession.dragMode === "click" &&
      !activePointerSession.dragged &&
      activePointerSession.button === 0
    ) {
      this.onTileActivate(this.cameraController.screenToTile(screenPoint, TILE_SIZE))
    }

    this.activePointerSession = null
    this.syncCursor()
    this.updateHoveredTileFromScreenPoint(screenPoint)
  }

  private handlePointerLeave(): void {
    if (this.activePointerSession?.dragMode === "pan") {
      return
    }

    this.setHoveredTile(null)
  }

  private updateHoveredTileFromScreenPoint(screenPoint: ScreenPoint): void {
    this.setHoveredTile(this.cameraController.screenToTile(screenPoint, TILE_SIZE))
  }

  private setHoveredTile(nextTile: TileCoord | null): void {
    if (isSameTile(this.hoveredTile, nextTile)) {
      return
    }

    this.hoveredTile = nextTile ? { ...nextTile } : null
    this.onHoverTileChange(this.hoveredTile)
  }

  private mapClientToScreenPoint(
    clientX: number,
    clientY: number
  ): ScreenPoint | null {
    const rect = this.canvas.getBoundingClientRect()

    if (rect.width <= 0 || rect.height <= 0) {
      return null
    }

    const { width, height } = this.getScreenSize()
    const scaleX = width / rect.width
    const scaleY = height / rect.height

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  private syncCursor(): void {
    if (this.activePointerSession?.dragMode === "pan" && this.activePointerSession.dragged) {
      this.overlay.cursor = "grabbing"
      return
    }

    if (this.panModifierActive) {
      this.overlay.cursor = "grab"
      return
    }

    this.overlay.cursor = "crosshair"
  }
}

function toScreenPoint(event: FederatedPointerEvent): ScreenPoint {
  return {
    x: event.global.x,
    y: event.global.y,
  }
}

function isSameTile(left: TileCoord | null, right: TileCoord | null): boolean {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  return left.x === right.x && left.y === right.y
}
