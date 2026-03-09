import type { Cell, MapObject, TileCoord } from "./types"

const EMPTY_CELL: Cell = {
  terrain: "ground",
  object: null,
}

const BLOCKING_OBJECT_KINDS = new Set(["tree", "wall"])

export class MapGrid {
  readonly width: number
  readonly height: number

  private readonly cells: Cell[]
  private currentRevision = 0

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error("MapGrid width and height must be greater than 0.")
    }

    this.width = width
    this.height = height
    this.cells = Array.from({ length: width * height }, () => ({ ...EMPTY_CELL }))
  }

  get revision(): number {
    return this.currentRevision
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height
  }

  getCell(x: number, y: number): Cell | null {
    if (!this.isInBounds(x, y)) {
      return null
    }

    return this.cells[this.getIndex(x, y)]
  }

  getObjectAt(x: number, y: number): MapObject | null {
    return this.getCell(x, y)?.object ?? null
  }

  setObjectAt(object: MapObject): void {
    this.assertInBounds(object.x, object.y)

    const cell = this.cells[this.getIndex(object.x, object.y)]

    if (cell.object) {
      throw new Error(
        `Cannot place ${object.kind} at (${object.x}, ${object.y}) because the cell is occupied.`
      )
    }

    cell.object = object
    this.currentRevision += 1
  }

  clearObjectAt(x: number, y: number): MapObject | null {
    this.assertInBounds(x, y)

    const cell = this.cells[this.getIndex(x, y)]
    const removedObject = cell.object

    if (!removedObject) {
      return null
    }

    cell.object = null
    this.currentRevision += 1

    return removedObject
  }

  isWalkable(x: number, y: number): boolean {
    const object = this.getObjectAt(x, y)

    if (!this.isInBounds(x, y)) {
      return false
    }

    return !object || !BLOCKING_OBJECT_KINDS.has(object.kind)
  }

  isBuildable(x: number, y: number): boolean {
    const cell = this.getCell(x, y)

    return cell?.terrain === "ground" && cell.object === null
  }

  getNeighbors4(x: number, y: number): TileCoord[] {
    const deltas = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ]

    return deltas
      .map((delta) => ({ x: x + delta.x, y: y + delta.y }))
      .filter((coord) => this.isInBounds(coord.x, coord.y))
  }

  forEachCell(callback: (cell: Cell, coord: TileCoord) => void): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        callback(this.cells[this.getIndex(x, y)], { x, y })
      }
    }
  }

  forEachObject(callback: (object: MapObject) => void): void {
    this.forEachCell((cell) => {
      if (cell.object) {
        callback(cell.object)
      }
    })
  }

  private getIndex(x: number, y: number): number {
    return y * this.width + x
  }

  private assertInBounds(x: number, y: number): void {
    if (!this.isInBounds(x, y)) {
      throw new Error(`Cell (${x}, ${y}) is out of bounds.`)
    }
  }
}
