import { useRef, useState, useEffect } from 'react';
import { theme } from '../../styles/theme';

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
        style={{
          position: 'relative',
          height: '7px',
          background: theme.colors.barEmpty,
          borderRadius: theme.radius.pill,
          overflow: 'hidden',
        }}
      >
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: theme.colors.barEN,
          borderRadius: theme.radius.pill,
          transition: `width ${theme.transitions.slow}`,
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: theme.colors.barEN,
          opacity: flashing ? 0.4 : 0,
          transition: `opacity ${theme.transitions.normal}`,
          borderRadius: theme.radius.pill,
          pointerEvents: 'none',
        }} />
      </div>
      {showValues && (
        <div style={{
          fontSize: theme.fontSizes.xs,
          color: theme.colors.textMuted,
          marginTop: '2px',
          textAlign: 'right',
        }}>
          {current} / {max}
        </div>
      )}
    </div>
  );
}
