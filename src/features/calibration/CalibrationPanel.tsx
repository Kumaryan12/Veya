import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "../../components/Button";
import { EyeGlyph } from "../../components/Brand";
import { CALIBRATION_CONFIG } from "../../lib/config";
import { calculateCalibration } from "./calibration";
import { monitoringService } from "../monitoring/MonitoringService";
import type { CalibrationProfile, EyeMetrics } from "../../types";

type Phase = "open" | "blink" | "complete" | "failed";

interface CalibrationPanelProps {
  onComplete: (profile: CalibrationProfile) => void;
  onCancel?: () => void;
}

function sampleMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function CalibrationPanel({ onComplete, onCancel }: CalibrationPanelProps) {
  const [phase, setPhase] = useState<Phase>("open");
  const [progress, setProgress] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [error, setError] = useState("");
  const phaseRef = useRef<Phase>("open");
  const openSamples = useRef<number[]>([]);
  const closedSamples = useRef<number[]>([]);
  const closedEpisode = useRef(false);
  const episodeMinimum = useRef(Infinity);

  const changePhase = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const reset = () => {
    openSamples.current = [];
    closedSamples.current = [];
    closedEpisode.current = false;
    episodeMinimum.current = Infinity;
    setProgress(0);
    setBlinkCount(0);
    setError("");
    changePhase("open");
  };

  useEffect(() => {
    const ingest = (metrics: EyeMetrics | null) => {
      if (!metrics || metrics.confidence < 0.62) return;
      if (phaseRef.current === "open") {
        openSamples.current.push(metrics.averageOpenness);
        const target = Math.max(CALIBRATION_CONFIG.requiredOpenSamples, 42);
        setProgress(Math.min(1, openSamples.current.length / target));
        if (openSamples.current.length >= target) changePhase("blink");
        return;
      }
      if (phaseRef.current !== "blink") return;

      const baseline = sampleMedian(openSamples.current);
      const closesBelow = baseline * CALIBRATION_CONFIG.closureRatioFromOpen;
      const reopensAbove = baseline * 0.8;
      if (metrics.averageOpenness < closesBelow) {
        closedEpisode.current = true;
        episodeMinimum.current = Math.min(episodeMinimum.current, metrics.averageOpenness);
      } else if (closedEpisode.current && metrics.averageOpenness > reopensAbove) {
        closedEpisode.current = false;
        closedSamples.current.push(episodeMinimum.current);
        episodeMinimum.current = Infinity;
        const count = closedSamples.current.length;
        setBlinkCount(count);
        if (count >= CALIBRATION_CONFIG.requiredBlinks) {
          try {
            const profile = calculateCalibration(openSamples.current, closedSamples.current);
            monitoringService.setCalibration(profile);
            changePhase("complete");
            window.setTimeout(() => onComplete(profile), 650);
          } catch (calibrationError) {
            setError(calibrationError instanceof Error ? calibrationError.message : "Calibration needs another try.");
            changePhase("failed");
          }
        }
      }
    };
    return monitoringService.subscribeMetrics(ingest);
  }, [onComplete]);

  return (
    <section className="calibration-panel" aria-live="polite">
      <AnimatePresence mode="wait">
        {phase === "open" && (
          <motion.div key="open" className="calibration-content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="calibration-eye"><EyeGlyph active={false} size={72} /></div>
            <p className="eyebrow">calibration · 1 of 2</p>
            <h2>Let’s learn your eyes.</h2>
            <p>Look naturally at your screen for a moment while Veya learns your open-eye range.</p>
            <div className="progress-track" aria-label={`${Math.round(progress * 100)}% complete`}><motion.div animate={{ width: `${progress * 100}%` }} /></div>
            <small>Keep your face comfortably centered</small>
          </motion.div>
        )}
        {phase === "blink" && (
          <motion.div key="blink" className="calibration-content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="calibration-eye"><EyeGlyph active size={72} /></div>
            <p className="eyebrow">calibration · 2 of 2</p>
            <h2>Blink naturally three times.</h2>
            <p>No need to exaggerate. Blink at your normal pace.</p>
            <div className="blink-dots" aria-label={`${blinkCount} of 3 blinks detected`}>
              {[0, 1, 2].map((index) => <span key={index} className={index < blinkCount ? "filled" : ""}>{index < blinkCount && <Check size={17} />}</span>)}
            </div>
            <small>{blinkCount === 0 ? "Ready when you are" : `${blinkCount} blink${blinkCount === 1 ? "" : "s"} detected`}</small>
          </motion.div>
        )}
        {phase === "complete" && (
          <motion.div key="complete" className="calibration-content" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="success-orb"><Check size={28} /></div>
            <p className="eyebrow">calibrated</p>
            <h2>That’s all we needed.</h2>
            <p>Your reminder threshold is now tuned to your natural eyes.</p>
          </motion.div>
        )}
        {phase === "failed" && (
          <motion.div key="failed" className="calibration-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="calibration-eye"><RotateCcw size={32} /></div>
            <p className="eyebrow">let’s try once more</p>
            <h2>We lost the rhythm.</h2>
            <p>{error}</p>
            <Button onClick={reset}><RotateCcw size={16} /> Try again</Button>
          </motion.div>
        )}
      </AnimatePresence>
      {onCancel && phase !== "complete" && <Button variant="quiet" onClick={onCancel}>Cancel</Button>}
    </section>
  );
}
