import { theme } from '../../styles/theme';

const CLASS_COLOR = {
  warrior: theme.classColors.warrior,
  ranger: theme.classColors.ranger,
  mage: theme.classColors.mage,
  priest: theme.classColors.priest,
};

function classColor(name) {
  return CLASS_COLOR[(name ?? '').toLowerCase()] ?? theme.colors.textMuted;
}

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardRow({ entry, isCurrentPlayer }) {
  const rank = entry.rank;
  const medal = MEDAL[rank];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      background: isCurrentPlayer ? 'rgba(184,134,11,0.12)' : 'transparent',
      borderRadius: theme.radius.md,
      borderLeft: isCurrentPlayer ? `3px solid ${theme.colors.borderGold}` : '3px solid transparent',
    }}>
      {/* Rank */}
      <div style={{
        minWidth: '36px',
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.md,
        fontWeight: theme.fontWeights.bold,
        color: medal ? 'inherit' : theme.colors.textMuted,
        textAlign: 'center',
      }}>
        {medal ?? `#${rank}`}
      </div>

      {/* Nickname */}
      <div style={{
        flex: 1,
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.sm,
        fontWeight: isCurrentPlayer ? theme.fontWeights.bold : theme.fontWeights.normal,
        color: isCurrentPlayer ? theme.colors.textHeader : theme.colors.textPrimary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {entry.playerNickname}
        {isCurrentPlayer && (
          <span style={{ marginLeft: theme.spacing.xs, color: theme.colors.textMuted, fontSize: theme.fontSizes.xs }}>
            (you)
          </span>
        )}
      </div>

      {/* Team dots */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {(entry.teamSummary ?? []).map((cls, i) => (
          <div
            key={i}
            title={cls}
            style={{
              width: '10px', height: '10px',
              borderRadius: theme.radius.pill,
              background: classColor(cls),
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Fights survived */}
      <div style={{
        minWidth: '60px',
        textAlign: 'right',
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textPrimary,
      }}>
        {entry.fightsSurvived}
        <span style={{ fontWeight: theme.fontWeights.normal, color: theme.colors.textMuted, fontSize: theme.fontSizes.xs, marginLeft: '2px' }}>
          fights
        </span>
      </div>
    </div>
  );
}
