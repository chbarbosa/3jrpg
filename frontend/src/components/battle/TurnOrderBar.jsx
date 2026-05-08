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
    <div className="turn-order-bar">
      {turnOrder.map((id, i) => {
        const actor = resolveActor(id);
        const active = id === activeActorId;
        return (
          <div
            key={`${id}-${i}`}
            className="turn-order-item"
            style={{
              transform: active ? 'scale(1.25)' : 'scale(1)',
              transition: `transform ${theme.transitions.slow}`,
            }}
          >
            <div
              className="turn-order-avatar"
              style={{
                background: actor.color,
                border: `2px solid ${active ? theme.colors.highlight : 'transparent'}`,
                boxShadow: active ? theme.shadows.highlight : 'none',
                transition: `border-color ${theme.transitions.slow}, box-shadow ${theme.transitions.slow}`,
              }}
            />
            <div
              className="turn-order-name"
              style={{
                color: active ? theme.colors.textPrimary : theme.colors.textMuted,
                fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-normal)',
              }}
            >
              {actor.name.split(' ')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
