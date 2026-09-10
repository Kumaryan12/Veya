import { useSyncExternalStore } from "react";
import type { MonitorSnapshot } from "../types";

const INITIAL_SNAPSHOT: MonitorSnapshot = {
  status: "idle",
  faceDetected: false,
  metrics: null,
  blinkState: "NO_FACE",
  blinkCount: 0,
  lastBlinkAt: null,
  rollingBlinkRate: 0,
  longestNoBlinkSeconds: 0,
  reminderScore: 0,
  reminderLevel: "NONE",
  reminderCount: 0,
  fps: 0,
  sessionStartedAt: null,
  timeline: [],
  errorMessage: null,
  simulationMode: null,
};

type Listener = () => void;

class MonitorStore {
  private snapshot = INITIAL_SNAPSHOT;
  private listeners = new Set<Listener>();

  getSnapshot = (): MonitorSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  update(patch: Partial<MonitorSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  reset(): void {
    this.snapshot = INITIAL_SNAPSHOT;
    this.listeners.forEach((listener) => listener());
  }
}

export const monitorStore = new MonitorStore();

export function useMonitorSnapshot(): MonitorSnapshot {
  return useSyncExternalStore(monitorStore.subscribe, monitorStore.getSnapshot, monitorStore.getSnapshot);
}
