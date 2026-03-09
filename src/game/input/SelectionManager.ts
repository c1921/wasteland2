import type { MapGrid } from "../world/MapGrid"
import type { TileCoord } from "../world/types"

import type { SelectionState } from "./types"

export class SelectionManager {
  private selection: SelectionState | null = null

  get currentSelection(): SelectionState | null {
    return this.selection
  }

  selectTile(map: MapGrid, tile: TileCoord | null): SelectionState | null {
    const nextSelection = createSelectionState(map, tile)

    if (isSameSelection(this.selection, nextSelection)) {
      return this.selection
    }

    this.selection = nextSelection
    return this.selection
  }

  clear(): SelectionState | null {
    if (!this.selection) {
      return this.selection
    }

    this.selection = null
    return this.selection
  }
}

function createSelectionState(
  map: MapGrid,
  tile: TileCoord | null
): SelectionState | null {
  if (!tile || !map.isInBounds(tile.x, tile.y)) {
    return null
  }

  const object = map.getObjectAt(tile.x, tile.y)

  if (!object) {
    return { tile: { ...tile } }
  }

  return {
    tile: { ...tile },
    objectId: object.id,
    objectKind: object.kind,
  }
}

function isSameSelection(
  left: SelectionState | null,
  right: SelectionState | null
): boolean {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  return (
    left.tile.x === right.tile.x &&
    left.tile.y === right.tile.y &&
    left.objectId === right.objectId &&
    left.objectKind === right.objectKind
  )
}
