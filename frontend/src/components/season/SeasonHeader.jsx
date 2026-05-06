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
    <div className="season-header">
      <div className="season-header-title">
        {emoji} {season.name}
      </div>
      <div className="season-header-dates">
        {formatDate(season.startDate)} – {season.endDate ? formatDate(season.endDate) : 'Ongoing'}
      </div>
      <span
        className="season-status-badge"
        style={{ background: isActive ? theme.colors.statusPositive : theme.colors.borderBrown }}
      >
        {isActive ? 'Active' : 'Ended'}
      </span>
    </div>
  );
}
