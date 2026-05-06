import { useRef, useState, useEffect } from 'react';
import { theme } from '../../styles/theme';

export default function HPBar({ current, max, showValues = false }) {
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
  const fill = critical ? theme.colors.statusBleed : theme.colors.barHP;

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label="HP"
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
          background: fill,
          borderRadius: theme.radius.pill,
          transition: `width ${theme.transitions.slow}, background ${theme.transitions.fast}`,
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: theme.colors.statusBleed,
          opacity: flashing ? 0.5 : 0,
          transition: `opacity ${theme.transitions.normal}`,
          borderRadius: theme.radius.pill,
          pointerEvents: 'none',
        }} />
      </div>
      {showValues && (
        <div style={{
          fontSize: theme.fontSizes.xs,
          color: critical ? theme.colors.statusBleed : theme.colors.textMuted,
          marginTop: '2px',
          textAlign: 'right',
          transition: `color ${theme.transitions.fast}`,
        }}>
          {current} / {max}
        </div>
      )}
    </div>
  );
}
