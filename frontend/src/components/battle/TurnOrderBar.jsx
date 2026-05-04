import { theme } from '../../styles/theme';

export default function TurnOrderBar({ turnOrder, activeActorId, heroes, enemies }) {
  function resolveActor(id) {
    const hero = heroes.find((h) => h.id === id);
    if (hero) {
      return {
        name: hero.name,
        color: theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted,
      };
    }
    const enemy = enemies.find((e) => e.id === id);
    if (enemy) {
      return {
        name: enemy.name,
        color: theme.enemyColors[enemy.enemyType] ?? theme.colors.textMuted,
      };
    }
    return { name: id, color: theme.colors.textMuted };
  }

  return (
    <div style={{
      display: 'flex',
      gap: theme.spacing.sm,
      overflowX: 'auto',
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      alignItems: 'flex-end',
      scrollbarWidth: 'thin',
    }}>
      {turnOrder.map((id, i) => {
        const actor = resolveActor(id);
        const active = id === activeActorId;
        return (
          <div
            key={`${id}-${i}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              flexShrink: 0,
              transform: active ? 'scale(1.25)' : 'scale(1)',
              transition: `transform ${theme.transitions.slow}`,
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: actor.color,
              border: `2px solid ${active ? theme.colors.highlight : 'transparent'}`,
              boxShadow: active ? theme.shadows.highlight : 'none',
              transition: `box-shadow ${theme.transitions.slow}, border-color ${theme.transitions.slow}`,
            }} />
            <div style={{
              fontSize: '9px',
              color: active ? theme.colors.textPrimary : theme.colors.textMuted,
              maxWidth: '40px',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: active ? theme.fontWeights.bold : theme.fontWeights.normal,
            }}>
              {actor.name.split(' ')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
