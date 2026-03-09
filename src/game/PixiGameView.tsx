import { useEffect, useRef } from "react"
import { Application } from "pixi.js"

import { cn } from "@/lib/utils"

import { Game } from "./Game"
import type { GameConfig } from "./types"

interface PixiGameViewProps {
  className?: string
  config?: Partial<GameConfig>
}

export function PixiGameView({
  className,
  config,
}: PixiGameViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const backgroundColor = config?.backgroundColor
  const debugTickLogging = config?.debugTickLogging
  const maxFrameMs = config?.maxFrameMs
  const tickRate = config?.tickRate

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let cancelled = false
    let app: Application | null = null
    let game: Game | null = null

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
      } catch (error) {
        nextApp.destroy({ removeView: true })
        app = null
        throw error
      }

      if (cancelled) {
        nextApp.destroy({ removeView: true })
        app = null
        return
      }

      container.replaceChildren()
      nextApp.canvas.style.display = "block"
      container.appendChild(nextApp.canvas)

      game = new Game({
        app: nextApp,
        config: {
          backgroundColor,
          debugTickLogging,
          maxFrameMs,
          tickRate,
        },
      })

      game.start()
    }

    void initialize().catch((error: unknown) => {
      console.error("Failed to initialize Pixi game view.", error)
    })

    return () => {
      cancelled = true
      game?.stop()
      game?.destroy()
      game = null
      app?.stop()
      app?.destroy({ removeView: true })
      app = null
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
