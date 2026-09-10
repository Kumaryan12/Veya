import { BLINK_CONFIG } from "../../lib/config";
import type { BlinkState, EyeMetrics } from "../../types";

export interface BlinkUpdate {
  state: BlinkState;
  blinked: boolean;
}

export class BlinkDetector {
  private state: BlinkState = "NO_FACE";
  private transitionAt = 0;
  private closureStartedAt = 0;
  private lastBlinkAt = -Infinity;

  constructor(private closureThreshold: number = BLINK_CONFIG.defaultClosureThreshold) {}

  setThreshold(threshold: number): void {
    this.closureThreshold = threshold;
  }

  getState(): BlinkState {
    return this.state;
  }

  reset(): void {
    this.state = "NO_FACE";
    this.transitionAt = 0;
    this.closureStartedAt = 0;
  }

  update(metrics: EyeMetrics | null, timestamp: number): BlinkUpdate {
    if (!metrics || metrics.confidence < BLINK_CONFIG.minimumConfidence) {
      this.state = "NO_FACE";
      this.transitionAt = timestamp;
      return { state: this.state, blinked: false };
    }

    const closed = metrics.averageOpenness < this.closureThreshold;
    if (this.state === "NO_FACE") {
      this.state = closed ? "CLOSING" : "OPEN";
      this.transitionAt = timestamp;
      if (closed) this.closureStartedAt = timestamp;
      return { state: this.state, blinked: false };
    }

    if (this.state === "OPEN" && closed) {
      this.state = "CLOSING";
      this.transitionAt = timestamp;
      this.closureStartedAt = timestamp;
    } else if (this.state === "CLOSING") {
      if (!closed) {
        this.state = "OPEN";
      } else if (timestamp - this.transitionAt >= BLINK_CONFIG.minimumClosureMs) {
        this.state = "CLOSED";
        this.transitionAt = timestamp;
      }
    } else if (this.state === "CLOSED" && !closed) {
      this.state = "OPENING";
      this.transitionAt = timestamp;
    } else if (this.state === "OPENING") {
      if (closed) {
        this.state = "CLOSED";
        this.transitionAt = timestamp;
      } else if (timestamp - this.transitionAt >= BLINK_CONFIG.reopenConfirmationMs) {
        this.state = "OPEN";
        const duration = timestamp - this.closureStartedAt;
        const validDuration = duration <= BLINK_CONFIG.maximumBlinkDurationMs;
        const cooledDown = timestamp - this.lastBlinkAt >= BLINK_CONFIG.cooldownMs;
        if (validDuration && cooledDown) {
          this.lastBlinkAt = timestamp;
          return { state: this.state, blinked: true };
        }
      }
    }

    return { state: this.state, blinked: false };
  }
}
