import { theme } from '../../styles/theme';
import HPBar from './HPBar';
import ENBar from './ENBar';
import StatusBadge from './StatusBadge';

export default function HeroPanel({ hero, isActive }) {
  const ko = hero.isKnockedOut;
  const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;

  return (
    <div
      className={[
        'hero-panel',
        isActive && !ko ? 'hero-panel--active hero-active' : 'hero-panel--inactive',
        ko ? 'hero-panel--ko' : '',
      ].join(' ').trim()}
    >
      <div className="hero-avatar-wrapper">
        <div
          className="hero-avatar-circle"
          style={{ background: classColor }}
        />
        {ko && (
          <div className="hero-ko-overlay">
            KO
          </div>
        )}
      </div>

      <div className="hero-name">
        {hero.heroName ?? hero.name}
      </div>
      <div className="hero-class-label" style={{ color: classColor }}>
        {hero.name}
      </div>

      <div className="hero-stat-row">
        <div className="hero-stat-label">HP</div>
        <HPBar current={hero.hp} max={hero.maxHp} showValues />
      </div>

      <div className="hero-stat-row">
        <div className="hero-stat-label">EN</div>
        <ENBar current={hero.en} max={hero.maxEn} showValues />
      </div>

      {hero.statuses.length > 0 && (
        <div className="hero-statuses">
          {hero.statuses.map((s) => (
            <StatusBadge key={s.statusName} statusName={s.statusName} turnsRemaining={s.turnsRemaining} />
          ))}
        </div>
      )}

      {hero.isPostponed && (
        <div className="postponed-badge">
          ⏳ POSTPONED
        </div>
      )}

      {hero.equippedStartingAccessoryId === 'barrierRing' && (
        <div className="accessory-badge accessory-badge--barrier">
          🛡 Barrier
        </div>
      )}

      {hero.equippedLootAccessoryUuid && (hero.inventory ?? []).some(
        (i) => i.uuid === hero.equippedLootAccessoryUuid && i.name?.includes('Rebirth')
      ) && (
        <div className="accessory-badge accessory-badge--rebirth">
          ✨ Rebirth
        </div>
      )}
    </div>
  );
}
