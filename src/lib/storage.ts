import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./config";
import type { CalibrationProfile, SessionSummary, VeyaSettings } from "../types";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getSettings(): VeyaSettings {
    return { ...DEFAULT_SETTINGS, ...readJson<Partial<VeyaSettings>>(STORAGE_KEYS.settings, {}) };
  },
  setSettings(settings: VeyaSettings): void {
    writeJson(STORAGE_KEYS.settings, settings);
  },
  getCalibration(): CalibrationProfile | null {
    return readJson<CalibrationProfile | null>(STORAGE_KEYS.calibration, null);
  },
  setCalibration(profile: CalibrationProfile): void {
    writeJson(STORAGE_KEYS.calibration, profile);
  },
  getSessions(): SessionSummary[] {
    return readJson<SessionSummary[]>(STORAGE_KEYS.sessions, []);
  },
  addSession(session: SessionSummary): void {
    const sessions = this.getSessions();
    writeJson(STORAGE_KEYS.sessions, [...sessions, session].slice(-90));
  },
  isOnboardingComplete(): boolean {
    return localStorage.getItem(STORAGE_KEYS.onboarding) === "complete";
  },
  completeOnboarding(): void {
    localStorage.setItem(STORAGE_KEYS.onboarding, "complete");
  },
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

