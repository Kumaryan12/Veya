import type { TimelinePoint } from "../types";

export function BlinkChart({ points }: { points: TimelinePoint[] }) {
  const values = points.length ? points.slice(-16).map((point) => point.blinksPerMinute) : [8, 11, 10, 15, 13, 14, 12, 16, 15, 13, 14, 12];
  const max = Math.max(20, ...values);
  const width = 640;
  const height = 100;
  const path = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (value / max) * (height - 16) - 8;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="chart-wrap" role="img" aria-label="Blink rate over the current session">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineFade" x1="0" x2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="0.3" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-strong)" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#lineFade)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {points.length === 0 && <span>your rhythm will appear here</span>}
    </div>
  );
}

