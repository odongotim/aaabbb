import React, { useEffect, useState } from 'react';

function getRemaining(targetIso) {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(target - now, 0);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff === 0
  };
}

/** Counts down to targetIso (voting start if not started, else voting end). */
export default function Countdown({ targetIso, label }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetIso));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!targetIso) return null;

  return (
    <div className="countdown" role="timer" aria-live="polite">
      <p className="countdown__label">{label}</p>
      <div className="countdown__digits">
        {[
          ['Days', remaining.days],
          ['Hours', remaining.hours],
          ['Minutes', remaining.minutes],
          ['Seconds', remaining.seconds]
        ].map(([unit, value]) => (
          <div className="countdown__unit" key={unit}>
            <span className="countdown__value">{String(value).padStart(2, '0')}</span>
            <span className="countdown__unit-label">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
