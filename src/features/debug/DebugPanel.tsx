import { Bug, EyeOff, Timer, X } from "lucide-react";
import { monitoringService } from "../monitoring/MonitoringService";
import type { MonitorSnapshot } from "../../types";

export function DebugPanel({ snapshot, onClose }: { snapshot: MonitorSnapshot; onClose: () => void }) {
  const metric = snapshot.metrics;
  const rows: [string, string][] = [
    ["FPS", snapshot.fps.toFixed(1)],
    ["faceDetected", String(snapshot.faceDetected)],
    ["confidence", (metric?.confidence ?? 0).toFixed(3)],
    ["leftEyeOpenness", (metric?.leftOpenness ?? 0).toFixed(3)],
    ["rightEyeOpenness", (metric?.rightOpenness ?? 0).toFixed(3)],
    ["averageOpenness", (metric?.averageOpenness ?? 0).toFixed(3)],
    ["blinkState", snapshot.blinkState],
    ["blinkCount", String(snapshot.blinkCount)],
    ["rollingBlinkRate", snapshot.rollingBlinkRate.toFixed(1)],
    ["reminderScore", snapshot.reminderScore.toFixed(3)],
    ["reminderLevel", snapshot.reminderLevel],
  ];
  return (
    <aside className="debug-panel">
      <header><span><Bug size={15} /> developer panel</span><button onClick={onClose} aria-label="Close debug panel"><X size={15} /></button></header>
      <dl>{rows.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
      <div className="debug-actions">
        <button onClick={() => monitoringService.simulateBlink()}>Simulate blink</button>
        <button onClick={() => monitoringService.startSimulation("normal")}>Normal rhythm</button>
        <button onClick={() => monitoringService.startSimulation("prolonged-stare")}><Timer size={13} /> Prolonged stare</button>
        <button onClick={() => monitoringService.startSimulation("no-face")}><EyeOff size={13} /> No face</button>
        <button onClick={() => monitoringService.startSimulation("low-confidence")}>Low confidence</button>
      </div>
    </aside>
  );
}

