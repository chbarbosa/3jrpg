import { useRef, useState, useEffect } from 'react';

export default function HPBar({ current, max, showValues = false, ariaLabel = 'HP' }) {
  const prevRef = useRef(current);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (current < prevRef.current) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 250);
      prevRef.current = current;
      return () => clearTimeout(t);
    }
    prevRef.current = current;
  }, [current]);

  const pct = Math.max(0, Math.min(100, max > 0 ? (current / max) * 100 : 0));
  const critical = current <= max * 0.25;

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
        className="bar-track"
      >
        <div
          className={critical ? 'bar-fill bar-fill--hp-critical' : 'bar-fill bar-fill--hp'}
          style={{ width: `${pct}%` }}
        />
        <div
          className="bar-flash-overlay bar-flash-overlay--hp"
          style={{ opacity: flashing ? 0.5 : 0 }}
        />
      </div>
      {showValues && (
        <div className={critical ? 'bar-values bar-values--critical' : 'bar-values bar-values--normal'}>
          {current} / {max}
        </div>
      )}
    </div>
  );
}
