export const BLINK_CONFIG = {
  inferenceIntervalMs: 66,
  smoothingWindow: 4,
  defaultClosureThreshold: 0.19,
  minimumClosureMs: 66,
  maximumBlinkDurationMs: 800,
  reopenConfirmationMs: 55,
  cooldownMs: 180,
  minimumConfidence: 0.58,
} as const;

export const CALIBRATION_CONFIG = {
  openCollectionMs: 3_200,
  requiredOpenSamples: 28,
  requiredBlinks: 3,
  closureRatioFromOpen: 0.67,
  minimumRange: 0.035,
  thresholdPosition: 0.43,
} as const;

export const REMINDER_CONFIG = {
  rollingWindowMs: 120_000,
  timelineBucketMs: 60_000,
  minimumReliableSessionMs: 45_000,
  cooldownMs: 45_000,
  noBlinkReferenceMs: 16_000,
  levelThresholds: { ambient: 0.4, nudge: 0.62, reminder: 0.82 },
  sensitivityMultiplier: { gentle: 0.82, balanced: 1, proactive: 1.16 },
} as const;

export const DEFAULT_SETTINGS = {
  monitoringEnabled: true,
  remindersEnabled: true,
  sensitivity: "balanced",
  appearance: "system",
} as const;

export const STORAGE_KEYS = {
  settings: "veya.settings.v1",
  calibration: "veya.calibration.v1",
  sessions: "veya.sessions.v1",
  onboarding: "veya.onboarding.v1",
} as const;

