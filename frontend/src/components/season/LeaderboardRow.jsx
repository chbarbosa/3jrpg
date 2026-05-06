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
    <div className={`lb-row${isCurrentPlayer ? ' lb-row--current' : ''}`}>
      {/* Rank */}
      <div className={`lb-rank ${medal ? 'lb-rank--medal' : 'lb-rank--number'}`}>
        {medal ?? `#${rank}`}
      </div>

      {/* Nickname */}
      <div className={`lb-nickname ${isCurrentPlayer ? 'lb-nickname--current' : 'lb-nickname--normal'}`}>
        {entry.playerNickname}
        {isCurrentPlayer && (
          <span className="lb-you-label">
            (you)
          </span>
        )}
      </div>

      {/* Team dots */}
      <div className="lb-team-col">
        {(entry.teamSummary ?? []).map((cls, i) => (
          <div
            key={i}
            title={cls}
            className="team-dot"
            style={{ background: classColor(cls) }}
          />
        ))}
      </div>

      {/* Fights survived */}
      <div className="lb-fights">
        {entry.fightsSurvived}
        <span className="lb-fights-unit">
          fights
        </span>
      </div>
    </div>
  );
}
