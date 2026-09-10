import { CALIBRATION_CONFIG } from "../../lib/config";
import type { CalibrationProfile } from "../../types";

function median(values: number[]): number {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
}

export function calculateCalibration(openSamples: number[], closedSamples: number[], now = Date.now()): CalibrationProfile {
  if (openSamples.length < CALIBRATION_CONFIG.requiredOpenSamples) {
    throw new Error("Not enough clear open-eye samples were collected.");
  }
  if (closedSamples.length < CALIBRATION_CONFIG.requiredBlinks) {
    throw new Error("Veya could not clearly detect three natural blinks.");
  }

  const openBaseline = median(openSamples.filter(Number.isFinite));
  const closedBaseline = median(closedSamples.filter(Number.isFinite));
  if (openBaseline - closedBaseline < CALIBRATION_CONFIG.minimumRange) {
    throw new Error("The open and closed eye ranges were too similar. Try again in softer, even light.");
  }
  const closureThreshold = closedBaseline + (openBaseline - closedBaseline) * CALIBRATION_CONFIG.thresholdPosition;
  return { openBaseline, closedBaseline, closureThreshold, calibratedAt: now };
}

