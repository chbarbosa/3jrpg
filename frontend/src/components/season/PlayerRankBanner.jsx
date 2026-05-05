import { theme } from '../../styles/theme';

export default function PlayerRankBanner({ rankData }) {
  if (!rankData) return null;

  const { rank, fightsSurvived, totalPlayers } = rankData;

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderGold}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.lg,
      flexWrap: 'wrap',
    }}>
      <div style={{
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.xs,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        flex: '0 0 auto',
      }}>
        Your Rank
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing.xs, flex: 1 }}>
        <span style={{
          fontFamily: theme.fonts.header,
          fontSize: theme.fontSizes.xl,
          fontWeight: theme.fontWeights.black,
          color: theme.colors.textHeader,
        }}>
          #{rank}
        </span>
        {totalPlayers != null && (
          <span style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textMuted,
          }}>
            of {totalPlayers}
          </span>
        )}
      </div>

      <div style={{
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.sm,
        color: theme.colors.textPrimary,
        flex: '0 0 auto',
      }}>
        <span style={{ fontWeight: theme.fontWeights.bold }}>{fightsSurvived}</span>
        <span style={{ color: theme.colors.textMuted }}> fights survived</span>
      </div>
    </div>
  );
}
