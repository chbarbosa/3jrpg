import { theme } from '../../styles/theme';
import HPBar from './HPBar';
import ENBar from './ENBar';
import StatusBadge from './StatusBadge';

export default function HeroPanel({ hero, isActive }) {
  const ko = hero.isKnockedOut;
  const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;

  return (
    <div
      className={isActive && !ko ? 'hero-active' : undefined}
      style={{
        flex: 1,
        padding: theme.spacing.sm,
        background: theme.colors.bgPanel,
        border: `${isActive ? 2 : 1}px solid ${isActive ? theme.colors.highlight : theme.colors.borderGold}`,
        borderRadius: theme.radius.md,
        boxShadow: isActive ? theme.shadows.highlight : theme.shadows.panel,
        opacity: ko ? 0.6 : 1,
        transition: `border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}`,
      }}
    >
      <div style={{ position: 'relative', width: '48px', height: '48px', margin: '0 auto 6px' }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: classColor,
        }} />
        {ko && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(44,26,14,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.bgPage,
            fontFamily: theme.fonts.header,
            fontWeight: theme.fontWeights.bold,
            fontSize: theme.fontSizes.sm,
          }}>
            KO
          </div>
        )}
      </div>

      <div style={{
        fontFamily: theme.fonts.header,
        fontWeight: theme.fontWeights.bold,
        fontSize: theme.fontSizes.sm,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {hero.heroName ?? hero.name}
      </div>
      <div style={{
        fontSize: theme.fontSizes.xs,
        color: classColor,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
      }}>
        {hero.name}
      </div>

      <div style={{ marginBottom: theme.spacing.xs }}>
        <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '2px' }}>HP</div>
        <HPBar current={hero.hp} max={hero.maxHp} showValues />
      </div>

      <div style={{ marginBottom: theme.spacing.xs }}>
        <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '2px' }}>EN</div>
        <ENBar current={hero.en} max={hero.maxEn} showValues />
      </div>

      {hero.statuses.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: theme.spacing.xs }}>
          {hero.statuses.map((s) => (
            <StatusBadge key={s.statusName} statusName={s.statusName} turnsRemaining={s.turnsRemaining} />
          ))}
        </div>
      )}
    </div>
  );
}
