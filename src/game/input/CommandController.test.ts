import { describe, expect, it } from "vitest"

import { MapGrid } from "../world/MapGrid"
import type { MapObject } from "../world/types"

import { CommandController } from "./CommandController"

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

describe("CommandController", () => {
  it("does not emit intents in inspect mode", () => {
    const controller = new CommandController("inspect")
    const map = new MapGrid(8, 8)

    expect(controller.tryCreateIntent(map, { x: 2, y: 2 })).toBeNull()
  })

  it("emits chop intents only for trees", () => {
    const controller = new CommandController("chop")
    const map = new MapGrid(8, 8)

    map.setObjectAt(createObject("tree", 1, 1))
    map.setObjectAt(createObject("wall", 2, 2))

    expect(controller.tryCreateIntent(map, { x: 1, y: 1 })).toEqual({
      type: "chopTree",
      tile: { x: 1, y: 1 },
      targetId: "tree-1-1",
    })
    expect(controller.tryCreateIntent(map, { x: 2, y: 2 })).toBeNull()
  })

  it("emits build intents only on empty buildable tiles", () => {
    const controller = new CommandController("build-wall")
    const map = new MapGrid(8, 8)

    map.setObjectAt(createObject("tree", 3, 3))

    expect(controller.tryCreateIntent(map, { x: 1, y: 1 })).toEqual({
      type: "placeBlueprint",
      recipeType: "wall",
      tile: { x: 1, y: 1 },
    })
    expect(controller.tryCreateIntent(map, { x: 3, y: 3 })).toBeNull()
  })

  it("emits cancel intents only for blueprints", () => {
    const controller = new CommandController("cancel-blueprint")
    const map = new MapGrid(8, 8)

    map.setObjectAt(createObject("blueprint", 4, 4))
    map.setObjectAt(createObject("bed", 5, 5))

    expect(controller.tryCreateIntent(map, { x: 4, y: 4 })).toEqual({
      type: "cancelBlueprint",
      tile: { x: 4, y: 4 },
      targetId: "blueprint-4-4",
    })
    expect(controller.tryCreateIntent(map, { x: 5, y: 5 })).toBeNull()
  })

  it("preserves recipe type for build-bed mode", () => {
    const controller = new CommandController("build-bed")
    const map = new MapGrid(8, 8)

    expect(controller.tryCreateIntent(map, { x: 6, y: 1 })).toEqual({
      type: "placeBlueprint",
      recipeType: "bed",
      tile: { x: 6, y: 1 },
    })
  })
})
