import { theme } from '../../styles/theme';
import HPBar from '../battle/HPBar';
import ENBar from '../battle/ENBar';

export default function RegenDisplay({ regenLog, heroes, autoRevivedHeroes }) {
  const revivedSet = new Set((autoRevivedHeroes ?? []).map((h) => h.id));

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderGold}`,
      borderRadius: theme.radius.md,
      boxShadow: theme.shadows.panel,
      padding: theme.spacing.lg,
    }}>
      <div style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textHeader,
        marginBottom: theme.spacing.md,
      }}>
        Recovery
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.md,
        fontFamily: theme.fonts.mono,
        fontSize: theme.fontSizes.sm,
        color: theme.colors.textMuted,
      }}>
        {regenLog.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>

      {autoRevivedHeroes && autoRevivedHeroes.length > 0 && (
        <div style={{ marginBottom: theme.spacing.md }}>
          <div style={{
            fontFamily: theme.fonts.header,
            fontSize: theme.fontSizes.sm,
            fontWeight: theme.fontWeights.bold,
            color: theme.colors.statusPositive,
            marginBottom: theme.spacing.xs,
          }}>
            Fallen Heroes Revived
          </div>
          {autoRevivedHeroes.map((h) => (
            <div key={h.id} style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textPrimary,
              paddingLeft: theme.spacing.sm,
            }}>
              {h.heroName ?? h.name} revived with {h.hp} HP
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        {heroes.map((hero) => {
          const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;
          const wasRevived = revivedSet.has(hero.id);
          return (
            <div
              key={hero.id}
              style={{
                flex: '1 1 160px',
                padding: theme.spacing.sm,
                background: theme.colors.bgPanel,
                border: `1px solid ${wasRevived ? theme.colors.statusPositive : theme.colors.borderBrown}`,
                borderRadius: theme.radius.sm,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.xs }}>
                <div style={{
                  width: '10px', height: '10px',
                  borderRadius: theme.radius.pill,
                  background: classColor,
                  flexShrink: 0,
                }} />
                <div style={{
                  fontFamily: theme.fonts.header,
                  fontSize: theme.fontSizes.sm,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.textPrimary,
                }}>
                  {hero.heroName ?? hero.name}
                </div>
              </div>

              <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '2px' }}>HP</div>
              <HPBar current={hero.hp} max={hero.maxHp} showValues />
              <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '2px', marginTop: theme.spacing.xs }}>EN</div>
              <ENBar current={hero.en} max={hero.maxEn} showValues />
            </div>
          );
        })}
      </div>
    </div>
  );
}
