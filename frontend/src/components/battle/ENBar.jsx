import { useRef, useState, useEffect } from 'react';

export default function ENBar({ current, max, showValues = false }) {
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

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label="EN"
        className="bar-track"
      >
        <div
          className="bar-fill bar-fill--en"
          style={{ width: `${pct}%` }}
        />
        <div
          className="bar-flash-overlay bar-flash-overlay--en"
          style={{ opacity: flashing ? 0.4 : 0 }}
        />
      </div>
      {showValues && (
        <div className="bar-values bar-values--normal">
          {current} / {max}
        </div>
      )}
    </div>
  );
}
