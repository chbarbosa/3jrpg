import { theme } from '../../styles/theme';
import LeaderboardRow from './LeaderboardRow';

export default function LeaderboardTable({ entries, page, hasNextPage, onPrev, onNext, currentPlayerNickname }) {
  const btnBase = {
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    border: `1px solid ${theme.colors.borderBrown}`,
    borderRadius: theme.radius.sm,
    background: 'transparent',
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.sm,
    cursor: 'pointer',
    transition: `background ${theme.transitions.fast}`,
  };

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderBrown}`,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadows.panel,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        background: theme.colors.bgPanelDark,
        borderBottom: `1px solid ${theme.colors.borderBrown}`,
      }}>
        <div style={{ minWidth: '36px', fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>
          Rank
        </div>
        <div style={{ flex: 1, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Player
        </div>
        <div className="lb-team-col" style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Team
        </div>
        <div style={{ minWidth: '60px', textAlign: 'right', fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Fights
        </div>
      </div>

      {/* Rows */}
      <div>
        {entries.length === 0 ? (
          <div style={{
            padding: theme.spacing.lg,
            textAlign: 'center',
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textMuted,
          }}>
            No entries yet.
          </div>
        ) : (
          entries.map((entry, i) => (
            <LeaderboardRow
              key={entry.playerUuid ?? i}
              entry={entry}
              isCurrentPlayer={entry.playerNickname === currentPlayerNickname}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        borderTop: `1px solid ${theme.colors.borderBrown}`,
      }}>
        <button
          onClick={onPrev}
          disabled={page === 0}
          style={{
            ...btnBase,
            opacity: page === 0 ? 0.4 : 1,
            cursor: page === 0 ? 'default' : 'pointer',
          }}
          onMouseEnter={(e) => { if (page > 0) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          ← Prev
        </button>
        <span style={{
          fontFamily: theme.fonts.body,
          fontSize: theme.fontSizes.xs,
          color: theme.colors.textMuted,
        }}>
          Page {page + 1}
        </span>
        <button
          onClick={onNext}
          disabled={!hasNextPage}
          style={{
            ...btnBase,
            opacity: !hasNextPage ? 0.4 : 1,
            cursor: !hasNextPage ? 'default' : 'pointer',
          }}
          onMouseEnter={(e) => { if (hasNextPage) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
