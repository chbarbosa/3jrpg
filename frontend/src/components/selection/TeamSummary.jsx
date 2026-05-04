import { theme } from '../../styles/theme';
import { CLASS_LIST } from '../../data/classes';
import { AUGMENTATION_LIST } from '../../data/augmentations';
import { WEAPON_LIST } from '../../data/weapons';

function isHeroComplete(hero) {
  if (!hero.classId || !hero.augmentationType) return false;
  if (hero.augmentationType !== 'natural' && !hero.augmentationAdvantageId) return false;
  if (hero.classId === 'mage' && !hero.mageSpecializationId) return false;
  return !!hero.primaryWeaponId;
}

function HeroRow({ hero, index }) {
  const complete = isHeroComplete(hero);
  const cls = CLASS_LIST.find((c) => c.id === hero.classId) ?? null;
  const aug = AUGMENTATION_LIST.find((a) => a.id === hero.augmentationType) ?? null;
  const advLabel = aug?.advantages?.find((a) => a.id === hero.augmentationAdvantageId)?.label ?? null;
  const weapon = WEAPON_LIST.find((w) => w.id === hero.primaryWeaponId) ?? null;
  const itemCount = Object.values(hero.items).reduce((s, q) => s + q, 0);

  const dimStyle = { opacity: complete ? 1 : 0.4 };
  const dotColor = cls ? theme.classColors[cls.colorKey] : theme.colors.textMuted;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      background: complete ? theme.colors.bgPanel : 'transparent',
      borderRadius: theme.radius.sm,
      ...dimStyle,
    }}>
      <div style={{
        width: '10px', height: '10px',
        borderRadius: theme.radius.pill,
        background: dotColor,
        flexShrink: 0,
      }} />
      <div style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textPrimary,
        minWidth: '64px',
      }}>
        {cls ? cls.label : `Hero ${index + 1}`}
      </div>
      <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, flex: 1 }}>
        {aug ? aug.label : '—'}
        {advLabel ? ` · ${advLabel}` : ''}
      </div>
      <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>
        {weapon ? weapon.label : '—'}
      </div>
      {itemCount > 0 && (
        <div style={{
          fontSize: theme.fontSizes.xs,
          color: theme.colors.textMuted,
          background: theme.colors.bgPanelDark,
          borderRadius: theme.radius.pill,
          padding: '1px 6px',
        }}>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default function TeamSummary({ heroes, onStartRun }) {
  const allComplete = heroes.every(isHeroComplete);

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderGold}`,
      borderRadius: theme.radius.md,
      boxShadow: theme.shadows.panel,
      padding: theme.spacing.md,
    }}>
      <div style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.md,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textHeader,
        marginBottom: theme.spacing.sm,
      }}>
        Team Overview
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        {heroes.map((hero, i) => (
          <HeroRow key={i} hero={hero} index={i} />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: theme.spacing.md }}>
        {!allComplete && (
          <span style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>
            Configure all 3 heroes to start
          </span>
        )}
        <button
          onClick={allComplete ? onStartRun : undefined}
          disabled={!allComplete}
          style={{
            fontFamily: theme.fonts.header,
            fontSize: theme.fontSizes.md,
            fontWeight: theme.fontWeights.bold,
            padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
            background: allComplete ? theme.colors.borderGold : theme.colors.bgPanelDark,
            color: allComplete ? theme.colors.bgPage : theme.colors.textMuted,
            border: `1px solid ${allComplete ? theme.colors.borderGold : theme.colors.borderBrown}`,
            borderRadius: theme.radius.md,
            cursor: allComplete ? 'pointer' : 'not-allowed',
            transition: `background ${theme.transitions.fast}`,
          }}
          onMouseEnter={(e) => { if (allComplete) e.currentTarget.style.background = theme.colors.actionHover; }}
          onMouseLeave={(e) => { if (allComplete) e.currentTarget.style.background = theme.colors.borderGold; }}
          onMouseDown={(e) => { if (allComplete) e.currentTarget.style.background = theme.colors.actionActive; }}
          onMouseUp={(e) => { if (allComplete) e.currentTarget.style.background = theme.colors.actionHover; }}
        >
          Start Run
        </button>
      </div>
    </div>
  );
}
