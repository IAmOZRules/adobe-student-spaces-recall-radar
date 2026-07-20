"use client";

import { CONCEPTS } from "@/lib/questions";

type Stats = Record<string, { correct: number; total: number }>;

export default function RadarChart({ stats }: { stats: Stats }) {
  const size = 300;
  const center = size / 2;
  const maxR = 108;
  const n = CONCEPTS.length;
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const rings = [0.25, 0.5, 0.75, 1].map((f, ringIdx) => {
    const pts = CONCEPTS.map((_c, i) => {
      const a = angleFor(i);
      const x = center + Math.cos(a) * maxR * f;
      const y = center + Math.sin(a) * maxR * f;
      return `${x},${y}`;
    }).join(" ");
    return <polygon key={ringIdx} points={pts} fill="none" stroke="#E7E4DE" strokeWidth="1" />;
  });

  const spokes = CONCEPTS.map((_c, i) => {
    const a = angleFor(i);
    const x2 = center + Math.cos(a) * maxR;
    const y2 = center + Math.sin(a) * maxR;
    return <line key={i} x1={center} y1={center} x2={x2} y2={y2} stroke="#E7E4DE" strokeWidth="1" />;
  });

  const labels = CONCEPTS.map((c, i) => {
    const a = angleFor(i);
    const lx = center + Math.cos(a) * (maxR + 34);
    const ly = center + Math.sin(a) * (maxR + 34);
    const parts = c.label.split(" ");
    const shortLabel = parts[0] + (parts[1] && parts[1].length < 4 ? " " + parts[1] : "");
    return (
      <text
        key={c.id}
        x={lx}
        y={ly}
        fontSize="10.5"
        fontWeight="700"
        fill="#63605C"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {shortLabel}
      </text>
    );
  });

  const dataPts = CONCEPTS.map((c) => {
    const s = stats[c.id];
    const frac = s && s.total ? s.correct / s.total : 0.06;
    return frac;
  });

  const dataPtsStr = CONCEPTS.map((c, i) => {
    const frac = dataPts[i];
    const a = angleFor(i);
    const x = center + Math.cos(a) * maxR * frac;
    const y = center + Math.sin(a) * maxR * frac;
    return `${x},${y}`;
  }).join(" ");

  const dots = CONCEPTS.map((c, i) => {
    const frac = dataPts[i];
    const a = angleFor(i);
    const x = center + Math.cos(a) * maxR * frac;
    const y = center + Math.sin(a) * maxR * frac;
    return <circle key={c.id} cx={x} cy={y} r="4" fill="#EB1000" />;
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size + 30}`}
      width="280"
      height="308"
      role="img"
      aria-label="Radar chart of concept strength"
    >
      {rings}
      {spokes}
      <polygon points={dataPtsStr} fill="rgba(235,16,0,0.16)" stroke="#EB1000" strokeWidth="2.5" />
      {dots}
      {labels}
    </svg>
  );
}
