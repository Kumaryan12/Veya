import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { EyeGlyph } from "../../components/Brand";
import type { OverlayPayload } from "./overlayBridge";

type OverlayState = OverlayPayload["level"];

export function Overlay() {
  const [level, setLevel] = useState<OverlayState>("NONE");

  useEffect(() => {
    let dispose: (() => void) | undefined;
    void import("@tauri-apps/api/event").then(async ({ listen }) => {
      dispose = await listen<OverlayPayload>("veya-overlay", (event) => setLevel(event.payload.level));
    });
    return () => dispose?.();
  }, []);

  const compact = level === "AMBIENT";
  const acknowledged = level === "ACKNOWLEDGED";
  return (
    <main className="overlay-shell" aria-live="polite">
      <AnimatePresence mode="wait">
        {level !== "NONE" && (
          <motion.div
            key={level}
            className={`reminder-capsule reminder-${level.toLowerCase()} ${compact ? "compact" : ""}`}
            initial={{ opacity: 0, y: -10, scale: 0.84 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            {acknowledged ? <Check size={20} strokeWidth={2.5} /> : <EyeGlyph active={level === "NUDGE" || level === "REMINDER"} size={compact ? 26 : 31} />}
            {level === "REMINDER" && <span>Blink</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

