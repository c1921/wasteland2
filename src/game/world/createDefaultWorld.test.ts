import { describe, expect, it } from "vitest"

import {
  DEFAULT_WORLD_SEED,
  INITIAL_MEAL_PILE_COUNT,
  INITIAL_MEAL_TOTAL,
  INITIAL_TREE_COUNT,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "./constants"
import { createDefaultWorld } from "./createDefaultWorld"

describe("createDefaultWorld", () => {
  it("produces the same layout for the same seed", () => {
    const first = createDefaultWorld({ seed: DEFAULT_WORLD_SEED })
    const second = createDefaultWorld({ seed: DEFAULT_WORLD_SEED })
    const firstObjects = serializeObjects(first.map)
    const secondObjects = serializeObjects(second.map)

    expect(first.spawnPoints).toEqual(second.spawnPoints)
    expect(firstObjects).toEqual(secondObjects)
  })

  it("creates the expected default counts and totals", () => {
    const world = createDefaultWorld()
    const objects = serializeObjects(world.map)
    const treeCount = objects.filter((object) => object.kind === "tree").length
    const mealPiles = objects.filter(isItemPile)
    const mealTotal = mealPiles.reduce(
      (total, pile) => total + pile.quantity,
      0
    )

    expect(world.map.width).toBe(MAP_WIDTH)
    expect(world.map.height).toBe(MAP_HEIGHT)
    expect(world.spawnPoints).toHaveLength(3)
    expect(treeCount).toBe(INITIAL_TREE_COUNT)
    expect(mealPiles).toHaveLength(INITIAL_MEAL_PILE_COUNT)
    expect(mealTotal).toBe(INITIAL_MEAL_TOTAL)
  })

  it("keeps every object unique, in bounds, and off the spawn tiles", () => {
    const world = createDefaultWorld()
    const objects = serializeObjects(world.map)
    const occupied = new Set<string>()
    const spawnKeys = new Set(world.spawnPoints.map(toCoordKey))

    objects.forEach((object) => {
      const key = toCoordKey(object)

      expect(world.map.isInBounds(object.x, object.y)).toBe(true)
      expect(occupied.has(key)).toBe(false)
      expect(spawnKeys.has(key)).toBe(false)

      occupied.add(key)
    })

    world.spawnPoints.forEach((spawnPoint) => {
      expect(world.map.getObjectAt(spawnPoint.x, spawnPoint.y)).toBeNull()
      expect(world.map.isWalkable(spawnPoint.x, spawnPoint.y)).toBe(true)
    })
  })

  it("places meals near the center and trees in the outer reachable band", () => {
    const world = createDefaultWorld()
    const center = world.spawnPoints[0]

    serializeObjects(world.map).forEach((object) => {
      const dx = Math.abs(object.x - center.x)
      const dy = Math.abs(object.y - center.y)
      const manhattanDistance = dx + dy
      const chebyshevDistance = Math.max(dx, dy)

      if (object.kind === "itemPile") {
        expect(object.itemType).toBe("meal")
        expect(manhattanDistance).toBeGreaterThanOrEqual(3)
        expect(manhattanDistance).toBeLessThanOrEqual(6)
      }

      if (object.kind === "tree") {
        expect(chebyshevDistance).toBeGreaterThanOrEqual(8)
        expect(chebyshevDistance).toBeLessThanOrEqual(18)
        expect(manhattanDistance).toBeGreaterThanOrEqual(12)
      }
    })
  })
})

function serializeObjects(map: ReturnType<typeof createDefaultWorld>["map"]) {
  const objects: SerializedObject[] = []

  map.forEachObject((object) => {
    if (object.kind === "tree") {
      objects.push({ kind: object.kind, x: object.x, y: object.y })
      return
    }

    if (object.kind === "itemPile") {
      objects.push({
        kind: object.kind,
        itemType: object.itemType,
        quantity: object.quantity,
        x: object.x,
        y: object.y,
      })
    }
  })

  return objects.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind.localeCompare(right.kind)
    }

    if (left.y !== right.y) {
      return left.y - right.y
    }

    return left.x - right.x
  })
}

function isItemPile(object: SerializedObject): object is SerializedItemPile {
  return object.kind === "itemPile"
}

type SerializedObject =
  | { kind: "tree"; x: number; y: number }
  | SerializedItemPile

interface SerializedItemPile {
  kind: "itemPile"
  itemType: "meal" | "wood"
  quantity: number
  x: number
  y: number
}

function toCoordKey(coord: { x: number; y: number }): string {
  return `${coord.x},${coord.y}`
}
