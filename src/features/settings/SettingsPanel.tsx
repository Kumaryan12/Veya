import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, Database, Eye, Moon, RefreshCw, ShieldCheck, Sun, Trash2 } from "lucide-react";
import { Button } from "../../components/Button";
import { storage } from "../../lib/storage";
import { monitoringService } from "../monitoring/MonitoringService";
import type { Appearance, ReminderSensitivity, VeyaSettings } from "../../types";

interface SettingsPanelProps {
  settings: VeyaSettings;
  onSettings: (settings: VeyaSettings) => void;
  onClose: () => void;
  onRecalibrate: () => void;
  onDataDeleted: () => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button type="button" className={`toggle ${checked ? "checked" : ""}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function SettingsPanel({ settings, onSettings, onClose, onRecalibrate, onDataDeleted }: SettingsPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = (patch: Partial<VeyaSettings>) => {
    const next = { ...settings, ...patch };
    storage.setSettings(next);
    monitoringService.setSettings(next);
    onSettings(next);
  };

  const deleteData = () => {
    storage.clearAll();
    const cleanSettings = storage.getSettings();
    storage.setSettings(cleanSettings);
    onSettings(cleanSettings);
    monitoringService.setCalibration(null);
    setConfirmDelete(false);
    onDataDeleted();
  };

  return (
    <motion.aside className="settings-panel" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} aria-label="Settings">
      <header className="settings-header">
        <button className="icon-button" onClick={onClose} aria-label="Close settings"><ChevronLeft /></button>
        <h2>Settings</h2>
        <span />
      </header>

      <div className="settings-scroll">
        <section className="settings-group">
          <div className="settings-label"><Eye size={16} /> Monitoring</div>
          <div className="setting-row">
            <div><strong>Eye monitoring</strong><span>Detect blinks while Veya is running</span></div>
            <Toggle label="Eye monitoring" checked={settings.monitoringEnabled} onChange={(monitoringEnabled) => update({ monitoringEnabled })} />
          </div>
          <button className="setting-action" onClick={onRecalibrate}><RefreshCw size={17} /><span><strong>Recalibrate</strong><small>Learn your eyes again</small></span><span>→</span></button>
        </section>

        <section className="settings-group">
          <div className="settings-label"><ShieldCheck size={16} /> Reminders</div>
          <div className="setting-row">
            <div><strong>Gentle reminders</strong><span>Show the top-center Veya nudge</span></div>
            <Toggle label="Gentle reminders" checked={settings.remindersEnabled} onChange={(remindersEnabled) => update({ remindersEnabled })} />
          </div>
          <div className="choice-setting">
            <strong>Sensitivity</strong>
            <div className="segmented-control">
              {(["gentle", "balanced", "proactive"] as ReminderSensitivity[]).map((value) => (
                <button key={value} className={settings.sensitivity === value ? "active" : ""} onClick={() => update({ sensitivity: value })}>{value}</button>
              ))}
            </div>
            <span>Changes how readily Veya responds to a dip in your personal blink rhythm.</span>
          </div>
        </section>

        <section className="settings-group">
          <div className="settings-label"><Sun size={16} /> Appearance</div>
          <div className="appearance-grid">
            {(["system", "light", "dark"] as Appearance[]).map((value) => (
              <button key={value} className={settings.appearance === value ? "active" : ""} onClick={() => update({ appearance: value })}>
                {value === "dark" ? <Moon size={17} /> : <Sun size={17} />}{value}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-group privacy-setting">
          <div className="settings-label"><Database size={16} /> Privacy & data</div>
          <div className="privacy-note"><ShieldCheck size={20} /><div><strong>Processed on this device</strong><p>Camera frames exist only for local inference and are never recorded. Veya stores your calibration, preferences, and aggregate session history in local app storage.</p></div></div>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Delete local data</Button>
        </section>

        <p className="disclaimer">Veya is a screen-wellbeing companion, not a medical device. It does not diagnose or treat any condition.</p>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div className="confirm-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="confirm-card" role="alertdialog" aria-labelledby="delete-title">
              <h3 id="delete-title">Delete local Veya data?</h3>
              <p>This removes calibration, settings, and session history from this device. It can’t be undone.</p>
              <div><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" onClick={deleteData}>Delete data</Button></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

