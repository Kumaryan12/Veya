import { createSessionSummary, makeTimeline, rollingBlinkRate } from "../analytics/analytics";
import { BlinkDetector } from "../blink/BlinkDetector";
import { CameraError, CameraService } from "../camera/CameraService";
import { calculateEyeMetrics, EyeMetricSmoother } from "../face/eyeOpenness";
import { FaceLandmarkerService } from "../face/FaceLandmarkerService";
import { ReminderEngine } from "../reminders/ReminderEngine";
import { updateOverlay } from "../reminders/overlayBridge";
import { BLINK_CONFIG } from "../../lib/config";
import { storage } from "../../lib/storage";
import { monitorStore } from "../../stores/monitorStore";
import type { CalibrationProfile, EyeMetrics, SimulationMode, VeyaSettings } from "../../types";

type MetricListener = (metrics: EyeMetrics | null) => void;

class MonitoringService {
  private camera = new CameraService();
  private face = new FaceLandmarkerService();
  private detector = new BlinkDetector();
  private smoother = new EyeMetricSmoother(BLINK_CONFIG.smoothingWindow);
  private reminder = new ReminderEngine();
  private video: HTMLVideoElement | null = null;
  private frameHandle: number | null = null;
  private lastInferenceAt = 0;
  private lastUiUpdateAt = 0;
  private framesThisSecond = 0;
  private fpsWindowAt = performance.now();
  private fps = 0;
  private running = false;
  private paused = false;
  private blinkTimestamps: number[] = [];
  private sessionStartedAt: number | null = null;
  private listeners = new Set<MetricListener>();
  private settings: VeyaSettings = storage.getSettings();
  private simulationTimer: number | null = null;
  private simulationStartedAt = 0;
  private startPromise: Promise<void> | null = null;
  private lastPersistAt = 0;

  constructor() {
    window.addEventListener("beforeunload", () => this.finishSession());
  }

  setCalibration(profile: CalibrationProfile | null): void {
    this.detector.setThreshold(profile?.closureThreshold ?? BLINK_CONFIG.defaultClosureThreshold);
  }

  setSettings(settings: VeyaSettings): void {
    this.settings = settings;
    this.paused = !settings.monitoringEnabled;
    if (this.paused) {
      monitorStore.update({ status: "paused", reminderLevel: "NONE", reminderScore: 0 });
      void updateOverlay("NONE");
    } else if (this.running) {
      monitorStore.update({ status: "monitoring" });
    }
  }

