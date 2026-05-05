import { useState } from 'react';
import { theme } from '../../styles/theme';
import { END_REASONS } from '../../data/gameConstants';
import { CLASS_LIST } from '../../data/classes';
import { AUGMENTATION_LIST } from '../../data/augmentations';
import AlertModal from '../AlertModal';

const GAME_URL = 'https://3jrpg.example.com';

function buildShareText(fightsSurvived, heroConfigs, endReason, playerNickname) {
  const teamStr = (heroConfigs ?? []).map((h) => {
    const cls = CLASS_LIST.find((c) => c.id === h.classId)?.label ?? h.classId ?? '?';
    const aug = AUGMENTATION_LIST.find((a) => a.id === h.augmentationType)?.label ?? h.augmentationType ?? '?';
    return `${cls} (${aug})`;
  }).join(', ') || '—';

  const outcome = END_REASONS[endReason] ?? endReason ?? 'Unknown';
  const nick = playerNickname ?? 'Unknown';

  return [
    '⚔ 3JRPG — Run Summary',
    `Player: ${nick}`,
    `Fights survived: ${fightsSurvived}`,
    `Team: ${teamStr}`,
    `Outcome: ${outcome}`,
    `Can you beat it? Play at: ${GAME_URL}`,
  ].join('\n');
}

export default function SharePanel({ fightsSurvived, heroConfigs, endReason, playerNickname }) {
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState(false);

  const shareText = buildShareText(fightsSurvived, heroConfigs, endReason, playerNickname);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setModal(true);
    }
  }

  return (
    <div style={{
      background: theme.colors.bgPanel,
      border: `1px solid ${theme.colors.borderBrown}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    }}>
      <div style={{
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        Share Your Run
      </div>

      <textarea
        readOnly
        value={shareText}
        rows={6}
        style={{
          width: '100%',
          background: theme.colors.bgPanelDark,
          border: `1px solid ${theme.colors.borderBrown}`,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
          fontFamily: theme.fonts.mono,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textPrimary,
          resize: 'none',
          boxSizing: 'border-box',
          lineHeight: 1.5,
        }}
        onFocus={(e) => e.target.select()}
      />

      <button
        onClick={handleCopy}
        style={{
          marginTop: theme.spacing.sm,
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          background: copied ? theme.colors.statusPositive : theme.colors.borderGold,
          color: theme.colors.bgPage,
          border: 'none',
          borderRadius: theme.radius.sm,
          cursor: 'pointer',
          fontFamily: theme.fonts.body,
          fontSize: theme.fontSizes.sm,
          fontWeight: theme.fontWeights.bold,
          transition: `background ${theme.transitions.fast}`,
        }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = theme.colors.actionHover; }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = theme.colors.borderGold; }}
      >
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>

      <AlertModal
        isOpen={modal}
        title="Could Not Copy"
        message="Could not copy to clipboard. Select the text manually."
        variant="info"
        confirmLabel="OK"
        onConfirm={() => setModal(false)}
      />
    </div>
  );
}
