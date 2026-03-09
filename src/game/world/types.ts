export interface TileCoord {
  x: number
  y: number
}

export type TerrainType = "ground"
export type ItemType = "wood" | "meal"
export type StructureType = "wall" | "bed"
export type BlueprintState = "needs_materials" | "ready" | "constructing"

export interface BaseMapObject extends TileCoord {
  id: string
}

export interface TreeObject extends BaseMapObject {
  kind: "tree"
}

export interface WallObject extends BaseMapObject {
  kind: "wall"
}

export interface BedObject extends BaseMapObject {
  kind: "bed"
}

export interface BlueprintObject extends BaseMapObject {
  kind: "blueprint"
  recipeType: StructureType
  requiredWood: number
  deliveredWood: number
  buildProgress: number
  state: BlueprintState
}

export interface ItemPileObject extends BaseMapObject {
  kind: "itemPile"
  itemType: ItemType
  quantity: number
}

export type MapObject =
  | TreeObject
  | WallObject
  | BedObject
  | BlueprintObject
  | ItemPileObject

export type MapObjectKind = MapObject["kind"]

export interface Cell {
  terrain: TerrainType
  object: MapObject | null
}

export interface MapObjectCounts {
  tree: number
  wall: number
  bed: number
  blueprint: number
  itemPile: number
}

export interface ItemTotals {
  wood: number
  meal: number
}

export interface WorldSummary {
  objectCounts: MapObjectCounts
  itemTotals: ItemTotals
  spawnCount: number
}
