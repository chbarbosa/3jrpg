import { useState } from 'react';
import { theme } from '../../styles/theme';
import { STATUS_EFFECTS } from '../../data/statusEffects';

const ABBREV = {
  poison: 'PSN', burn: 'BRN', bleed: 'BLD', frozen: 'FRZ',
  stun: 'STN', slow: 'SLW', silence: 'SIL', blind: 'BLN',
  curse: 'CRS', regen: 'REG', haste: 'HST', shell: 'SHL',
};

export default function StatusBadge({ statusName, turnsRemaining }) {
  const [hovered, setHovered] = useState(false);
  const data = STATUS_EFFECTS[statusName] ?? null;
  const color = data?.colorKey ?? theme.colors.textMuted;
  const positive = data?.type === 'positive';
  const label = ABBREV[statusName] ?? statusName.slice(0, 3).toUpperCase();

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          padding: '1px 5px',
          borderRadius: theme.radius.pill,
          border: `1px solid ${positive ? theme.colors.statusPositive : color}`,
          background: `${color}22`,
          fontSize: '10px',
          fontWeight: theme.fontWeights.bold,
          color: positive ? theme.colors.statusPositive : color,
          cursor: 'default',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        {turnsRemaining > 0 && (
          <span style={{ opacity: 0.7, fontWeight: theme.fontWeights.normal }}>
            {turnsRemaining}
          </span>
        )}
      </div>

      {hovered && data && (
        <div style={{
          position: 'absolute',
          bottom: '120%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: theme.colors.bgPanel,
          border: `1px solid ${theme.colors.borderGold}`,
          borderRadius: theme.radius.sm,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          boxShadow: theme.shadows.panel,
          minWidth: '160px',
          maxWidth: '220px',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          <div style={{
            fontWeight: theme.fontWeights.bold,
            fontSize: theme.fontSizes.xs,
            color: color,
            marginBottom: '2px',
            fontFamily: theme.fonts.header,
          }}>
            {statusName.charAt(0).toUpperCase() + statusName.slice(1)}
          </div>
          <div style={{
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textMuted,
            lineHeight: 1.4,
          }}>
            {data.description}
          </div>
        </div>
      )}
    </div>
  );
}
