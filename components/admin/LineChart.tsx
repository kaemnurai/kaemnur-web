// Inline SVG line chart. No external deps — keeps the bundle lean. Matches
// the reference: orange line (#F4B400) over dark grid, gradient fill below,
// dotted markers at sampled points, left-side y-axis ticks.

type Props = {
  data: number[];
  height?: number;
  yLabel?: (v: number) => string;
};

export function LineChart({ data, height = 220, yLabel = (v) => String(v) }: Props) {
  if (data.length < 2) {
    return (
      <div
        className="grid place-items-center rounded-btn border border-dashed border-line text-[12px] text-fg-muted"
        style={{ height }}
      >
        Not enough data yet
      </div>
    );
  }

  const W = 800;
  const H = height;
  const PADDING = { top: 12, right: 12, bottom: 24, left: 56 };
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Convert data point to (x,y) inside the inner area
  const toPoint = (v: number, i: number): [number, number] => {
    const x = PADDING.left + (innerW * i) / (data.length - 1);
    const y = PADDING.top + innerH - ((v - min) / range) * innerH;
    return [x, y];
  };

  const points = data.map(toPoint);
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0]},${
    PADDING.top + innerH
  } L${points[0][0]},${PADDING.top + innerH} Z`;

  // Three y-axis ticks: min, mid, max
  const ticks = [min, min + range / 2, max];
  const tickY = (v: number) =>
    PADDING.top + innerH - ((v - min) / range) * innerH;

  // Sample every Nth point as a dot marker to keep it light
  const sampleEvery = Math.max(1, Math.floor(data.length / 8));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Trend line chart"
    >
      <defs>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4B400" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F4B400" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={PADDING.left}
          x2={W - PADDING.right}
          y1={tickY(t)}
          y2={tickY(t)}
          stroke="#2A2F3E"
          strokeDasharray="2 4"
          strokeWidth="1"
        />
      ))}

      {/* Y axis labels */}
      {ticks.map((t, i) => (
        <text
          key={i}
          x={PADDING.left - 8}
          y={tickY(t) + 4}
          textAnchor="end"
          className="fill-fg-muted"
          style={{ fontSize: 11, fontFamily: "ui-monospace,monospace" }}
        >
          {yLabel(t)}
        </text>
      ))}

      {/* Area under line */}
      <path d={areaPath} fill="url(#lc-fill)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#F4B400"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dot markers */}
      {points.map(([x, y], i) =>
        i % sampleEvery === 0 || i === points.length - 1 ? (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#F4B400" />
        ) : null
      )}
    </svg>
  );
}
