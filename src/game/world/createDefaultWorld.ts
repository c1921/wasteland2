import {
  DEFAULT_WORLD_SEED,
  INITIAL_MEAL_PILE_COUNT,
  INITIAL_MEAL_PILE_SIZE,
  INITIAL_TREE_COUNT,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "./constants"
import { MapGrid } from "./MapGrid"
import type { ItemPileObject, TileCoord, TreeObject } from "./types"

interface CreateDefaultWorldOptions {
  seed?: number
}

export interface DefaultWorldLayout {
  map: MapGrid
  seed: number
  spawnPoints: TileCoord[]
}

export function createDefaultWorld(
  options: CreateDefaultWorldOptions = {}
): DefaultWorldLayout {
  const seed = options.seed ?? DEFAULT_WORLD_SEED
  const random = createSeededRandom(seed)
  const map = new MapGrid(MAP_WIDTH, MAP_HEIGHT)
  const spawnPoints = createSpawnPoints()
  const occupied = new Set(spawnPoints.map(toCoordKey))
  let nextObjectId = 0

  const mealCoords = pickCoordinates(
    collectCoordinates((coord) => {
      const dx = Math.abs(coord.x - spawnPoints[0].x)
      const dy = Math.abs(coord.y - spawnPoints[0].y)
      const manhattanDistance = dx + dy

      return manhattanDistance >= 3 && manhattanDistance <= 6
    }),
    INITIAL_MEAL_PILE_COUNT,
    occupied,
    random
  )

  mealCoords.forEach((coord) => {
    const mealPile: ItemPileObject = {
      id: `item-pile-${nextObjectId}`,
      kind: "itemPile",
      itemType: "meal",
      quantity: INITIAL_MEAL_PILE_SIZE,
      ...coord,
    }

    nextObjectId += 1
    map.setObjectAt(mealPile)
    occupied.add(toCoordKey(coord))
  })

  const treeCoords = pickCoordinates(
    collectCoordinates((coord) => {
      const dx = Math.abs(coord.x - spawnPoints[0].x)
      const dy = Math.abs(coord.y - spawnPoints[0].y)
      const chebyshevDistance = Math.max(dx, dy)
      const manhattanDistance = dx + dy

      return chebyshevDistance >= 8 && chebyshevDistance <= 18 && manhattanDistance >= 12
    }),
    INITIAL_TREE_COUNT,
    occupied,
    random
  )

  treeCoords.forEach((coord) => {
    const tree: TreeObject = {
      id: `tree-${nextObjectId}`,
      kind: "tree",
      ...coord,
    }

    nextObjectId += 1
    map.setObjectAt(tree)
    occupied.add(toCoordKey(coord))
  })

  return {
    map,
    seed,
    spawnPoints,
  }
}

function createSpawnPoints(): TileCoord[] {
  const originX = Math.floor(MAP_WIDTH / 2) - 1
  const originY = Math.floor(MAP_HEIGHT / 2) - 1

  return [
    { x: originX, y: originY },
    { x: originX + 1, y: originY },
    { x: originX, y: originY + 1 },
  ]
}

function collectCoordinates(
  predicate: (coord: TileCoord) => boolean
): TileCoord[] {
  const coordinates: TileCoord[] = []

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const coord = { x, y }

      if (predicate(coord)) {
        coordinates.push(coord)
      }
    }
  }

  return coordinates
}

function pickCoordinates(
  coordinates: TileCoord[],
  count: number,
  occupied: Set<string>,
  random: () => number
): TileCoord[] {
  const availableCoordinates = coordinates.filter(
    (coord) => !occupied.has(toCoordKey(coord))
  )

  shuffleInPlace(availableCoordinates, random)

  if (availableCoordinates.length < count) {
    throw new Error("Not enough coordinates available to generate the default world.")
  }

  return availableCoordinates.slice(0, count)
}

function shuffleInPlace<T>(values: T[], random: () => number): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentValue = values[index]

    values[index] = values[swapIndex]
    values[swapIndex] = currentValue
  }
}

function toCoordKey(coord: TileCoord): string {
  return `${coord.x},${coord.y}`
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5

    let next = state
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}
