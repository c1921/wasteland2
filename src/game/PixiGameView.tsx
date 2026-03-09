import {
  forwardRef,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { Application } from "pixi.js"

import { cn } from "@/lib/utils"

import { Game } from "./Game"
import type {
  PixiGameViewHandle,
  PlayerCommandIntent,
  PlayerCommandMode,
  SelectionState,
} from "./input/types"
import type { GameConfig } from "./types"

interface PixiGameViewProps {
  className?: string
  commandMode?: PlayerCommandMode
  config?: Partial<GameConfig>
  onCommandIntent?: (intent: PlayerCommandIntent) => void
  onSelectionChange?: (selection: SelectionState | null) => void
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

export const PixiGameView = forwardRef<PixiGameViewHandle, PixiGameViewProps>(
  function PixiGameView(
    {
      className,
      commandMode = "inspect",
      config,
      onCommandIntent,
      onSelectionChange,
    }: PixiGameViewProps,
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const gameRef = useRef<Game | null>(null)
    const initialCommandModeRef = useRef(commandMode)
    const [fatalError, setFatalError] = useState<Error | null>(null)
    const backgroundColor = config?.backgroundColor
    const debugTickLogging = config?.debugTickLogging
    const maxFrameMs = config?.maxFrameMs
    const tickRate = config?.tickRate
    const emitCommandIntent = useEffectEvent((intent: PlayerCommandIntent) => {
      onCommandIntent?.(intent)
    })
    const emitSelectionChange = useEffectEvent(
      (selection: SelectionState | null) => {
        onSelectionChange?.(selection)
      }
    )

    if (fatalError) {
      throw fatalError
    }

    useImperativeHandle(
      ref,
      () => ({
        resetCamera: () => {
          gameRef.current?.resetCamera()
        },
      }),
      []
    )

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
        if (gameRef.current === currentGame) {
          gameRef.current = null
        }
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
            uiBridge: {
              initialCommandMode: initialCommandModeRef.current,
              onCommandIntent: (intent) => emitCommandIntent(intent),
              onSelectionChange: (selection) => emitSelectionChange(selection),
            },
          })

          game = nextGame
          gameRef.current = nextGame

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

    useEffect(() => {
      gameRef.current?.setCommandMode(commandMode)
    }, [commandMode])

    return (
      <div
        ref={containerRef}
        tabIndex={0}
        className={cn(
          "size-full overflow-hidden rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
          className
        )}
        onBlur={() => {
          gameRef.current?.setPanModifierActive(false)
        }}
        onKeyDown={(event) => {
          if (event.code !== "Space") {
            return
          }

          event.preventDefault()
          gameRef.current?.setPanModifierActive(true)
        }}
        onKeyUp={(event) => {
          if (event.code !== "Space") {
            return
          }

          event.preventDefault()
          gameRef.current?.setPanModifierActive(false)
        }}
        onPointerDownCapture={() => {
          containerRef.current?.focus()
        }}
      />
    )
  }
)

PixiGameView.displayName = "PixiGameView"
