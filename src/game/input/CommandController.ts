import type { MapGrid } from "../world/MapGrid"
import type { TileCoord } from "../world/types"

import type { PlayerCommandIntent, PlayerCommandMode } from "./types"

export class CommandController {
  private mode: PlayerCommandMode

  constructor(initialMode: PlayerCommandMode = "inspect") {
    this.mode = initialMode
  }

  get currentMode(): PlayerCommandMode {
    return this.mode
  }

  setMode(nextMode: PlayerCommandMode): void {
    this.mode = nextMode
  }

  canIssueAt(map: MapGrid, tile: TileCoord | null): boolean {
    return this.tryCreateIntent(map, tile) !== null
  }

  tryCreateIntent(
    map: MapGrid,
    tile: TileCoord | null
  ): PlayerCommandIntent | null {
    if (!tile || !map.isInBounds(tile.x, tile.y)) {
      return null
    }

    const object = map.getObjectAt(tile.x, tile.y)

    switch (this.mode) {
      case "inspect":
        return null
      case "chop":
        if (object?.kind !== "tree") {
          return null
        }

        return {
          type: "chopTree",
          tile: { ...tile },
          targetId: object.id,
        }
      case "build-wall":
        if (!map.isBuildable(tile.x, tile.y)) {
          return null
        }

        return {
          type: "placeBlueprint",
          recipeType: "wall",
          tile: { ...tile },
        }
      case "build-bed":
        if (!map.isBuildable(tile.x, tile.y)) {
          return null
        }

        return {
          type: "placeBlueprint",
          recipeType: "bed",
          tile: { ...tile },
        }
      case "cancel-blueprint":
        if (object?.kind !== "blueprint") {
          return null
        }

        return {
          type: "cancelBlueprint",
          tile: { ...tile },
          targetId: object.id,
        }
    }
  }
}
