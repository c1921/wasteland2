import type { MapObjectKind, StructureType, TileCoord } from "../world/types"

export type PlayerCommandMode =
  | "inspect"
  | "chop"
  | "build-wall"
  | "build-bed"
  | "cancel-blueprint"

export interface SelectionState {
  tile: TileCoord
  objectId?: string
  objectKind?: MapObjectKind
}

export interface ChopTreeIntent {
  type: "chopTree"
  tile: TileCoord
  targetId: string
}

export interface PlaceBlueprintIntent {
  type: "placeBlueprint"
  tile: TileCoord
  recipeType: StructureType
}

export interface CancelBlueprintIntent {
  type: "cancelBlueprint"
  tile: TileCoord
  targetId: string
}

export type PlayerCommandIntent =
  | ChopTreeIntent
  | PlaceBlueprintIntent
  | CancelBlueprintIntent

export interface PixiGameViewHandle {
  resetCamera: () => void
}

export interface MapOverlayState {
  selection: SelectionState | null
  hoverTile: TileCoord | null
  hoverMode: PlayerCommandMode
  hoverIsValid: boolean
}
