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

  const dotColor = cls ? theme.classColors[cls.colorKey] : theme.colors.textMuted;

  return (
    <div
      className="team-summary-hero-row"
      style={{
        background: complete ? theme.colors.bgPanel : 'transparent',
        opacity: complete ? 1 : 0.4,
      }}
    >
      <div className="team-dot" style={{ background: dotColor }} />
      <div className="team-hero-class-name">
        {cls ? cls.label : `Hero ${index + 1}`}
      </div>
      <div className="team-hero-aug-label">
        {aug ? aug.label : '—'}
        {advLabel ? ` · ${advLabel}` : ''}
      </div>
      <div className="team-hero-weapon-label">
        {weapon ? weapon.label : '—'}
      </div>
      {itemCount > 0 && (
        <div className="team-hero-item-badge">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default function TeamSummary({ heroes, onStartRun }) {
  const allComplete = heroes.every(isHeroComplete);

  return (
    <div className="team-summary">
      <div className="team-summary-title">
        Team Overview
      </div>

      <div className="team-summary-hero-list">
        {heroes.map((hero, i) => (
          <HeroRow key={i} hero={hero} index={i} />
        ))}
      </div>

      <div className="team-summary-footer">
        {!allComplete && (
          <span className="team-summary-incomplete-hint">
            Configure all 3 heroes to start
          </span>
        )}
        <button
          onClick={allComplete ? onStartRun : undefined}
          disabled={!allComplete}
          className={`btn-start-run ${allComplete ? 'btn-start-run--ready' : 'btn-start-run--disabled'}`}
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
