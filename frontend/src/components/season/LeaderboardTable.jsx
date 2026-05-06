import { theme } from '../../styles/theme';
import LeaderboardRow from './LeaderboardRow';

export default function LeaderboardTable({ entries, page, hasNextPage, onPrev, onNext, currentPlayerNickname }) {
  return (
    <div className="lb-table">
      {/* Header */}
      <div className="lb-header">
        <div className="lb-header-cell lb-header-rank">Rank</div>
        <div className="lb-header-cell lb-header-player">Player</div>
        <div className="lb-header-cell lb-team-col">Team</div>
        <div className="lb-header-cell lb-header-fights">Fights</div>
      </div>

      {/* Rows */}
      <div>
        {entries.length === 0 ? (
          <div className="lb-empty">
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
      <div className="lb-pagination">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="lb-page-btn"
          style={{ opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'default' : 'pointer' }}
          onMouseEnter={(e) => { if (page > 0) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          ← Prev
        </button>
        <span className="lb-page-label">
          Page {page + 1}
        </span>
        <button
          onClick={onNext}
          disabled={!hasNextPage}
          className="lb-page-btn"
          style={{ opacity: !hasNextPage ? 0.4 : 1, cursor: !hasNextPage ? 'default' : 'pointer' }}
          onMouseEnter={(e) => { if (hasNextPage) e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
