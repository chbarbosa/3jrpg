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

  const pageStyle = {
    minHeight: '100vh',
    background: theme.colors.bgPage,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing.xl} ${theme.spacing.lg}`,
    boxSizing: 'border-box',
  };

  const contentStyle = {
    width: '100%',
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
  };

  const btnBase = {
    flex: 1,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    border: 'none',
    transition: `background ${theme.transitions.fast}`,
    whiteSpace: 'nowrap',
  };

  // No run data — generic fallback
  if (!hasRunData) {
    return (
      <div style={pageStyle}>
        <div style={contentStyle}>
          <h1 style={{ fontFamily: theme.fonts.header, fontSize: theme.fontSizes.xxl, color: theme.colors.textHeader, margin: 0 }}>
            Run Over
          </h1>
          <div style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.md }}>
            No active run information.
            {bestFights !== null && (
              <span> Your best run: {bestFights} fights.</span>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ ...btnBase, background: 'transparent', border: `1px solid ${theme.colors.borderBrown}`, color: theme.colors.textPrimary, flex: 'none', width: 'fit-content' }}
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Timeout modal — shown immediately on mount if timeout */}
      <AlertModal
        isOpen={isTimeout && !timeoutDismissed}
        title="Session Expired"
        message="Your session expired after 1 hour of inactivity. This run has been lost."
        variant="info"
        confirmLabel="OK"
        onConfirm={() => setTimeoutDismissed(true)}
      />

      <div style={contentStyle}>
        {/* Title */}
        <div>
          <h1 style={{
            fontFamily: theme.fonts.header,
            fontSize: theme.fontSizes.xxl,
            fontWeight: theme.fontWeights.black,
            color: theme.colors.textHeader,
            margin: 0,
            marginBottom: theme.spacing.sm,
          }}>
            Run Over
          </h1>
          <EndReasonBadge endReason={endReason} />
        </div>

        {/* Run summary */}
        <RunSummaryCard
          fightsSurvived={fightsSurvived}
          heroConfigs={heroConfigs}
        />

        {/* Best run indicator */}
        {isNewBest && (
          <div style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.md,
            fontWeight: theme.fontWeights.bold,
            color: theme.colors.statusPositive,
            textAlign: 'center',
          }}>
            ★ New personal best!
          </div>
        )}
        {showBestNote && (
          <div style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textMuted,
            textAlign: 'center',
          }}>
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
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
          {canNewRun && (
            <button
              onClick={starting ? undefined : promptNewRun}
              disabled={starting}
              style={{
                ...btnBase,
                background: starting ? theme.colors.bgPanelDark : theme.colors.borderGold,
                color: starting ? theme.colors.textMuted : theme.colors.bgPage,
                fontFamily: theme.fonts.header,
                fontSize: theme.fontSizes.lg,
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
            onClick={() => navigate('/')}
            style={{
              ...btnBase,
              background: 'transparent',
              border: `1px solid ${theme.colors.borderBrown}`,
              color: theme.colors.textPrimary,
            }}
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
