import { describe, expect, it } from "vitest"

import { MapGrid } from "./MapGrid"
import type { MapObject } from "./types"

function createObject(
  kind: MapObject["kind"],
  x: number,
  y: number
): MapObject {
  switch (kind) {
    case "tree":
      return { id: `${kind}-${x}-${y}`, kind, x, y }
    case "wall":
      return { id: `${kind}-${x}-${y}`, kind, x, y }
    case "bed":
      return { id: `${kind}-${x}-${y}`, kind, x, y }
    case "blueprint":
      return {
        id: `${kind}-${x}-${y}`,
        kind,
        x,
        y,
        recipeType: "wall",
        requiredWood: 2,
        deliveredWood: 0,
        buildProgress: 0,
        state: "needs_materials",
      }
    case "itemPile":
      return {
        id: `${kind}-${x}-${y}`,
        kind,
        x,
        y,
        itemType: "meal",
        quantity: 5,
      }
  }
}

describe("MapGrid", () => {
  it("creates a ground-only map with empty object slots", () => {
    const map = new MapGrid(50, 50)

    expect(map.getCell(0, 0)).toEqual({
      terrain: "ground",
      object: null,
    })
    expect(map.getCell(49, 49)).toEqual({
      terrain: "ground",
      object: null,
    })
  })

  it("rejects out-of-bounds writes and reports out-of-bounds queries as empty", () => {
    const map = new MapGrid(4, 4)

    expect(map.getCell(-1, 0)).toBeNull()
    expect(map.getCell(0, 4)).toBeNull()
    expect(() => map.setObjectAt(createObject("tree", 4, 1))).toThrow(
      /out of bounds/i
    )
  })

  it("prevents placing two objects on the same cell", () => {
    const map = new MapGrid(4, 4)

    map.setObjectAt(createObject("tree", 1, 1))

    expect(() => map.setObjectAt(createObject("wall", 1, 1))).toThrow(
      /occupied/i
    )
  })

  it("applies walkable and buildable rules from the MVP spec", () => {
    const map = new MapGrid(8, 8)

    map.setObjectAt(createObject("tree", 1, 1))
    map.setObjectAt(createObject("wall", 2, 1))
    map.setObjectAt(createObject("bed", 3, 1))
    map.setObjectAt(createObject("blueprint", 4, 1))
    map.setObjectAt(createObject("itemPile", 5, 1))

    expect(map.isWalkable(1, 1)).toBe(false)
    expect(map.isWalkable(2, 1)).toBe(false)
    expect(map.isWalkable(3, 1)).toBe(true)
    expect(map.isWalkable(4, 1)).toBe(true)
    expect(map.isWalkable(5, 1)).toBe(true)

    expect(map.isBuildable(0, 0)).toBe(true)
    expect(map.isBuildable(1, 1)).toBe(false)
    expect(map.isBuildable(2, 1)).toBe(false)
    expect(map.isBuildable(3, 1)).toBe(false)
    expect(map.isBuildable(4, 1)).toBe(false)
    expect(map.isBuildable(5, 1)).toBe(false)
  })
})
