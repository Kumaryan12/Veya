import { REMINDER_CONFIG } from "../../lib/config";
import type { ReminderInput, ReminderLevel } from "../../types";

export interface ReminderResult {
  score: number;
  level: ReminderLevel;
  newlyTriggered: boolean;
}

export class ReminderEngine {
  private lastReminderAt = -Infinity;
  private previousLevel: ReminderLevel = "NONE";

  evaluate(input: ReminderInput): ReminderResult {
    const reliable =
      input.monitoring && input.remindersEnabled && input.faceDetected && input.confidence >= 0.58 && input.lastBlinkAt !== null;
    if (!reliable || input.now - this.lastReminderAt < REMINDER_CONFIG.cooldownMs) {
      this.previousLevel = "NONE";
      return { score: 0, level: "NONE", newlyTriggered: false };
    }

    const noBlinkMs = input.now - input.lastBlinkAt;
    const timeScore = Math.max(0, Math.min(1, (noBlinkMs - 5_000) / REMINDER_CONFIG.noBlinkReferenceMs));
    const baseline = Math.max(4, input.baselineBlinkRate);
    const rateDrop = Math.max(0, Math.min(1, (baseline - input.rollingBlinkRate) / baseline));
    const confidenceGate = Math.max(0, Math.min(1, (input.confidence - 0.58) / 0.3));
    const sensitivity = REMINDER_CONFIG.sensitivityMultiplier[input.sensitivity];
    const score = Math.min(1, (timeScore * 0.68 + rateDrop * 0.32) * confidenceGate * sensitivity);
    const { ambient, nudge, reminder } = REMINDER_CONFIG.levelThresholds;
    const level: ReminderLevel = score >= reminder ? "REMINDER" : score >= nudge ? "NUDGE" : score >= ambient ? "AMBIENT" : "NONE";
    const newlyTriggered = level === "REMINDER" && this.previousLevel !== "REMINDER";
    if (newlyTriggered) this.lastReminderAt = input.now;
    this.previousLevel = level;
    return { score, level, newlyTriggered };
  }

  acknowledgeBlink(): void {
    this.previousLevel = "NONE";
  }

  resetCooldown(): void {
    this.lastReminderAt = -Infinity;
  }
}

