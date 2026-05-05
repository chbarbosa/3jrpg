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

export default function SeasonHistoryList({ history }) {
  if (!history || history.length === 0) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      {history.map((item, i) => {
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
