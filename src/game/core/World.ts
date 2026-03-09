import {
  DEFAULT_WORLD_SEED,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "../world/constants"
import { createDefaultWorld } from "../world/createDefaultWorld"
import type {
  ItemType,
  ItemTotals,
  MapObjectCounts,
  TileCoord,
  WorldSummary,
} from "../world/types"
import type { MapGrid } from "../world/MapGrid"

interface WorldOptions {
  seed?: number
}

const EMPTY_OBJECT_COUNTS: MapObjectCounts = {
  tree: 0,
  wall: 0,
  bed: 0,
  blueprint: 0,
  itemPile: 0,
}

const EMPTY_ITEM_TOTALS: ItemTotals = {
  wood: 0,
  meal: 0,
}

export class World {
  tickCount = 0
  elapsedMs = 0
  readonly map: MapGrid
  readonly seed: number
  readonly spawnPoints: TileCoord[]

  private cachedSummaryRevision = -1
  private cachedSummary: WorldSummary = {
    objectCounts: { ...EMPTY_OBJECT_COUNTS },
    itemTotals: { ...EMPTY_ITEM_TOTALS },
    spawnCount: 0,
  }

  constructor(options: WorldOptions = {}) {
    const layout = createDefaultWorld({
      seed: options.seed ?? DEFAULT_WORLD_SEED,
    })

    this.map = layout.map
    this.seed = layout.seed
    this.spawnPoints = layout.spawnPoints
  }

  get width(): number {
    return MAP_WIDTH
  }

  get height(): number {
    return MAP_HEIGHT
  }

  get revision(): number {
    return this.map.revision
  }

  setSimulationState(tickCount: number, elapsedMs: number): void {
    this.tickCount = tickCount
    this.elapsedMs = elapsedMs
  }

  getSummary(): WorldSummary {
    if (this.cachedSummaryRevision === this.revision) {
      return this.cachedSummary
    }

    const objectCounts: MapObjectCounts = { ...EMPTY_OBJECT_COUNTS }
    const itemTotals: ItemTotals = { ...EMPTY_ITEM_TOTALS }

    this.map.forEachObject((object) => {
      objectCounts[object.kind] += 1

      if (object.kind === "itemPile") {
        itemTotals[object.itemType] += object.quantity
      }
    })

    this.cachedSummaryRevision = this.revision
    this.cachedSummary = {
      objectCounts,
      itemTotals,
      spawnCount: this.spawnPoints.length,
    }

    return this.cachedSummary
  }

  getTotalItems(itemType: ItemType): number {
    return this.getSummary().itemTotals[itemType]
  }
}
