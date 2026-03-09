import { useEffect, useRef, useState } from "react"
import { Application } from "pixi.js"

import { cn } from "@/lib/utils"

import { Game } from "./Game"
import type { GameConfig } from "./types"

interface PixiGameViewProps {
  className?: string
  config?: Partial<GameConfig>
}

interface PartialPixiApplication {
  _cancelResize?: (() => void) | null
  _ticker?: { destroy?: () => void } | null
  queueResize?: EventListener | null
  renderer?: { destroy: (options?: unknown) => void } | null
  stage?: { destroy: (options?: unknown) => void } | null
}

function normalizeError(
  error: unknown,
  fallbackMessage = "Failed to initialize Pixi game view."
): Error {
  return error instanceof Error ? error : new Error(fallbackMessage)
}

function destroyPixiApplication(app: Application, initialized: boolean): void {
  if (initialized) {
    app.destroy({ removeView: true }, true)
    return
  }

  const partialApp = app as Application & PartialPixiApplication

  if (partialApp.queueResize) {
    globalThis.removeEventListener("resize", partialApp.queueResize)
  }

  partialApp._cancelResize?.()
  partialApp._ticker?.destroy?.()
  partialApp.stage?.destroy?.({ children: true })
  partialApp.renderer?.destroy?.({ removeView: true })
}

export function PixiGameView({
  className,
  config,
}: PixiGameViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fatalError, setFatalError] = useState<Error | null>(null)
  const backgroundColor = config?.backgroundColor
  const debugTickLogging = config?.debugTickLogging
  const maxFrameMs = config?.maxFrameMs
  const tickRate = config?.tickRate

  if (fatalError) {
    throw fatalError
  }

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let cancelled = false
    let initialized = false
    let initSettled = false
    let app: Application | null = null
    let game: Game | null = null

    const destroyGame = (): void => {
      if (!game) {
        return
      }

      const currentGame = game

      game = null
      currentGame.stop()
      currentGame.destroy()
    }

    const destroyApp = (): void => {
      if (!app) {
        return
      }

      const currentApp = app

      app = null
      destroyPixiApplication(currentApp, initialized)
      initialized = false
    }

    const initialize = async (): Promise<void> => {
      const nextApp = new Application()

      app = nextApp

      try {
        await nextApp.init({
          resizeTo: container,
          autoDensity: true,
          autoStart: false,
          backgroundColor,
          sharedTicker: false,
        })
        initSettled = true
        initialized = true

        if (cancelled) {
          destroyApp()
          return
        }

        container.replaceChildren()
        nextApp.canvas.style.display = "block"
        container.appendChild(nextApp.canvas)

        const nextGame = new Game({
          app: nextApp,
          config: {
            backgroundColor,
            debugTickLogging,
            maxFrameMs,
            tickRate,
          },
        })

        game = nextGame

        if (cancelled) {
          destroyGame()
          destroyApp()
          return
        }

        nextGame.start()
      } catch (error) {
        initSettled = true
        destroyGame()
        destroyApp()

        if (cancelled) {
          return
        }

        const normalizedError = normalizeError(error)

        console.error("Failed to initialize Pixi game view.", normalizedError)
        setFatalError(normalizedError)
      }
    }

    void initialize()

    return () => {
      cancelled = true
      destroyGame()

      if (initSettled) {
        destroyApp()
      }

      container.replaceChildren()
    }
  }, [backgroundColor, debugTickLogging, maxFrameMs, tickRate])

  return (
    <div
      ref={containerRef}
      className={cn("size-full overflow-hidden rounded-[inherit]", className)}
    />
  )
}
