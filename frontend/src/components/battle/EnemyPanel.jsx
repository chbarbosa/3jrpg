import { theme } from '../../styles/theme';
import HPBar from './HPBar';
import StatusBadge from './StatusBadge';

export default function EnemyPanel({ enemy, isTargeted, onClick }) {
  const defeated = enemy.hp <= 0;
  const clickable = !!onClick && !defeated;

  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
        background: theme.colors.bgPanel,
        border: `${isTargeted ? 2 : 1}px solid ${isTargeted ? theme.colors.highlight : theme.colors.borderBrown}`,
        borderRadius: theme.radius.md,
        boxShadow: isTargeted ? theme.shadows.highlight : theme.shadows.panel,
        opacity: defeated ? 0.35 : 1,
        filter: defeated ? 'grayscale(1)' : 'none',
        cursor: clickable ? 'pointer' : 'default',
        width: '100px',
        transition: `opacity ${theme.transitions.fast}, border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}`,
      }}
    >
      <div style={{
        width: '80px',
        height: '80px',
        background: theme.enemyColors[enemy.enemyType] ?? theme.colors.textMuted,
        borderRadius: theme.radius.md,
        flexShrink: 0,
      }} />

      <div style={{
        fontFamily: theme.fonts.body,
        fontWeight: theme.fontWeights.bold,
        fontSize: theme.fontSizes.xs,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        height: '20px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '80px',
        width: '80px',
      }}>
        {enemy.name}
      </div>

      <div style={{ width: '80px' }}>
        <HPBar current={enemy.hp} max={enemy.maxHp} />
      </div>

      {enemy.statuses.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '3px',
          justifyContent: 'center',
          maxWidth: '80px',
        }}>
          {enemy.statuses.map((s) => (
            <StatusBadge key={s.statusName} statusName={s.statusName} turnsRemaining={s.turnsRemaining} />
          ))}
        </div>
      )}
    </div>
  );
}
