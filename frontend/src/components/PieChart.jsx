import React from 'react';

const COLORS = ['#0066FF', '#FFEE00', '#000000', '#5C8DFF', '#B8A600', '#4A4A42', '#8FB2FF', '#D9CE5C'];

/** Minimal, undecorated pie chart. data: [{ label, value }] */
export default function PieChart({ data, size = 260 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <p>No votes recorded for this day yet.</p>;
  }

  const radius = size / 2;
  let angle = -90;
  const slices = data.map((d, i) => {
    const fraction = d.value / total;
    const startAngle = angle;
    const endAngle = angle + fraction * 360;
    angle = endAngle;
    const path = describeArc(radius, radius, radius, startAngle, endAngle);
    return { path, color: COLORS[i % COLORS.length], label: d.label, value: d.value, fraction };
  });

  return (
    <div className="pie-chart">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Vote distribution pie chart">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} />
        ))}
      </svg>
      <ul className="pie-chart__legend">
        {slices.map((s, i) => (
          <li key={i}>
            <span className="pie-chart__swatch" style={{ background: s.color }} />
            {s.label} — {s.value} votes ({Math.round(s.fraction * 1000) / 10}%)
          </li>
        ))}
      </ul>
    </div>
  );
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', cx, cy, 'L', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'Z'].join(' ');
}
