export default function PlayerRankBanner({ rankData }) {
  if (!rankData) return null;

  const { rank, fightsSurvived, totalPlayers } = rankData;

  return (
    <div className="player-rank-banner">
      <div className="player-rank-label">
        Your Rank
      </div>

      <div className="player-rank-value-row">
        <span className="player-rank-number">
          #{rank}
        </span>
        {totalPlayers != null && (
          <span className="player-rank-of-total">
            of {totalPlayers}
          </span>
        )}
      </div>

      <div className="player-rank-fights">
        <span className="player-rank-fights-bold">{fightsSurvived}</span>
        <span className="player-rank-fights-muted"> fights survived</span>
      </div>
    </div>
  );
}
