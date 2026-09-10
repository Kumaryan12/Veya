import { describe, expect, it } from "vitest";
import { ReminderEngine } from "./ReminderEngine";
import type { ReminderInput } from "../../types";

const base: ReminderInput = {
  now: 100_000,
  lastBlinkAt: 99_000,
  rollingBlinkRate: 14,
  baselineBlinkRate: 14,
  confidence: .95,
  faceDetected: true,
  monitoring: true,
  remindersEnabled: true,
  sensitivity: "balanced",
};

describe("ReminderEngine", () => {
  it("disables reminders without a reliable face", () => {
    const result = new ReminderEngine().evaluate({ ...base, faceDetected: false, lastBlinkAt: 60_000 });
    expect(result).toEqual({ score: 0, level: "NONE", newlyTriggered: false });
  });

  it("escalates a prolonged stare with a dropped blink rate", () => {
    const result = new ReminderEngine().evaluate({ ...base, lastBlinkAt: 65_000, rollingBlinkRate: 2 });
    expect(result.level).toBe("REMINDER");
    expect(result.newlyTriggered).toBe(true);
  });

  it("holds a reminder until acknowledgement rather than dropping it next frame", () => {
    const engine = new ReminderEngine();
    engine.evaluate({ ...base, lastBlinkAt: 65_000, rollingBlinkRate: 2 });
    const next = engine.evaluate({ ...base, now: 100_100, lastBlinkAt: 65_000, rollingBlinkRate: 2 });
    expect(next.level).toBe("REMINDER");
    expect(next.newlyTriggered).toBe(false);
  });
});

