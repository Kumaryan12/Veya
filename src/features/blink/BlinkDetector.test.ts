import { describe, expect, it } from "vitest";
import { BlinkDetector } from "./BlinkDetector";
import type { EyeMetrics } from "../../types";

function metric(openness: number, timestamp: number, confidence = 0.95): EyeMetrics {
  return { leftOpenness: openness, rightOpenness: openness, averageOpenness: openness, confidence, timestamp };
}

function feed(detector: BlinkDetector, samples: [number, number][]): number {
  return samples.reduce((count, [timestamp, openness]) => count + Number(detector.update(metric(openness, timestamp), timestamp).blinked), 0);
}

describe("BlinkDetector", () => {
  it("counts a sustained close and reopen sequence once", () => {
    const detector = new BlinkDetector(0.2);
    expect(feed(detector, [[0, .3], [100, .1], [180, .1], [230, .3], [300, .3]])).toBe(1);
  });

  it("rejects a closure shorter than the minimum duration", () => {
    const detector = new BlinkDetector(0.2);
    expect(feed(detector, [[0, .3], [100, .1], [140, .3], [220, .3]])).toBe(0);
  });

  it("does not count a long closure repeatedly", () => {
    const detector = new BlinkDetector(0.2);
    expect(feed(detector, [[0, .3], [100, .1], [180, .1], [900, .1], [1_500, .1], [1_600, .3], [1_680, .3]])).toBe(0);
  });

  it("enters NO_FACE and emits no blink on unreliable input", () => {
    const detector = new BlinkDetector(0.2);
    detector.update(metric(.3, 0), 0);
    const result = detector.update(null, 100);
    expect(result).toEqual({ state: "NO_FACE", blinked: false });
  });
});

