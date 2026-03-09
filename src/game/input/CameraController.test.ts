import { describe, expect, it } from "vitest"

import { CameraController } from "./CameraController"

describe("CameraController", () => {
  it("fits the whole world into the viewport on first layout", () => {
    const camera = new CameraController({ worldWidth: 1600, worldHeight: 1600 })

    camera.setViewport({ x: 0, y: 0, width: 800, height: 600 })

    expect(camera.getTransform()).toMatchObject({
      centerX: 800,
      centerY: 800,
      minZoom: 0.375,
      maxZoom: 1.125,
      worldOffsetX: 100,
      worldOffsetY: 0,
      zoom: 0.375,
    })
  })

  it("preserves the world point under the pointer while zooming", () => {
    const camera = new CameraController({ worldWidth: 320, worldHeight: 320 })

    camera.setViewport({ x: 0, y: 0, width: 320, height: 320 })

    const anchor = { x: 64, y: 64 }
    const worldBeforeZoom = camera.screenToWorld(anchor)

    camera.zoomAtScreenPoint(2, anchor)

    expect(camera.screenToWorld(anchor)).toEqual(worldBeforeZoom)
    expect(camera.getTransform().zoom).toBe(2)
  })

  it("clamps panning to the visible world bounds", () => {
    const camera = new CameraController({ worldWidth: 1000, worldHeight: 800 })

    camera.setViewport({ x: 0, y: 0, width: 500, height: 400 })
    camera.zoomAtScreenPoint(3, { x: 250, y: 200 })
    camera.panByScreenDelta(1000, 1000)

    const transform = camera.getTransform()

    expect(transform.centerX).toBeCloseTo(500 / (2 * transform.zoom))
    expect(transform.centerY).toBeCloseTo(400 / (2 * transform.zoom))
  })

  it("recomputes min zoom on resize while keeping the active zoom when valid", () => {
    const camera = new CameraController({ worldWidth: 1200, worldHeight: 800 })

    camera.setViewport({ x: 0, y: 0, width: 600, height: 400 })
    camera.zoomAtScreenPoint(2, { x: 300, y: 200 })
    camera.setViewport({ x: 0, y: 0, width: 900, height: 600 })

    const transform = camera.getTransform()

    expect(transform.minZoom).toBe(0.75)
    expect(transform.zoom).toBe(1)
  })

  it("returns null for screen points that land in fit-to-world padding", () => {
    const camera = new CameraController({ worldWidth: 160, worldHeight: 80 })

    camera.setViewport({ x: 0, y: 0, width: 320, height: 320 })

    expect(camera.screenToTile({ x: 40, y: 20 }, 32)).toBeNull()
    expect(camera.screenToTile({ x: 40, y: 120 }, 32)).toEqual({ x: 0, y: 0 })
  })
})
