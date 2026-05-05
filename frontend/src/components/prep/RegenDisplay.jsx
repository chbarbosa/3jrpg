import { theme } from '../../styles/theme';
import HPBar from '../battle/HPBar';
import ENBar from '../battle/ENBar';

export default function RegenDisplay({ regenLog, heroes }) {
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

      <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        {heroes.map((hero) => {
          const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;
          return (
            <div
              key={hero.id}
              style={{
                flex: '1 1 160px',
                padding: theme.spacing.sm,
                background: hero.isKnockedOut ? theme.colors.bgPanelDark : theme.colors.bgPanel,
                border: `1px solid ${theme.colors.borderBrown}`,
                borderRadius: theme.radius.sm,
                opacity: hero.isKnockedOut ? 0.55 : 1,
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
                  {hero.name}
                </div>
              </div>

              {hero.isKnockedOut ? (
                <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.statusBleed, fontStyle: 'italic' }}>
                  Knocked Out — needs revival
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '2px' }}>HP</div>
                  <HPBar current={hero.hp} max={hero.maxHp} showValues />
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '2px', marginTop: theme.spacing.xs }}>EN</div>
                  <ENBar current={hero.en} max={hero.maxEn} showValues />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
