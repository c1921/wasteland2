import { Container, Graphics } from "pixi.js"

import { TILE_SIZE, WORLD_PIXEL_HEIGHT, WORLD_PIXEL_WIDTH } from "../world/constants"
import type { MapObject, TileCoord } from "../world/types"
import type { World } from "../core/World"

interface MapLayout {
  x: number
  y: number
  scale: number
}

export class MapRenderer {
  readonly container = new Container()

  private readonly terrainLayer = new Graphics()
  private readonly gridLayer = new Graphics()
  private readonly objectLayer = new Graphics()
  private readonly spawnLayer = new Graphics()
  private lastLayout: MapLayout = { x: 0, y: 0, scale: 1 }
  private lastTerrainKey = ""
  private lastWorldRevision = -1

  constructor() {
    this.container.addChild(this.terrainLayer)
    this.container.addChild(this.gridLayer)
    this.container.addChild(this.objectLayer)
    this.container.addChild(this.spawnLayer)
  }

  sync(world: World): void {
    const terrainKey = `${world.width}x${world.height}`

    if (terrainKey !== this.lastTerrainKey) {
      this.lastTerrainKey = terrainKey
      this.drawTerrain(world)
    }

    if (this.lastWorldRevision !== world.revision) {
      this.lastWorldRevision = world.revision
      this.drawObjects(world)
      this.drawSpawnPoints(world.spawnPoints)
    }
  }

  setLayout(layout: MapLayout): void {
    if (
      this.lastLayout.x === layout.x &&
      this.lastLayout.y === layout.y &&
      this.lastLayout.scale === layout.scale
    ) {
      return
    }

    this.lastLayout = layout
    this.container.position.set(layout.x, layout.y)
    this.container.scale.set(layout.scale)
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }

  private drawTerrain(world: World): void {
    this.terrainLayer
      .clear()
      .rect(0, 0, WORLD_PIXEL_WIDTH, WORLD_PIXEL_HEIGHT)
      .fill({ color: 0x243225 })

    this.gridLayer.clear()

    for (let column = 0; column <= world.width; column += 1) {
      const x = column * TILE_SIZE

      this.gridLayer.moveTo(x, 0)
      this.gridLayer.lineTo(x, WORLD_PIXEL_HEIGHT)
    }

    for (let row = 0; row <= world.height; row += 1) {
      const y = row * TILE_SIZE

      this.gridLayer.moveTo(0, y)
      this.gridLayer.lineTo(WORLD_PIXEL_WIDTH, y)
    }

    this.gridLayer.stroke({ color: 0x111827, alpha: 0.55, width: 1 })
  }

  private drawObjects(world: World): void {
    this.objectLayer.clear()

    world.map.forEachObject((object) => {
      switch (object.kind) {
        case "tree":
          this.drawTree(object)
          break
        case "wall":
          this.drawWall(object)
          break
        case "bed":
          this.drawBed(object)
          break
        case "blueprint":
          this.drawBlueprint(object)
          break
        case "itemPile":
          this.drawItemPile(object)
          break
      }
    })
  }

  private drawSpawnPoints(spawnPoints: TileCoord[]): void {
    this.spawnLayer.clear()

    spawnPoints.forEach((spawnPoint) => {
      const originX = spawnPoint.x * TILE_SIZE
      const originY = spawnPoint.y * TILE_SIZE
      const centerX = originX + TILE_SIZE / 2
      const centerY = originY + TILE_SIZE / 2

      this.spawnLayer.circle(centerX, centerY, 8)
      this.spawnLayer.moveTo(centerX - 10, centerY)
      this.spawnLayer.lineTo(centerX + 10, centerY)
      this.spawnLayer.moveTo(centerX, centerY - 10)
      this.spawnLayer.lineTo(centerX, centerY + 10)
    })

    this.spawnLayer.stroke({ color: 0x67e8f9, width: 2, alpha: 0.95 })
  }

  private drawTree(tree: Extract<MapObject, { kind: "tree" }>): void {
    const originX = tree.x * TILE_SIZE
    const originY = tree.y * TILE_SIZE
    const centerX = originX + TILE_SIZE / 2
    const canopyY = originY + 12

    this.objectLayer
      .roundRect(originX + 12, originY + 15, 8, 13, 3)
      .fill({ color: 0x6b4423 })
      .circle(centerX, canopyY, 10)
      .fill({ color: 0x3f7a32 })
      .circle(centerX - 7, canopyY + 3, 8)
      .fill({ color: 0x4f9a3f })
      .circle(centerX + 8, canopyY + 4, 8)
      .fill({ color: 0x2f5f26 })
  }

  private drawWall(wall: Extract<MapObject, { kind: "wall" }>): void {
    const originX = wall.x * TILE_SIZE
    const originY = wall.y * TILE_SIZE

    this.objectLayer
      .roundRect(originX + 3, originY + 6, 26, 20, 4)
      .fill({ color: 0x94a3b8 })
      .stroke({ color: 0xe2e8f0, width: 2, alpha: 0.55 })
  }

  private drawBed(bed: Extract<MapObject, { kind: "bed" }>): void {
    const originX = bed.x * TILE_SIZE
    const originY = bed.y * TILE_SIZE

    this.objectLayer
      .roundRect(originX + 5, originY + 8, 22, 16, 6)
      .fill({ color: 0x7c4d2b })
      .roundRect(originX + 7, originY + 10, 18, 12, 5)
      .fill({ color: 0x2563eb })
      .roundRect(originX + 7, originY + 10, 8, 5, 3)
      .fill({ color: 0xf8fafc })
  }

  private drawBlueprint(
    blueprint: Extract<MapObject, { kind: "blueprint" }>
  ): void {
    const originX = blueprint.x * TILE_SIZE
    const originY = blueprint.y * TILE_SIZE

    this.objectLayer
      .roundRect(originX + 4, originY + 4, 24, 24, 5)
      .fill({ color: 0x38bdf8, alpha: 0.12 })
      .stroke({ color: 0x38bdf8, width: 2, alpha: 0.9 })

    this.objectLayer.moveTo(originX + 7, originY + 25)
    this.objectLayer.lineTo(originX + 25, originY + 7)
    this.objectLayer.moveTo(originX + 7, originY + 17)
    this.objectLayer.lineTo(originX + 17, originY + 7)
    this.objectLayer.moveTo(originX + 15, originY + 25)
    this.objectLayer.lineTo(originX + 25, originY + 15)
    this.objectLayer.stroke({ color: 0x7dd3fc, width: 1, alpha: 0.75 })
  }

  private drawItemPile(itemPile: Extract<MapObject, { kind: "itemPile" }>): void {
    const originX = itemPile.x * TILE_SIZE
    const originY = itemPile.y * TILE_SIZE
    const itemColor = itemPile.itemType === "wood" ? 0xb97836 : 0xf59e0b
    const shadowColor = itemPile.itemType === "wood" ? 0x7c4a18 : 0xb45309

    this.objectLayer
      .circle(originX + 11, originY + 20, 5)
      .fill({ color: shadowColor, alpha: 0.95 })
      .circle(originX + 18, originY + 14, 5)
      .fill({ color: itemColor, alpha: 0.95 })
      .circle(originX + 22, originY + 22, 5)
      .fill({ color: shadowColor, alpha: 0.95 })
      .circle(originX + 15, originY + 23, 5)
      .fill({ color: itemColor, alpha: 0.95 })
  }
}
