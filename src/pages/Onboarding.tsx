import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { Brand, EyeGlyph } from "../components/Brand";
import { Button } from "../components/Button";
import { CalibrationPanel } from "../features/calibration/CalibrationPanel";
import { monitoringService } from "../features/monitoring/MonitoringService";
import { isTauri } from "../features/reminders/overlayBridge";
import { storage } from "../lib/storage";
import type { CalibrationProfile } from "../types";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const [requesting, setRequesting] = useState(false);

  const requestCamera = async () => {
    setRequesting(true);
    setCameraError("");
    try {
      await monitoringService.start();
      setStep(3);
    } catch {
      setCameraError("Veya couldn’t access your camera. Check System Settings → Privacy & Security → Camera, then try again.");
    } finally {
      setRequesting(false);
    }
  };

  const calibrationComplete = (profile: CalibrationProfile) => {
    storage.setCalibration(profile);
    setStep(4);
  };

  const finish = () => {
    storage.completeOnboarding();
    onComplete();
  };

  return (
    <main className="onboarding-shell">
      <div className="onboarding-top"><Brand /></div>
      <AnimatePresence mode="wait" initial={false}>
        {step === 0 && (
          <motion.section className="onboarding-card" key="welcome" initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="hero-eyes"><EyeGlyph size={92} /></div>
            <p className="eyebrow">meet veya</p>
            <h1>A quiet reminder<br />for your eyes.</h1>
            <p className="lede">A tiny {isTauri() ? "desktop" : "screen"} companion that notices prolonged staring and gently reminds you to blink.</p>
            <Button onClick={() => setStep(1)}>Begin <span aria-hidden="true">→</span></Button>
          </motion.section>
        )}
        {step === 1 && (
          <motion.section className="onboarding-card" key="privacy" initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="feature-icon"><ShieldCheck size={28} /></div>
            <p className="eyebrow">private by design</p>
            <h1>Your camera stays<br />on your device.</h1>
            <p className="lede">Veya processes eye movement locally. No video, photos, or facial landmarks are recorded or uploaded.</p>
            <div className="privacy-row"><LockKeyhole size={16} /><span>Only aggregate session statistics are saved locally.</span></div>
            <Button onClick={() => setStep(2)}>Continue <span aria-hidden="true">→</span></Button>
          </motion.section>
        )}
        {step === 2 && (
          <motion.section className="onboarding-card" key="camera" initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="feature-icon"><Camera size={27} /></div>
            <p className="eyebrow">one permission</p>
            <h1>Let Veya see<br />when you blink.</h1>
            <p className="lede">Camera access powers private, on-device eye tracking. You can pause it anytime.</p>
            {cameraError && <div className="inline-error" role="alert">{cameraError}</div>}
            <Button onClick={requestCamera} disabled={requesting}>{requesting ? "Starting local tracking…" : "Allow camera"}</Button>
            <small className="microcopy"><ShieldCheck size={14} /> Nothing leaves this device</small>
          </motion.section>
        )}
        {step === 3 && (
          <motion.div key="calibration" className="onboarding-card calibration-card" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CalibrationPanel onComplete={calibrationComplete} />
          </motion.div>
        )}
        {step === 4 && (
          <motion.section className="onboarding-card" key="ready" initial={false} animate={{ opacity: 1, scale: 1 }}>
            <div className="success-orb"><Check size={28} /></div>
            <p className="eyebrow">you’re ready</p>
            <h1>Veya will stay<br />out of your way.</h1>
            <p className="lede">When your blink rhythm dips, a gentle reminder will appear near your camera—and vanish as soon as you blink.</p>
            <Button onClick={finish}>Open Veya</Button>
          </motion.section>
        )}
      </AnimatePresence>
      <div className="step-indicator" aria-label={`Step ${step + 1} of 5`}>
        {[0, 1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? "active" : ""} />)}
      </div>
    </main>
  );
}
