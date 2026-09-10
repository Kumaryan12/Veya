import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { EyeGlyph } from "../../components/Brand";
import type { MonitorSnapshot, ReminderLevel } from "../../types";

type WebReminderLevel = ReminderLevel | "ACKNOWLEDGED";

export function WebReminder({ snapshot }: { snapshot: MonitorSnapshot }) {
  const [visibleLevel, setVisibleLevel] = useState<WebReminderLevel>(snapshot.reminderLevel);
  const previousReminder = useRef<ReminderLevel>(snapshot.reminderLevel);
  const previousBlink = useRef<number | null>(snapshot.lastBlinkAt);

  useEffect(() => {
    const blinked = snapshot.lastBlinkAt !== null && snapshot.lastBlinkAt !== previousBlink.current;
    if (blinked && previousReminder.current !== "NONE") {
      setVisibleLevel("ACKNOWLEDGED");
      const timer = window.setTimeout(() => setVisibleLevel("NONE"), 650);
      previousBlink.current = snapshot.lastBlinkAt;
      previousReminder.current = "NONE";
      return () => window.clearTimeout(timer);
    }
    previousBlink.current = snapshot.lastBlinkAt;
    previousReminder.current = snapshot.reminderLevel;
    setVisibleLevel(snapshot.reminderLevel);
  }, [snapshot.lastBlinkAt, snapshot.reminderLevel]);

  const compact = visibleLevel === "AMBIENT";
  return (
    <div className="web-reminder" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait">
        {visibleLevel !== "NONE" && (
          <motion.div
            key={visibleLevel}
            className={`reminder-capsule reminder-${visibleLevel.toLowerCase()} ${compact ? "compact" : ""}`}
            initial={{ opacity: 0, y: -12, scale: 0.84 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            {visibleLevel === "ACKNOWLEDGED" ? <Check size={20} /> : <EyeGlyph active={visibleLevel === "NUDGE" || visibleLevel === "REMINDER"} size={compact ? 26 : 31} />}
            {visibleLevel === "REMINDER" && <span>Blink</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
