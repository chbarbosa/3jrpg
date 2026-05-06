import { theme } from '../../styles/theme';

const SEASON_EMOJI = { winter: '❄', spring: '🌸', summer: '☀', autumn: '🍂', fall: '🍂' };

function getEmoji(name) {
  const lower = (name ?? '').toLowerCase();
  for (const [key, emoji] of Object.entries(SEASON_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '⚔';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export default function SeasonHistoryList({ history, currentSeason, currentPlayerFightsSurvived }) {
  const hasHistory = history && history.length > 0;

  if (!hasHistory && !currentSeason) {
    return (
      <div className="text-muted-sm" style={{ textAlign: 'center', padding: 'var(--sp-lg)' }}>
        No past seasons yet.
      </div>
    );
  }

  const currentBadge = (
    <span className="season-current-badge">
      Current
    </span>
  );

  return (
    <div className="season-history-list">
      {currentSeason && (
        <div className="season-history-row season-history-row--current">
          <div className="season-history-name-col">
            <span>{getEmoji(currentSeason.name)}</span>
            <span style={{ fontWeight: 'var(--fw-bold)' }}>{currentSeason.name}</span>
            {currentBadge}
          </div>
          {currentPlayerFightsSurvived != null && (
            <div className="season-history-fights">
              <span style={{ fontWeight: 'var(--fw-bold)', color: theme.colors.textPrimary }}>
                {currentPlayerFightsSurvived}
              </span>{' '}fights
            </div>
          )}
        </div>
      )}

      {hasHistory && history.map((item, i) => {
        const season = item.season ?? item;
        const result = item.seasonResult ?? item.result ?? null;
        const emoji = getEmoji(season.name);

        return (
          <div key={season.uuid ?? i} className="season-history-row season-history-row--past">
            <div className="season-history-name-col" style={{ flex: 1 }}>
              <span style={{ marginRight: 'var(--sp-xs)' }}>{emoji}</span>
              <span style={{ fontWeight: 'var(--fw-bold)' }}>{season.name}</span>
              <span style={{ marginLeft: 'var(--sp-sm)', color: theme.colors.textMuted, fontSize: 'var(--fs-xs)' }}>
                {formatDate(season.endDate)}
              </span>
            </div>

            {result ? (
              <div className="season-history-result-row">
                <span>
                  <span style={{ fontWeight: 'var(--fw-bold)', color: theme.colors.textHeader }}>
                    #{result.rank}
                  </span>
                </span>
                <span>
                  <span style={{ fontWeight: 'var(--fw-bold)', color: theme.colors.textPrimary }}>
                    {result.fightsSurvived}
                  </span>{' '}fights
                </span>
              </div>
            ) : (
              <div className="season-history-no-entry">
                No entry
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
