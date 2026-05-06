import { theme } from '../../styles/theme';
import { END_REASONS } from '../../data/gameConstants';

const BADGE_COLORS = {
  DEFEATED:  theme.colors.statusBleed,
  GAVE_UP:   theme.colors.borderBrown,
  TIMEOUT:   theme.colors.textMuted,
  RESTARTED: theme.colors.barEN,
};

export default function EndReasonBadge({ endReason }) {
  const label = END_REASONS[endReason] ?? endReason ?? 'Unknown';
  const bg = BADGE_COLORS[endReason] ?? theme.colors.textMuted;

  return (
    <span className="end-reason-badge" style={{ background: bg }}>
      {label}
    </span>
  );
}
