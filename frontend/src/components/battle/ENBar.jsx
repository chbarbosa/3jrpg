import { theme } from '../../styles/theme';

export default function ENBar({ current, max, showValues = false }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (current / max) * 100 : 0));

  return (
    <div>
      <div style={{
        height: '7px',
        background: theme.colors.barEmpty,
        borderRadius: theme.radius.pill,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: theme.colors.barEN,
          borderRadius: theme.radius.pill,
          transition: `width ${theme.transitions.normal}`,
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
