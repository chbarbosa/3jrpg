import { theme } from '../../styles/theme';
import { ENEMY_TYPE_LABELS, ENEMY_TYPE_NOTES } from '../../data/enemies';
import HPBar from './HPBar';
import StatusBadge from './StatusBadge';

export default function EnemyPanel({ enemy, isTargeted, onClick, showScan = false }) {
  const defeated = enemy.defeated ?? enemy.hp <= 0;
  const clickable = !!onClick && !defeated;
  const hasExactHp = enemy.hp != null && enemy.maxHp != null;
  const showExactHp = showScan && hasExactHp;
  const inferredHpPercent = enemy.hpPercent ?? (defeated ? 0 : 100);
  const hpBarCurrent = hasExactHp ? enemy.hp : inferredHpPercent;
  const hpBarMax = hasExactHp ? enemy.maxHp : 100;
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
        style={{
          height: '16px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: theme.enemyColors[enemy.enemyType] ?? theme.colors.textMuted,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: 1,
          }}
        >
          {ENEMY_TYPE_LABELS[enemy.enemyType] ?? enemy.enemyType ?? ''}
        </span>
        {ENEMY_TYPE_NOTES[enemy.enemyType] && (
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize: '0.6rem',
              color: theme.colors.textMuted,
              opacity: 0.75,
              lineHeight: 1,
            }}
          >
            {ENEMY_TYPE_NOTES[enemy.enemyType]}
          </span>
        )}
      </div>

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
        <HPBar
          current={hpBarCurrent}
          max={hpBarMax}
          showValues={showExactHp}
          ariaLabel={showExactHp ? 'Enemy HP' : 'Enemy remaining HP'}
        />
      </div>

      {showExactHp && (
        <div className="enemy-scan-info">
          <span>Weak: {enemy.weaknesses?.length > 0 ? enemy.weaknesses.join(', ') : 'None'}</span>
          {enemy.elementalImmunity?.length > 0 && (
            <span>Immune: {enemy.elementalImmunity.join(', ')}</span>
          )}
        </div>
      )}

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
