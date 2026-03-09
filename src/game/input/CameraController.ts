import type { TileCoord } from "../world/types"

export interface CameraViewport {
  x: number
  y: number
  width: number
  height: number
}

export interface ScreenPoint {
  x: number
  y: number
}

export interface WorldPoint {
  x: number
  y: number
}

export interface CameraTransform {
  centerX: number
  centerY: number
  maxZoom: number
  minZoom: number
  viewport: CameraViewport
  worldOffsetX: number
  worldOffsetY: number
  zoom: number
}

interface CameraControllerOptions {
  worldHeight: number
  worldWidth: number
}

const DEFAULT_VIEWPORT: CameraViewport = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
}

export class CameraController {
  private centerX: number
  private centerY: number
  private hasViewport = false
  private maxZoom = 1
  private minZoom = 1
  private viewport: CameraViewport = { ...DEFAULT_VIEWPORT }
  private worldHeight: number
  private worldWidth: number
  private zoom = 1

  constructor({ worldWidth, worldHeight }: CameraControllerOptions) {
    this.worldWidth = worldWidth
    this.worldHeight = worldHeight
    this.centerX = worldWidth / 2
    this.centerY = worldHeight / 2
  }

  getTransform(): CameraTransform {
    return {
      centerX: this.centerX,
      centerY: this.centerY,
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      viewport: { ...this.viewport },
      worldOffsetX: this.viewport.x + this.viewport.width / 2 - this.centerX * this.zoom,
      worldOffsetY: this.viewport.y + this.viewport.height / 2 - this.centerY * this.zoom,
      zoom: this.zoom,
    }
  }

  setViewport(viewport: CameraViewport): boolean {
    const normalizedViewport = normalizeViewport(viewport)
    const didChange =
      normalizedViewport.x !== this.viewport.x ||
      normalizedViewport.y !== this.viewport.y ||
      normalizedViewport.width !== this.viewport.width ||
      normalizedViewport.height !== this.viewport.height

    if (!didChange) {
      return false
    }

    const didHaveViewport = this.hasViewport

    this.viewport = normalizedViewport
    this.hasViewport = normalizedViewport.width > 0 && normalizedViewport.height > 0
    this.recalculateZoomBounds()

    if (!didHaveViewport && this.hasViewport) {
      this.resetToFit()
      return true
    }

    this.zoom = clamp(this.zoom, this.minZoom, this.maxZoom)
    this.clampCenterToViewport()

    return true
  }

  resetToFit(): void {
    this.zoom = this.minZoom
    this.centerX = this.worldWidth / 2
    this.centerY = this.worldHeight / 2
    this.clampCenterToViewport()
  }

  panByScreenDelta(deltaX: number, deltaY: number): boolean {
    if (!this.hasViewport || this.zoom <= 0) {
      return false
    }

    const nextCenterX = this.centerX - deltaX / this.zoom
    const nextCenterY = this.centerY - deltaY / this.zoom

    return this.setCenter(nextCenterX, nextCenterY)
  }

  zoomAtScreenPoint(scaleMultiplier: number, screenPoint: ScreenPoint): boolean {
    if (!this.hasViewport || scaleMultiplier <= 0) {
      return false
    }

    const nextZoom = clamp(this.zoom * scaleMultiplier, this.minZoom, this.maxZoom)

    if (nextZoom === this.zoom) {
      return false
    }

    const worldPoint = this.screenToWorld(screenPoint)

    if (!worldPoint) {
      this.zoom = nextZoom
      this.clampCenterToViewport()
      return true
    }

    const localX = screenPoint.x - this.viewport.x
    const localY = screenPoint.y - this.viewport.y
    const nextCenterX =
      worldPoint.x - (localX - this.viewport.width / 2) / nextZoom
    const nextCenterY =
      worldPoint.y - (localY - this.viewport.height / 2) / nextZoom

    this.zoom = nextZoom
    this.setCenter(nextCenterX, nextCenterY)

    return true
  }

