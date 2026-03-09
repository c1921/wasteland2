import { Component, type ErrorInfo, type ReactNode, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PixiGameErrorBoundaryProps {
  children: ReactNode
  className?: string
}

interface PixiGameErrorBoundaryInnerProps
  extends PixiGameErrorBoundaryProps {
  onRetry: () => void
}

interface PixiGameErrorBoundaryState {
  hasError: boolean
}

class PixiGameErrorBoundaryInner extends Component<
  PixiGameErrorBoundaryInnerProps,
  PixiGameErrorBoundaryState
> {
  state: PixiGameErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): PixiGameErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Pixi game panel crashed.", error, errorInfo)
  }

  override render(): ReactNode {
    const { children, className, onRetry } = this.props

    if (!this.state.hasError) {
      return children
    }

    return (
      <div
        className={cn(
          "flex size-full min-h-[540px] items-center justify-center p-6",
          className
        )}
      >
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border border-cyan-300/20 bg-slate-950/70 px-6 py-7 text-center shadow-xl shadow-cyan-950/20 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/75">
              Render Error
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Game panel failed to start
            </h2>
            <p className="text-sm leading-6 text-slate-300">
              The Pixi runtime hit an initialization error. Retry remounts the
              game view without affecting the rest of the page.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </div>
    )
  }
}

export function PixiGameErrorBoundary({
  children,
  className,
}: PixiGameErrorBoundaryProps) {
  const [retryKey, setRetryKey] = useState(0)

  return (
    <PixiGameErrorBoundaryInner
      key={retryKey}
      className={className}
      onRetry={() => setRetryKey((currentKey) => currentKey + 1)}
    >
      {children}
    </PixiGameErrorBoundaryInner>
  )
}
