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
    <div className="status-badge-wrapper">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="status-badge"
        style={{
          border: `1px solid ${positive ? theme.colors.statusPositive : color}`,
          background: `${color}22`,
          color: positive ? theme.colors.statusPositive : color,
        }}
      >
        {label}
        {turnsRemaining > 0 && (
          <span className="status-badge-turns">
            {turnsRemaining}
          </span>
        )}
      </div>

      {hovered && data && (
        <div className="status-tooltip">
          <div className="status-tooltip-name" style={{ color }}>
            {statusName.charAt(0).toUpperCase() + statusName.slice(1)}
          </div>
          <div className="status-tooltip-desc">
            {data.description}
          </div>
        </div>
      )}
    </div>
  );
}