  screenToWorld(screenPoint: ScreenPoint): WorldPoint | null {
    if (!this.hasViewport || !this.containsScreenPoint(screenPoint)) {
      return null
    }

    const localX = screenPoint.x - this.viewport.x
    const localY = screenPoint.y - this.viewport.y
    const worldX = this.centerX + (localX - this.viewport.width / 2) / this.zoom
    const worldY = this.centerY + (localY - this.viewport.height / 2) / this.zoom

    if (
      worldX < 0 ||
      worldY < 0 ||
      worldX >= this.worldWidth ||
      worldY >= this.worldHeight
    ) {
      return null
    }

    return {
      x: worldX,
      y: worldY,
    }
  }

  screenToTile(screenPoint: ScreenPoint, tileSize: number): TileCoord | null {
    const worldPoint = this.screenToWorld(screenPoint)

    if (!worldPoint || tileSize <= 0) {
      return null
    }

    return {
      x: Math.floor(worldPoint.x / tileSize),
      y: Math.floor(worldPoint.y / tileSize),
    }
  }

  containsScreenPoint(screenPoint: ScreenPoint): boolean {
    return (
      screenPoint.x >= this.viewport.x &&
      screenPoint.y >= this.viewport.y &&
      screenPoint.x <= this.viewport.x + this.viewport.width &&
      screenPoint.y <= this.viewport.y + this.viewport.height
    )
  }

  private setCenter(nextCenterX: number, nextCenterY: number): boolean {
    const clampedCenter = this.getClampedCenter(nextCenterX, nextCenterY)

    if (clampedCenter.x === this.centerX && clampedCenter.y === this.centerY) {
      return false
    }

    this.centerX = clampedCenter.x
    this.centerY = clampedCenter.y

    return true
  }

  private clampCenterToViewport(): void {
    const clampedCenter = this.getClampedCenter(this.centerX, this.centerY)

    this.centerX = clampedCenter.x
    this.centerY = clampedCenter.y
  }

  private getClampedCenter(nextCenterX: number, nextCenterY: number): WorldPoint {
    if (!this.hasViewport || this.zoom <= 0) {
      return {
        x: this.worldWidth / 2,
        y: this.worldHeight / 2,
      }
    }

    const visibleHalfWidth = this.viewport.width / (2 * this.zoom)
    const visibleHalfHeight = this.viewport.height / (2 * this.zoom)
    const minCenterX = visibleHalfWidth >= this.worldWidth / 2 ? this.worldWidth / 2 : visibleHalfWidth
    const maxCenterX =
      visibleHalfWidth >= this.worldWidth / 2
        ? this.worldWidth / 2
        : this.worldWidth - visibleHalfWidth
    const minCenterY =
      visibleHalfHeight >= this.worldHeight / 2 ? this.worldHeight / 2 : visibleHalfHeight
    const maxCenterY =
      visibleHalfHeight >= this.worldHeight / 2
        ? this.worldHeight / 2
        : this.worldHeight - visibleHalfHeight

    return {
      x: clamp(nextCenterX, minCenterX, maxCenterX),
      y: clamp(nextCenterY, minCenterY, maxCenterY),
    }
  }

  private recalculateZoomBounds(): void {
    if (!this.hasViewport) {
      this.minZoom = 1
      this.maxZoom = 1
      return
    }

    const fitScale = Math.min(
      this.viewport.width / this.worldWidth,
      this.viewport.height / this.worldHeight
    )

    this.minZoom = fitScale
    this.maxZoom = fitScale * 3
  }
}

function normalizeViewport(viewport: CameraViewport): CameraViewport {
  return {
    x: Math.round(viewport.x),
    y: Math.round(viewport.y),
    width: Math.max(0, Math.round(viewport.width)),
    height: Math.max(0, Math.round(viewport.height)),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
