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
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SeasonHeader({ season }) {
  if (!season) return null;

  const emoji = getEmoji(season.name);
  const now = new Date();
  const end = season.endDate ? new Date(season.endDate) : null;
  const isActive = !end || end > now;

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderGold}`,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadows.panel,
      padding: theme.spacing.lg,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.xxl,
        fontWeight: theme.fontWeights.black,
        color: theme.colors.textHeader,
        marginBottom: theme.spacing.xs,
      }}>
        {emoji} {season.name}
      </div>
      <div style={{
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.sm,
      }}>
        {formatDate(season.startDate)} – {season.endDate ? formatDate(season.endDate) : 'Ongoing'}
      </div>
      <span style={{
        display: 'inline-block',
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        background: isActive ? theme.colors.statusPositive : theme.colors.borderBrown,
        color: theme.colors.bgPage,
        borderRadius: theme.radius.pill,
        fontFamily: theme.fonts.body,
        fontWeight: theme.fontWeights.bold,
        fontSize: theme.fontSizes.xs,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {isActive ? 'Active' : 'Ended'}
      </span>
    </div>
  );
}