  subscribeMetrics(listener: MetricListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(): Promise<void> {
    if (this.running) {
      this.paused = false;
      monitorStore.update({ status: "monitoring" });
      return;
    }
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.startInternal();
    try {
      await this.startPromise;
    } finally {
      this.startPromise = null;
    }
  }

  private async startInternal(): Promise<void> {
    this.stopSimulation();
    monitorStore.update({ status: "starting", errorMessage: null });
    try {
      const [video] = await Promise.all([this.camera.start(), this.face.load()]);
      this.video = video;
      if (video.srcObject instanceof MediaStream) {
        video.srcObject.getVideoTracks()[0]?.addEventListener("ended", () => {
          monitorStore.update({ status: "camera-unavailable", errorMessage: "The camera disconnected. Reconnect it, then try again." });
          this.pause();
        }, { once: true });
      }
      this.beginSession();
      this.running = true;
      this.paused = false;
      this.scheduleFrame();
    } catch (error) {
      this.camera.stop();
      this.face.close();
      const status = error instanceof CameraError ? (error.kind === "denied" ? "camera-denied" : "camera-unavailable") : "model-error";
      const message = error instanceof CameraError
        ? error.message
        : "Veya’s local face model couldn’t start. Restart the app and try again.";
      monitorStore.update({ status, errorMessage: message });
      throw error;
    }
  }

  pause(): void {
    this.paused = true;
    monitorStore.update({ status: "paused", reminderLevel: "NONE", reminderScore: 0 });
    void updateOverlay("NONE");
  }

  resume(): void {
    if (!this.running) {
      void this.start();
      return;
    }
    this.paused = false;
    monitorStore.update({ status: "monitoring" });
  }

  stop(): void {
    this.finishSession();
    this.running = false;
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
    this.camera.stop();
    this.face.close();
    this.smoother.reset();
    this.detector.reset();
    void updateOverlay("NONE");
    monitorStore.update({ status: "idle", faceDetected: false, metrics: null, blinkState: "NO_FACE" });
  }

  simulateBlink(): void {
    if (!this.simulationTimer) this.startSimulation("normal");
    const now = performance.now();
    this.processMetrics(this.fakeMetrics(0.11, 0.93, now), now);
    window.setTimeout(() => this.processMetrics(this.fakeMetrics(0.1, 0.93, performance.now()), performance.now()), 85);
    window.setTimeout(() => this.processMetrics(this.fakeMetrics(0.29, 0.93, performance.now()), performance.now()), 160);
    window.setTimeout(() => this.processMetrics(this.fakeMetrics(0.3, 0.93, performance.now()), performance.now()), 230);
  }

  startSimulation(mode: SimulationMode): void {
    this.stop();
    this.stopSimulation();
    this.beginSession();
    this.running = true;
    this.simulationStartedAt = performance.now();
    monitorStore.update({ simulationMode: mode, status: "monitoring" });
    this.simulationTimer = window.setInterval(() => this.tickSimulation(mode), BLINK_CONFIG.inferenceIntervalMs);
  }

  stopSimulation(): void {
    if (this.simulationTimer !== null) window.clearInterval(this.simulationTimer);
    this.simulationTimer = null;
    monitorStore.update({ simulationMode: null });
  }

  private tickSimulation(mode: SimulationMode): void {
    const now = performance.now();
    if (mode === "no-face") {
      this.processMetrics(null, now);
      return;
    }
    const confidence = mode === "low-confidence" ? 0.35 : 0.94;
    const elapsed = now - this.simulationStartedAt;
    const inBlink = mode === "normal" && elapsed % 4_000 > 3_760;
    this.processMetrics(this.fakeMetrics(inBlink ? 0.1 : 0.3, confidence, now), now);
  }

  private fakeMetrics(openness: number, confidence: number, timestamp: number): EyeMetrics {
    return { leftOpenness: openness * 0.98, rightOpenness: openness * 1.02, averageOpenness: openness, confidence, timestamp };
  }

  private beginSession(): void {
    const interrupted = storage.getActiveSession();
    if (interrupted && interrupted.durationSeconds >= 10) storage.addSession(interrupted);
    storage.clearActiveSession();
    this.sessionStartedAt = Date.now();
    this.blinkTimestamps = [];
    this.reminder.resetCooldown();
    monitorStore.update({
      status: "monitoring",
      sessionStartedAt: this.sessionStartedAt,
      blinkCount: 0,
      reminderCount: 0,
      longestNoBlinkSeconds: 0,
      lastBlinkAt: null,
      timeline: [],
    });
  }

  private finishSession(): void {
    if (!this.sessionStartedAt || monitorStore.getSnapshot().simulationMode) return;
    const now = Date.now();
    if (now - this.sessionStartedAt > 10_000) {
      storage.addSession(
        createSessionSummary({
          id: crypto.randomUUID(),
          startedAt: this.sessionStartedAt,
          endedAt: now,
          blinkTimestamps: this.blinkTimestamps,
          longestNoBlinkSeconds: monitorStore.getSnapshot().longestNoBlinkSeconds,
          reminderCount: monitorStore.getSnapshot().reminderCount,
        }),
      );
    }
    storage.clearActiveSession();
    this.sessionStartedAt = null;
  }

  private scheduleFrame(): void {
    this.frameHandle = requestAnimationFrame((now) => {
      if (this.running) {
        if (!this.paused && now - this.lastInferenceAt >= BLINK_CONFIG.inferenceIntervalMs) {
          this.lastInferenceAt = now;
          this.infer(now);
        }
        this.scheduleFrame();
      }
    });
  }

  private infer(now: number): void {
    if (!this.video || this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    try {
      const result = this.face.detect(this.video, now);
      const landmarks = result.faceLandmarks[0];
      const raw = landmarks ? calculateEyeMetrics(landmarks, this.video.videoWidth, this.video.videoHeight, now) : null;
      const metrics = raw ? this.smoother.add(raw) : null;
      if (!metrics) this.smoother.reset();
      this.framesThisSecond += 1;
      if (now - this.fpsWindowAt >= 1_000) {
        this.fps = (this.framesThisSecond * 1_000) / (now - this.fpsWindowAt);
        this.framesThisSecond = 0;
        this.fpsWindowAt = now;
      }
      this.processMetrics(metrics, now);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local face tracking stopped unexpectedly.";
      monitorStore.update({ status: "model-error", errorMessage: message });
      this.pause();
    }
  }

  private processMetrics(metrics: EyeMetrics | null, now: number): void {
    this.listeners.forEach((listener) => listener(metrics));
    const reliable = Boolean(metrics && metrics.confidence >= BLINK_CONFIG.minimumConfidence);
    const blink = this.detector.update(reliable ? metrics : null, now);
    const snapshot = monitorStore.getSnapshot();

    if (blink.blinked) {
      const wallTime = Date.now();
      this.blinkTimestamps.push(wallTime);
      this.reminder.acknowledgeBlink();
      if (snapshot.reminderLevel !== "NONE") {
        void updateOverlay("ACKNOWLEDGED");
        window.setTimeout(() => void updateOverlay("NONE"), 650);
      }
    }

    const wallNow = Date.now();
    const lastBlinkAt = blink.blinked ? wallNow : snapshot.lastBlinkAt;
    const sinceBlink = lastBlinkAt ? (wallNow - lastBlinkAt) / 1_000 : 0;
    const rate = rollingBlinkRate(this.blinkTimestamps, wallNow, undefined, this.sessionStartedAt ?? wallNow);
    const recentSessions = storage.getSessions().slice(-5);
    const baselineRate = Math.min(25, Math.max(10, recentSessions.reduce((sum, session) => sum + session.averageBlinkRate, 0) / Math.max(1, recentSessions.length)));
    const reminderResult = this.reminder.evaluate({
      now: wallNow,
      lastBlinkAt,
      rollingBlinkRate: rate,
      baselineBlinkRate: baselineRate,
      confidence: metrics?.confidence ?? 0,
      faceDetected: reliable,
      monitoring: !this.paused,
      remindersEnabled: this.settings.remindersEnabled,
      sensitivity: this.settings.sensitivity,
    });

    if (reminderResult.level !== snapshot.reminderLevel && !blink.blinked) {
      void updateOverlay(reminderResult.level);
    }

    if (now - this.lastUiUpdateAt >= 180 || blink.blinked || !reliable) {
      this.lastUiUpdateAt = now;
      const status = !reliable ? (metrics ? "low-confidence" : "no-face") : "monitoring";
      const timeline = this.sessionStartedAt ? makeTimeline(this.blinkTimestamps, this.sessionStartedAt, wallNow) : [];
      const nextLongest = Math.max(snapshot.longestNoBlinkSeconds, sinceBlink);
      const nextReminderCount = snapshot.reminderCount + (reminderResult.newlyTriggered ? 1 : 0);
      monitorStore.update({
        status,
        faceDetected: reliable,
        metrics,
        blinkState: blink.state,
        blinkCount: this.blinkTimestamps.length,
        lastBlinkAt,
        rollingBlinkRate: rate,
        longestNoBlinkSeconds: nextLongest,
        reminderScore: reminderResult.score,
        reminderLevel: blink.blinked ? "NONE" : reminderResult.level,
        reminderCount: nextReminderCount,
        fps: this.fps,
        timeline,
        errorMessage: null,
      });
      if (this.sessionStartedAt && !snapshot.simulationMode && wallNow - this.lastPersistAt >= 10_000) {
        storage.setActiveSession(createSessionSummary({
          id: `active-${this.sessionStartedAt}`,
          startedAt: this.sessionStartedAt,
          endedAt: wallNow,
          blinkTimestamps: this.blinkTimestamps,
          longestNoBlinkSeconds: nextLongest,
          reminderCount: nextReminderCount,
        }));
        this.lastPersistAt = wallNow;
      }
    }
  }
}

export const monitoringService = new MonitoringService();
