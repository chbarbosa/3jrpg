import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { theme } from '../styles/theme';
import AlertModal from '../components/AlertModal';
import EndReasonBadge from '../components/gameover/EndReasonBadge';
import RunSummaryCard from '../components/gameover/RunSummaryCard';
import SharePanel from '../components/gameover/SharePanel';
import { useAuth } from '../hooks/useAuth.jsx';
import { startRun, getProfile } from '../services/api';
import { playSound } from '../services/sound';

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', confirmLabel: 'OK', cancelLabel: null, onConfirm: null, onCancel: null };

export default function GameOverPage() {
  const navigate = useNavigate();
  const { state: rawState } = useLocation();
  const { player } = useAuth();

  // Normalise location state — handle both formats
  const endReason = rawState?.endReason ?? (rawState?.timeout ? 'TIMEOUT' : null);
  const fightsSurvived = rawState?.fightsSurvived ?? 0;
  const heroConfigs = rawState?.heroConfigs ?? null;
  const isTimeout = rawState?.timeout === true || endReason === 'TIMEOUT';
  const hasRunData = !!endReason;

  const [timeoutDismissed, setTimeoutDismissed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [starting, setStarting] = useState(false);
  const [modal, setModal] = useState(MODAL_CLOSED);

  useEffect(() => {
    playSound('gameOver');
    getProfile().then(setProfile).catch(() => {});
  }, []);

  function closeModal() {
    setModal(MODAL_CLOSED);
  }

  function showError(message) {
    setModal({ open: true, title: 'Error', message, variant: 'danger', confirmLabel: 'OK', cancelLabel: null, onConfirm: closeModal, onCancel: null });
  }

  function promptNewRun() {
    setModal({
      open: true,
      title: 'Start Again?',
      message: 'Start a new run with the same team?',
      variant: 'warning',
      confirmLabel: "Let's go",
      cancelLabel: 'Cancel',
      onConfirm: handleNewRun,
      onCancel: closeModal,
    });
  }

  async function handleNewRun() {
    closeModal();
    setStarting(true);
    try {
      const runState = await startRun(heroConfigs);
      navigate('/battle', { state: { runState, heroConfigs } });
    } catch (err) {
      if (err.response?.status === 409) {
        showError('You already have an active run. Navigate to battle to continue it.');
      } else {
        showError(err.response?.data?.error ?? 'Failed to start run.');
      }
      setStarting(false);
    }
  }

  const bestFights = profile?.bestRunFightsSurvived ?? null;
  const isNewBest = hasRunData && bestFights !== null && fightsSurvived > 0 && fightsSurvived >= bestFights;
  const showBestNote = hasRunData && bestFights !== null && !isNewBest && bestFights > fightsSurvived;

  const canNewRun = heroConfigs && endReason !== 'RESTARTED';

  // No run data — generic fallback
  if (!hasRunData) {
    return (
      <div className="gameover-page">
        <div className="gameover-content">
          <h1 className="gameover-title">Run Over</h1>
          <div className="gameover-fallback-msg">
            No active run information.
            {bestFights !== null && (
              <span> Your best run: {bestFights} fights.</span>
            )}
          </div>
          <button
            className="btn-back-to-menu"
            onClick={() => navigate('/')}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gameover-page">
      {/* Timeout modal — shown immediately on mount if timeout */}
      <AlertModal
        isOpen={isTimeout && !timeoutDismissed}
        title="Session Expired"
        message="Your session expired after 1 hour of inactivity. This run has been lost."
        variant="info"
        confirmLabel="OK"
        onConfirm={() => setTimeoutDismissed(true)}
      />

      <div className="gameover-content">
        {/* Title */}
        <div>
          <h1 className="gameover-title">Run Over</h1>
          <div className="gameover-badge-center">
            <EndReasonBadge endReason={endReason} />
          </div>
        </div>

        {/* Run summary */}
        <RunSummaryCard
          fightsSurvived={fightsSurvived}
          heroConfigs={heroConfigs}
        />

        {/* Best run indicator */}
        {isNewBest && (
          <div className="gameover-new-best">
            ★ New personal best!
          </div>
        )}
        {showBestNote && (
          <div className="gameover-best-note">
            Your best run: {bestFights} fights survived
          </div>
        )}

        {/* Share */}
        <SharePanel
          fightsSurvived={fightsSurvived}
          heroConfigs={heroConfigs}
          endReason={endReason}
          playerNickname={player?.nickname ?? 'Unknown'}
        />

        {/* Action buttons */}
        <div className="gameover-action-row">
          {canNewRun && (
            <button
              className="btn-new-run"
              onClick={starting ? undefined : promptNewRun}
              disabled={starting}
              style={{
                background: starting ? theme.colors.bgPanelDark : theme.colors.borderGold,
                color: starting ? theme.colors.textMuted : theme.colors.bgPage,
                cursor: starting ? 'wait' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!starting) e.currentTarget.style.background = theme.colors.actionHover; }}
              onMouseLeave={(e) => { if (!starting) e.currentTarget.style.background = theme.colors.borderGold; }}
              onMouseDown={(e) => { if (!starting) e.currentTarget.style.background = theme.colors.actionActive; }}
              onMouseUp={(e) => { if (!starting) e.currentTarget.style.background = theme.colors.actionHover; }}
            >
              {starting ? 'Starting...' : 'New Run (Same Team)'}
            </button>
          )}
          <button
            className="btn-back-to-menu"
            onClick={() => navigate('/')}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Back to Menu
          </button>
        </div>
      </div>

      {/* Shared error/confirm modal */}
      <AlertModal
        isOpen={modal.open}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        confirmLabel={modal.confirmLabel}
        cancelLabel={modal.cancelLabel}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </div>
  );
}
