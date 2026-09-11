import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, Settings, ShieldCheck } from "lucide-react";
import { BlinkChart } from "../components/BlinkChart";
import { Brand, Eyes } from "../components/Brand";
import { StatusPill } from "../components/StatusPill";
import { CalibrationPanel } from "../features/calibration/CalibrationPanel";
import { DebugPanel } from "../features/debug/DebugPanel";
import { monitoringService } from "../features/monitoring/MonitoringService";
import { isTauri } from "../features/reminders/overlayBridge";
import { WebReminder } from "../features/reminders/WebReminder";
import { SettingsPanel } from "../features/settings/SettingsPanel";
import { storage } from "../lib/storage";
import { useMonitorSnapshot } from "../stores/monitorStore";
import type { CalibrationProfile, TimelinePoint, VeyaSettings } from "../types";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function statusCopy(status: ReturnType<typeof useMonitorSnapshot>["status"]): string {
  if (status === "monitoring") return "in your rhythm";
  if (status === "no-face") return "waiting quietly";
  if (status === "low-confidence") return "eyes are unclear";
  if (status === "paused") return "taking a pause";
  if (status === "starting") return "getting ready";
  return "ready when you are";
}

export function Dashboard() {
  const snapshot = useMonitorSnapshot();
  const [settings, setSettings] = useState<VeyaSettings>(() => storage.getSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [recalibrating, setRecalibrating] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [debug, setDebug] = useState(() => new URLSearchParams(location.search).get("debug") === "true");
  const [pastSessions, setPastSessions] = useState(() => storage.getSessions());

  useEffect(() => {
    monitoringService.setCalibration(storage.getCalibration());
    const initialSettings = storage.getSettings();
    monitoringService.setSettings(initialSettings);
    const demo = new URLSearchParams(location.search).get("demo") === "true";
    if (demo) monitoringService.startSimulation("normal");
    else if (initialSettings.monitoringEnabled) void monitoringService.start().catch(() => undefined);
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "d") setDebug((value) => !value);
    };
    window.addEventListener("keydown", keyboard);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", keyboard);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.appearance;
  }, [settings.appearance]);

  const sessionSeconds = snapshot.sessionStartedAt ? Math.max(0, (now - snapshot.sessionStartedAt) / 1_000) : 0;
  const timeline: TimelinePoint[] = snapshot.timeline.length ? snapshot.timeline : (pastSessions.at(-1)?.timeline ?? []);
  const recoverableError = ["camera-denied", "camera-unavailable", "model-error"].includes(snapshot.status);

  const toggleMonitoring = () => {
    const enabled = snapshot.status === "paused" || snapshot.status === "idle" || recoverableError;
    const next = { ...settings, monitoringEnabled: enabled };
    setSettings(next);
    storage.setSettings(next);
    monitoringService.setSettings(next);
    if (enabled) void monitoringService.start().catch(() => undefined);
    else monitoringService.pause();
  };

  const calibrated = (profile: CalibrationProfile) => {
    storage.setCalibration(profile);
    setRecalibrating(false);
  };

  return (
    <main className="app-shell">
      {!isTauri() && <WebReminder snapshot={snapshot} />}
      <header className="app-header" data-tauri-drag-region>
        <Brand compact />
        <div className="header-actions">
          <StatusPill status={snapshot.status} />
          <button className="icon-button" onClick={() => setShowSettings(true)} aria-label="Open settings"><Settings size={19} /></button>
        </div>
      </header>

      <motion.section className="dashboard" initial={false} animate={{ opacity: 1 }}>
        {recoverableError ? (
          <div className="error-state">
            <div className="feature-icon"><ShieldCheck size={28} /></div>
            <p className="eyebrow">tracking paused</p>
            <h1>Veya can’t see your eyes yet.</h1>
            <p>{snapshot.errorMessage ?? "Camera access is needed for local blink detection."}</p>
            <button className="button button-primary" onClick={toggleMonitoring}>Try again</button>
            <small>Your camera is processed only on this device.</small>
          </div>
        ) : (
          <>
            <div className="hero-status">
              <Eyes blinking={snapshot.status === "monitoring"} />
              <motion.h1 key={snapshot.status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>{statusCopy(snapshot.status)}</motion.h1>
              <div className="rate"><strong>{snapshot.rollingBlinkRate.toFixed(1)}</strong><span>blinks/min</span></div>
              {(snapshot.status === "no-face" || snapshot.status === "low-confidence") && <p className="subtle-status">Monitoring paused — Veya can’t clearly see your eyes.</p>}
            </div>

            <section className="today-section">
              <div className="section-heading"><span>TODAY</span><span className="local-badge"><ShieldCheck size={13} /> local only</span></div>
              <div className="stats-grid">
                <motion.div whileHover={{ y: -2 }}><strong>{snapshot.blinkCount.toLocaleString()}</strong><span>blinks</span></motion.div>
                <motion.div whileHover={{ y: -2 }}><strong>{snapshot.longestNoBlinkSeconds.toFixed(1)} s</strong><span>longest interval</span></motion.div>
                <motion.div whileHover={{ y: -2 }}><strong>{formatDuration(sessionSeconds)}</strong><span>this session</span></motion.div>
                <motion.div whileHover={{ y: -2 }}><strong>{snapshot.reminderCount}</strong><span>gentle nudges</span></motion.div>
              </div>
            </section>

            <section className="rhythm-section">
              <div className="section-heading"><span>BLINK RHYTHM</span><span>recent minutes</span></div>
              <BlinkChart points={timeline} />
            </section>

            <footer className="dashboard-footer">
              <span><ShieldCheck size={15} /> Your camera stays local.</span>
              <button className="pause-button" onClick={toggleMonitoring}>
                {snapshot.status === "paused" ? <Play size={15} /> : <Pause size={15} />}
                {snapshot.status === "paused" ? "Resume" : "Pause"}
              </button>
            </footer>
          </>
        )}
      </motion.section>

      <AnimatePresence>{showSettings && <SettingsPanel settings={settings} onSettings={setSettings} onClose={() => setShowSettings(false)} onRecalibrate={() => { setShowSettings(false); setRecalibrating(true); }} onDataDeleted={() => setPastSessions([])} />}</AnimatePresence>
      <AnimatePresence>{recalibrating && <div className="modal-backdrop"><motion.div className="modal-card" initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}><CalibrationPanel onComplete={calibrated} onCancel={() => setRecalibrating(false)} /></motion.div></div>}</AnimatePresence>
      {debug && <DebugPanel snapshot={snapshot} onClose={() => setDebug(false)} />}
    </main>
  );
}
