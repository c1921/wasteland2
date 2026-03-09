import { describe, expect, it, vi } from "vitest"

vi.mock("pixi.js", () => {
  class MockPoint {
    x: number
    y: number

    constructor(x = 0, y = x) {
      this.x = x
      this.y = y
    }

    set(x: number, y = x): void {
      this.x = x
      this.y = y
    }
  }

  class MockContainer {
    children: MockContainer[] = []
    parent: MockContainer | null = null
    alpha = 1
    cursor = ""
    eventMode = "none"
    hitArea: unknown = null
    mask: unknown = null
    position = new MockPoint()
    scale = new MockPoint(1, 1)

    addChild<T extends MockContainer>(child: T): T {
      this.children.push(child)
      child.parent = this
      return child
    }

    removeChild<T extends MockContainer>(child: T): T {
      this.children = this.children.filter((candidate) => candidate !== child)
      child.parent = null
      return child
    }

    destroy(): void {
      this.children = []
      this.parent = null
    }

    on(): this {
      return this
    }

    removeAllListeners(): this {
      return this
    }
  }

  class MockGraphics extends MockContainer {
    clear(): this {
      return this
    }

    rect(): this {
      return this
    }

    fill(): this {
      return this
    }

    roundRect(): this {
      return this
    }

    stroke(): this {
      return this
    }

    moveTo(): this {
      return this
    }

    lineTo(): this {
      return this
    }

    circle(): this {
      return this
    }
  }

  class MockText extends MockContainer {
    text: string
    style: Record<string, unknown>

    constructor(options: { style: Record<string, unknown>; text: string }) {
      super()
      this.text = options.text
      this.style = { ...options.style }
    }
  }

  class MockRectangle {
    constructor(
      readonly x: number,
      readonly y: number,
      readonly width: number,
      readonly height: number
    ) {}
  }

  return {
    Container: MockContainer,
    Graphics: MockGraphics,
    Rectangle: MockRectangle,
    Text: MockText,
  }
})

import { Container, type Application } from "pixi.js"
import { Game } from "./Game"

function createApplicationStub(
  width = 960,
  height = 640
): Application {
  return {
    canvas: {
      addEventListener: vi.fn(),
      getBoundingClientRect: () => ({
        bottom: height,
        height,
        left: 0,
        right: width,
        top: 0,
        width,
        x: 0,
        y: 0,
      }),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement,
    render: vi.fn(),
    screen: { height, width },
    stage: new Container(),
  } as unknown as Application
}

function getViewportCenter(game: Game): { x: number; y: number } {
  const { viewport } = game.cameraController.getTransform()

  return {
    x: viewport.x + viewport.width / 2,
    y: viewport.y + viewport.height / 2,
  }
}

describe("Game camera render sync", () => {
  it("updates the map scale when zoom changes without a resize", () => {
    const app = createApplicationStub()
    const game = new Game({
      app,
      config: { debugTickLogging: false },
    })
    const initialScale = game.mapRenderer.container.scale.x

    expect(game.cameraController.zoomAtScreenPoint(2, getViewportCenter(game))).toBe(
      true
    )

    game.render(0)

    expect(game.mapRenderer.container.scale.x).not.toBe(initialScale)
    expect(game.mapRenderer.container.scale.x).toBe(
      game.cameraController.getTransform().zoom
    )

    game.destroy()
  })

  it("updates the map position when panning changes without a resize", () => {
    const app = createApplicationStub()
    const game = new Game({
      app,
      config: { debugTickLogging: false },
    })

    game.cameraController.zoomAtScreenPoint(2, getViewportCenter(game))
    game.render(0)

    const initialPosition = {
      x: game.mapRenderer.container.position.x,
      y: game.mapRenderer.container.position.y,
    }

    expect(game.cameraController.panByScreenDelta(96, 64)).toBe(true)

    game.render(0)

    expect({
      x: game.mapRenderer.container.position.x,
      y: game.mapRenderer.container.position.y,
    }).not.toEqual(initialPosition)

    game.destroy()
  })
})
