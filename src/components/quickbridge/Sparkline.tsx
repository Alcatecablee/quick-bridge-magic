interface SparklineProps {
  samples: number[];
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

// Compact SVG sparkline rendering recent throughput samples. Designed to sit
// beside the StatusBadge: ~80px wide, 24px tall, no axis labels.
export function Sparkline({
  samples,
  width = 80,
  height = 24,
  className,
  ariaLabel = "Throughput",
}: SparklineProps) {
  if (samples.length === 0) return null;
  const max = Math.max(1, ...samples);
  const n = samples.length;
  const pad = 1;
  const step = n > 1 ? (width - pad * 2) / (n - 1) : 0;
  const points = samples.map((v, i) => {
    const x = pad + i * step;
    const y = height - pad - (v / max) * (height - pad * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const areaPoints = `${pad},${height - pad} ${points.join(" ")} ${(pad + (n - 1) * step).toFixed(2)},${height - pad}`;
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
    >
      <polyline points={areaPoints} fill="var(--color-primary)" opacity="0.18" stroke="none" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
