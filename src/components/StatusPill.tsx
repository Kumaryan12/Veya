import type { MonitoringStatus } from "../types";

const LABELS: Record<MonitoringStatus, string> = {
  idle: "ready",
  starting: "starting",
  monitoring: "monitoring",
  paused: "paused",
  "no-face": "waiting for you",
  "low-confidence": "eyes unclear",
  "camera-denied": "camera access needed",
  "camera-unavailable": "camera unavailable",
  "model-error": "tracking unavailable",
};

export function StatusPill({ status }: { status: MonitoringStatus }) {
  const live = status === "monitoring";
  return (
    <span className={`status-pill status-${status}`} role="status">
      <span className={`status-dot ${live ? "pulse" : ""}`} />
      {LABELS[status]}
    </span>
  );
}

