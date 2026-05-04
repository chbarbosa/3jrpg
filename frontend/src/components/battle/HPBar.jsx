import { theme } from '../../styles/theme';

export default function HPBar({ current, max, showValues = false }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (current / max) * 100 : 0));
  const critical = current <= max * 0.25;
  const fill = critical ? theme.colors.statusBleed : theme.colors.barHP;

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
          background: fill,
          borderRadius: theme.radius.pill,
          transition: `width ${theme.transitions.normal}, background ${theme.transitions.fast}`,
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
