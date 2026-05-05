import { theme } from '../../styles/theme';

function classColor(name) {
  const key = (name ?? '').toLowerCase();
  return theme.classColors[key] ?? theme.colors.textMuted;
}

function StatBlock({ label, value, children }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.xs,
    }}>
      <div style={{
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.xs,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textHeader,
        lineHeight: 1,
      }}>
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
        Stats
      </div>

      {allZero ? (
        <div style={{
          fontFamily: theme.fonts.body,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textMuted,
          textAlign: 'center',
          padding: `${theme.spacing.md} 0`,
        }}>
          Play your first run to see stats here.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing.lg,
        }}>
          <StatBlock label="Total Runs" value={totalRuns} />

          <StatBlock label="Best Run Ever" value={bestFights > 0 ? `${bestFights} fights` : '—'}>
            {bestFights > 0 && teamSummary.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                {teamSummary.map((cls, i) => (
                  <div
                    key={i}
                    title={cls}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: theme.radius.pill,
                      background: classColor(cls),
                      flexShrink: 0,
                    }}
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
