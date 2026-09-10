import { describe, expect, it } from "vitest";
import { calculateCalibration } from "./calibration";

describe("calculateCalibration", () => {
  it("places the threshold between personalized closed and open ranges", () => {
    const open = Array.from({ length: 32 }, (_, index) => .29 + (index % 3) * .002);
    const profile = calculateCalibration(open, [.1, .11, .105], 42);
    expect(profile.closedBaseline).toBeCloseTo(.105);
    expect(profile.closureThreshold).toBeGreaterThan(.105);
    expect(profile.closureThreshold).toBeLessThan(.3);
    expect(profile.calibratedAt).toBe(42);
  });

  it("rejects insufficient separation", () => {
    expect(() => calculateCalibration(Array(30).fill(.2), [.18, .18, .18])).toThrow(/similar/);
  });
});

