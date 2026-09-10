import { motion } from "motion/react";

export function EyeGlyph({ active = false, size = 48 }: { active?: boolean; size?: number }) {
  return (
    <motion.svg
      aria-hidden="true"
      width={size}
      height={size * 0.62}
      viewBox="0 0 64 40"
      fill="none"
      animate={active ? { scaleY: [1, 0.12, 1] } : { scaleY: 1 }}
      transition={active ? { duration: 0.32, repeat: Infinity, repeatDelay: 3.2 } : { duration: 0.2 }}
    >
      <path d="M4 20C11.5 9.8 20.8 5 32 5s20.5 4.8 28 15c-7.5 10.2-16.8 15-28 15S11.5 30.2 4 20Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="20" r="6" fill="currentColor" />
    </motion.svg>
  );
}

export function Eyes({ blinking = false }: { blinking?: boolean }) {
  return (
    <div className="eyes" aria-hidden="true">
      <EyeGlyph active={blinking} size={58} />
      <EyeGlyph active={blinking} size={58} />
    </div>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={compact ? "brand brand-compact" : "brand"}>veya</span>;
}

