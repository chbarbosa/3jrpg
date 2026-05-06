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
      <div style={{
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        padding: theme.spacing.lg,
      }}>
        No past seasons yet.
      </div>
    );
  }

  const currentBadge = (
    <span style={{
      background: theme.colors.borderGold,
      color: theme.colors.bgPage,
      borderRadius: theme.radius.pill,
      fontSize: theme.fontSizes.xs,
      padding: '2px 8px',
      marginLeft: theme.spacing.xs,
      fontWeight: theme.fontWeights.bold,
      flexShrink: 0,
    }}>
      Current
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {currentSeason && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          background: theme.colors.bgPanel,
          border: `1px solid ${theme.colors.borderGold}`,
          borderRadius: theme.radius.md,
          flexWrap: 'wrap',
        }}>
          <div style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textPrimary,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.xs,
          }}>
            <span>{getEmoji(currentSeason.name)}</span>
            <span style={{ fontWeight: theme.fontWeights.bold }}>{currentSeason.name}</span>
            {currentBadge}
          </div>
          {currentPlayerFightsSurvived != null && (
            <div style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textMuted,
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: theme.fontWeights.bold, color: theme.colors.textPrimary }}>
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
          <div key={season.uuid ?? i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: theme.colors.bgPanel,
            border: `1px solid ${theme.colors.borderBrown}`,
            borderRadius: theme.radius.md,
            flexWrap: 'wrap',
          }}>
            <div style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textPrimary,
              flex: 1,
            }}>
              <span style={{ marginRight: theme.spacing.xs }}>{emoji}</span>
              <span style={{ fontWeight: theme.fontWeights.bold }}>{season.name}</span>
              <span style={{ marginLeft: theme.spacing.sm, color: theme.colors.textMuted, fontSize: theme.fontSizes.xs }}>
                {formatDate(season.endDate)}
              </span>
            </div>

            {result ? (
              <div style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textMuted,
                display: 'flex',
                gap: theme.spacing.md,
                flexShrink: 0,
              }}>
                <span>
                  <span style={{ fontWeight: theme.fontWeights.bold, color: theme.colors.textHeader }}>
                    #{result.rank}
                  </span>
                </span>
                <span>
                  <span style={{ fontWeight: theme.fontWeights.bold, color: theme.colors.textPrimary }}>
                    {result.fightsSurvived}
                  </span>{' '}fights
                </span>
              </div>
            ) : (
              <div style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.xs,
                color: theme.colors.textMuted,
              }}>
                No entry
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
