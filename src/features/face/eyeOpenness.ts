import type { EyeMetrics, Point3D } from "../../types";

const LEFT_EYE = { horizontal: [33, 133], vertical: [[159, 145], [158, 153]] } as const;
const RIGHT_EYE = { horizontal: [362, 263], vertical: [[386, 374], [385, 380]] } as const;

function distance(a: Point3D, b: Point3D, width: number, height: number): number {
  return Math.hypot((a.x - b.x) * width, (a.y - b.y) * height);
}

function eyeAspectRatio(
  landmarks: Point3D[],
  eye: typeof LEFT_EYE | typeof RIGHT_EYE,
  width: number,
  height: number,
): number {
  const horizontal = distance(landmarks[eye.horizontal[0]], landmarks[eye.horizontal[1]], width, height);
  if (horizontal < 0.5) return 0;
  const vertical = eye.vertical.reduce(
    (sum, pair) => sum + distance(landmarks[pair[0]], landmarks[pair[1]], width, height),
    0,
  );
  return vertical / (2 * horizontal);
}

function estimateConfidence(landmarks: Point3D[], left: number, right: number): number {
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const nose = landmarks[1];
  if (!leftCheek || !rightCheek || !nose) return 0;

  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
  const nosePosition = (nose.x - leftCheek.x) / Math.max(faceWidth, 0.001);
  const yawQuality = Math.max(0, 1 - Math.abs(nosePosition - 0.5) * 2.8);
  const eyeAgreement = Math.max(0, 1 - Math.abs(left - right) / Math.max(left, right, 0.04));
  const sizeQuality = Math.min(1, faceWidth / 0.22);
  const edgeQuality = [leftCheek.x, rightCheek.x].every((x) => x > 0.02 && x < 0.98) ? 1 : 0.35;
  return Math.max(0, Math.min(1, yawQuality * 0.38 + eyeAgreement * 0.32 + sizeQuality * 0.2 + edgeQuality * 0.1));
}

export function calculateEyeMetrics(
  landmarks: Point3D[],
  width: number,
  height: number,
  timestamp: number,
): EyeMetrics | null {
  if (landmarks.length < 455 || width <= 0 || height <= 0) return null;
  const leftOpenness = eyeAspectRatio(landmarks, LEFT_EYE, width, height);
  const rightOpenness = eyeAspectRatio(landmarks, RIGHT_EYE, width, height);
  const averageOpenness = (leftOpenness + rightOpenness) / 2;
  return {
    leftOpenness,
    rightOpenness,
    averageOpenness,
    confidence: estimateConfidence(landmarks, leftOpenness, rightOpenness),
    timestamp,
  };
}

export class EyeMetricSmoother {
  private samples: EyeMetrics[] = [];

  constructor(private readonly windowSize: number) {}

  add(metric: EyeMetrics): EyeMetrics {
    this.samples.push(metric);
    if (this.samples.length > this.windowSize) this.samples.shift();
    const mean = (key: "leftOpenness" | "rightOpenness" | "averageOpenness" | "confidence") =>
      this.samples.reduce((sum, item) => sum + item[key], 0) / this.samples.length;
    return {
      leftOpenness: mean("leftOpenness"),
      rightOpenness: mean("rightOpenness"),
      averageOpenness: mean("averageOpenness"),
      confidence: mean("confidence"),
      timestamp: metric.timestamp,
    };
  }

  reset(): void {
    this.samples = [];
  }
}

