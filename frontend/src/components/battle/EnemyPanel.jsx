import { theme } from '../../styles/theme';
import HPBar from './HPBar';
import StatusBadge from './StatusBadge';

export default function EnemyPanel({ enemy, isTargeted, onClick }) {
  const defeated = enemy.hp <= 0;
  const clickable = !!onClick && !defeated;
  const nameLen = enemy.name?.length ?? 0;
  let nameFontSize = 'var(--fs-sm)';
  let nameTextStyle = {};
  if (nameLen > 18) {
    nameFontSize = '0.65rem';
    nameTextStyle = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
  } else if (nameLen > 12) {
    nameFontSize = 'var(--fs-xs)';
  }

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className="enemy-panel"
      style={{
        border: `${isTargeted ? 2 : 1}px solid ${isTargeted ? theme.colors.highlight : theme.colors.borderBrown}`,
        boxShadow: isTargeted ? theme.shadows.highlight : theme.shadows.panel,
        opacity: defeated ? 0.35 : 1,
        filter: defeated ? 'grayscale(1)' : 'none',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div
        className="enemy-shape"
        style={{ background: theme.enemyColors[enemy.enemyType] ?? theme.colors.textMuted }}
      />

      <div className="enemy-name-wrapper">
        <div
          className="enemy-name"
          style={{ fontSize: nameFontSize, ...nameTextStyle }}
        >
          {enemy.name}
        </div>
      </div>

      <div className="enemy-hp-bar">
        <HPBar current={enemy.hp} max={enemy.maxHp} />
      </div>

      {enemy.statuses.length > 0 && (
        <div className="enemy-statuses">
          {enemy.statuses.map((s) => (
            <StatusBadge key={s.statusName} statusName={s.statusName} turnsRemaining={s.turnsRemaining} />
          ))}
        </div>
      )}
    </div>
  );
}
