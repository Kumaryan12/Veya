export type BlinkState = "NO_FACE" | "OPEN" | "CLOSING" | "CLOSED" | "OPENING";

export type ReminderLevel = "NONE" | "AMBIENT" | "NUDGE" | "REMINDER";

export type MonitoringStatus =
  | "idle"
  | "starting"
  | "monitoring"
  | "paused"
  | "no-face"
  | "low-confidence"
  | "camera-denied"
  | "camera-unavailable"
  | "model-error";

export type ReminderSensitivity = "gentle" | "balanced" | "proactive";
export type Appearance = "system" | "light" | "dark";

export interface Point3D {
  x: number;
  y: number;
  z?: number;
}

export interface EyeMetrics {
  leftOpenness: number;
  rightOpenness: number;
  averageOpenness: number;
  confidence: number;
  timestamp: number;
}

export interface CalibrationProfile {
  openBaseline: number;
  closedBaseline: number;
  closureThreshold: number;
  calibratedAt: number;
}

export interface VeyaSettings {
  monitoringEnabled: boolean;
  remindersEnabled: boolean;
  sensitivity: ReminderSensitivity;
  appearance: Appearance;
}

export interface TimelinePoint {
  timestamp: number;
  blinksPerMinute: number;
}

export interface SessionSummary {
  id: string;
  startedAt: number;
  endedAt?: number;
  durationSeconds: number;
  blinkCount: number;
  averageBlinkRate: number;
  longestNoBlinkSeconds: number;
  reminderCount: number;
  timeline: TimelinePoint[];
}

export interface MonitorSnapshot {
  status: MonitoringStatus;
  faceDetected: boolean;
  metrics: EyeMetrics | null;
  blinkState: BlinkState;
  blinkCount: number;
  lastBlinkAt: number | null;
  rollingBlinkRate: number;
  longestNoBlinkSeconds: number;
  reminderScore: number;
  reminderLevel: ReminderLevel;
  reminderCount: number;
  fps: number;
  sessionStartedAt: number | null;
  timeline: TimelinePoint[];
  errorMessage: string | null;
  simulationMode: SimulationMode | null;
}

export type SimulationMode = "normal" | "no-face" | "prolonged-stare" | "low-confidence";

export interface ReminderInput {
  now: number;
  lastBlinkAt: number | null;
  rollingBlinkRate: number;
  baselineBlinkRate: number;
  confidence: number;
  faceDetected: boolean;
  monitoring: boolean;
  remindersEnabled: boolean;
  sensitivity: ReminderSensitivity;
}
