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
    <div className="share-panel">
      <div className="share-panel-title">
        Share Your Run
      </div>

      <textarea
        readOnly
        value={shareText}
        rows={6}
        className="share-textarea"
        onFocus={(e) => e.target.select()}
      />

      <button
        onClick={handleCopy}
        className="share-copy-btn"
        style={{ background: copied ? theme.colors.statusPositive : theme.colors.borderGold }}
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
