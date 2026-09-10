import { describe, expect, it } from "vitest";
import { createSessionSummary, rollingBlinkRate } from "./analytics";

describe("analytics", () => {
  it("calculates a rolling per-minute rate from the observed session", () => {
    expect(rollingBlinkRate([10_000, 20_000, 30_000], 30_000, 120_000, 0)).toBe(6);
  });

  it("aggregates a local session summary", () => {
    const summary = createSessionSummary({ id: "session", startedAt: 0, endedAt: 60_000, blinkTimestamps: [10_000, 20_000], longestNoBlinkSeconds: 20, reminderCount: 1 });
    expect(summary.durationSeconds).toBe(60);
    expect(summary.blinkCount).toBe(2);
    expect(summary.averageBlinkRate).toBe(2);
    expect(summary.timeline).toHaveLength(2);
  });
});
