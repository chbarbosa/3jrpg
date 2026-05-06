import { theme } from '../../styles/theme';

function classColor(name) {
  const key = (name ?? '').toLowerCase();
  return theme.classColors[key] ?? theme.colors.textMuted;
}

function StatBlock({ label, value, children }) {
  return (
    <div className="stat-block">
      <div className="stat-block-label">
        {label}
      </div>
      <div className="stat-block-value">
        {value}
      </div>
      {children}
    </div>
  );
}

export default function ProfileStats({ profile }) {
  const totalRuns = profile?.totalRuns ?? 0;
  const bestFights = profile?.bestRunFightsSurvived ?? 0;
  const seasonRank = profile?.currentSeasonRank ?? 0;
  const seasonFights = profile?.currentSeasonFightsSurvived ?? 0;
  const teamSummary = profile?.bestRunTeamSummary ?? [];

  const allZero = totalRuns === 0 && bestFights === 0 && seasonRank === 0 && seasonFights === 0;

  return (
    <div className="profile-stats-panel">
      <div className="profile-stats-title">
        Stats
      </div>

      {allZero ? (
        <div className="profile-stats-empty">
          Play your first run to see stats here.
        </div>
      ) : (
        <div className="profile-stats-grid">
          <StatBlock label="Total Runs" value={totalRuns} />

          <StatBlock label="Best Run Ever" value={bestFights > 0 ? `${bestFights} fights` : '—'}>
            {bestFights > 0 && teamSummary.length > 0 && (
              <div className="stat-block-team-dots">
                {teamSummary.map((cls, i) => (
                  <div
                    key={i}
                    title={cls}
                    className="team-dot"
                    style={{ background: classColor(cls) }}
                  />
                ))}
              </div>
            )}
          </StatBlock>

          <StatBlock
            label="Current Season Rank"
            value={seasonRank > 0 ? `#${seasonRank}` : 'Unranked'}
          />

          <StatBlock
            label="Current Season Fights"
            value={seasonFights > 0 ? seasonFights : '—'}
          />
        </div>
      )}
    </div>
  );
}
