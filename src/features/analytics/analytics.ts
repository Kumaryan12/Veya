import { REMINDER_CONFIG } from "../../lib/config";
import type { SessionSummary, TimelinePoint } from "../../types";

export function rollingBlinkRate(blinkTimestamps: number[], now: number, windowMs = REMINDER_CONFIG.rollingWindowMs): number {
  const earliest = now - windowMs;
  const count = blinkTimestamps.filter((timestamp) => timestamp >= earliest && timestamp <= now).length;
  const observedMs = Math.min(windowMs, Math.max(1, now - (blinkTimestamps[0] ?? now)));
  return count * (60_000 / observedMs);
}

export function makeTimeline(blinkTimestamps: number[], startedAt: number, endedAt: number): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  for (let start = startedAt; start <= endedAt; start += REMINDER_CONFIG.timelineBucketMs) {
    const end = Math.min(start + REMINDER_CONFIG.timelineBucketMs, endedAt);
    const count = blinkTimestamps.filter((blink) => blink >= start && blink < end).length;
    const bucketMinutes = Math.max((end - start) / 60_000, 1 / 60);
    points.push({ timestamp: start, blinksPerMinute: count / bucketMinutes });
  }
  return points;
}

export function createSessionSummary(input: {
  id: string;
  startedAt: number;
  endedAt: number;
  blinkTimestamps: number[];
  longestNoBlinkSeconds: number;
  reminderCount: number;
}): SessionSummary {
  const durationSeconds = Math.max(0, (input.endedAt - input.startedAt) / 1_000);
  return {
    id: input.id,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationSeconds,
    blinkCount: input.blinkTimestamps.length,
    averageBlinkRate: durationSeconds > 0 ? input.blinkTimestamps.length / (durationSeconds / 60) : 0,
    longestNoBlinkSeconds: input.longestNoBlinkSeconds,
    reminderCount: input.reminderCount,
    timeline: makeTimeline(input.blinkTimestamps, input.startedAt, input.endedAt),
  };
}

