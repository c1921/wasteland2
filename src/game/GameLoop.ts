interface GameLoopOptions {
  tickRate: number
  maxFrameMs?: number
  onTick: (fixedStepMs: number) => void
  onRender: (alpha: number) => void
}

export class GameLoop {
  readonly fixedStepMs: number
  readonly maxFrameMs: number

  isRunning = false

  private accumulatorMs = 0
  private frameRequestId: number | null = null
  private lastFrameTime = 0
  private readonly onRender: (alpha: number) => void
  private readonly onTick: (fixedStepMs: number) => void

  constructor({ tickRate, maxFrameMs = 250, onTick, onRender }: GameLoopOptions) {
    if (tickRate <= 0) {
      throw new Error("GameLoop tickRate must be greater than 0.")
    }

    this.fixedStepMs = 1000 / tickRate
    this.maxFrameMs = maxFrameMs
    this.onTick = onTick
    this.onRender = onRender
  }

  start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.accumulatorMs = 0
    this.lastFrameTime = performance.now()
    this.onRender(0)
    this.frameRequestId = requestAnimationFrame(this.frame)
  }

  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.accumulatorMs = 0

    if (this.frameRequestId !== null) {
      cancelAnimationFrame(this.frameRequestId)
      this.frameRequestId = null
    }
  }

  private readonly frame = (timestamp: number): void => {
    if (!this.isRunning) {
      return
    }

    const rawDeltaMs = timestamp - this.lastFrameTime
    const deltaMs = Math.min(Math.max(rawDeltaMs, 0), this.maxFrameMs)

    this.lastFrameTime = timestamp
    this.accumulatorMs += deltaMs

    while (this.accumulatorMs >= this.fixedStepMs) {
      this.onTick(this.fixedStepMs)
      this.accumulatorMs -= this.fixedStepMs
    }

    this.onRender(this.accumulatorMs / this.fixedStepMs)
    this.frameRequestId = requestAnimationFrame(this.frame)
  }
}
