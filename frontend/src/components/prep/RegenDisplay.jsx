import { theme } from '../../styles/theme';
import HPBar from '../battle/HPBar';
import ENBar from '../battle/ENBar';

export default function RegenDisplay({ regenLog, heroes, autoRevivedHeroes }) {
  const revivedSet = new Set((autoRevivedHeroes ?? []).map((h) => h.id));

  return (
    <div className="panel">
      <div className="panel-title">
        Recovery
      </div>

      <div className="regen-log">
        {regenLog.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>

      {autoRevivedHeroes && autoRevivedHeroes.length > 0 && (
        <div className="regen-revived-section">
          <div className="regen-revived-title">
            Fallen Heroes Revived
          </div>
          {autoRevivedHeroes.map((h) => (
            <div key={h.id} className="regen-revived-hero">
              {h.heroName ?? h.name} revived with {h.hp} HP
            </div>
          ))}
        </div>
      )}

      <div className="regen-heroes-row">
        {heroes.map((hero) => {
          const classColor = theme.classColors[hero.className?.toLowerCase()] ?? theme.colors.textMuted;
          const wasRevived = revivedSet.has(hero.id);
          return (
            <div
              key={hero.id}
              className="regen-hero-card"
              style={{ border: `1px solid ${wasRevived ? theme.colors.statusPositive : theme.colors.borderBrown}` }}
            >
              <div className="regen-hero-header">
                <div className="team-dot" style={{ background: classColor }} />
                <div className="regen-hero-name">
                  {hero.heroName ?? hero.name}
                </div>
              </div>

              <div className="hero-stat-label">HP</div>
              <HPBar current={hero.hp} max={hero.maxHp} showValues />
              <div className="hero-stat-label" style={{ marginTop: 'var(--sp-xs)' }}>EN</div>
              <ENBar current={hero.en} max={hero.maxEn} showValues />
            </div>
          );
        })}
      </div>
    </div>
  );
}
