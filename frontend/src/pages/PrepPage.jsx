import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { theme } from '../styles/theme';
import AlertModal from '../components/AlertModal';
import RegenDisplay from '../components/prep/RegenDisplay';
import LootDropPanel from '../components/prep/LootDropPanel';
import PrepActionPanel from '../components/prep/PrepActionPanel';
import { assignLoot, prepAction, nextFight } from '../services/api';

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', confirmLabel: 'OK', cancelLabel: null, onConfirm: null, onCancel: null };

function initHeroActions(heroes) {
  const actions = {};
  heroes.forEach((h) => {
    actions[h.id] = h.isKnockedOut;
  });
  return actions;
}

export default function PrepPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const prepResult = location.state?.prepResult ?? null;
  const runUuid = location.state?.runUuid ?? null;

  const [heroes, setHeroes] = useState(prepResult?.heroes ?? []);
  const [heroActions, setHeroActions] = useState(() => initHeroActions(prepResult?.heroes ?? []));
  const [lootAssigned, setLootAssigned] = useState(false);
  const [lootRecipientHeroId, setLootRecipientHeroId] = useState(null);
  const [modal, setModal] = useState(MODAL_CLOSED);
  const [loadingReady, setLoadingReady] = useState(false);

  const lootItem = prepResult?.lootItem ?? null;

  // Guard: redirect if all heroes are KO'd
  useEffect(() => {
    if (heroes.length > 0 && heroes.every((h) => h.isKnockedOut)) {
      navigate('/gameover', { state: { endReason: 'DEFEATED', fightsSurvived: 0 }, replace: true });
    }
    if (!prepResult || !runUuid) {
      navigate('/select', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeModal() {
    setModal(MODAL_CLOSED);
  }

  function showError(message) {
    setModal({ open: true, title: 'Error', message, variant: 'danger', confirmLabel: 'OK', cancelLabel: null, onConfirm: closeModal, onCancel: null });
  }

  function handleTimeout() {
    setModal({
      open: true,
      title: 'Session Expired',
      message: 'Your session timed out. The run has been lost.',
      variant: 'info',
      confirmLabel: 'OK',
      cancelLabel: null,
      onConfirm: () => navigate('/gameover', { state: { timeout: true }, replace: true }),
      onCancel: null,
    });
  }

  function wrapApiCall(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (err) {
        if (err.response?.status === 410) {
          handleTimeout();
          throw err;
        }
        throw err;
      }
    };
  }

  async function handleAssignLoot(heroId) {
    const updatedHeroes = await wrapApiCall(assignLoot)(runUuid, heroId);
    setHeroes(updatedHeroes);
    setLootAssigned(true);
    setLootRecipientHeroId(heroId);
  }

  async function handlePrepAction(heroId, actionType, itemId, targetHeroId) {
    try {
      const updatedHeroes = await wrapApiCall(prepAction)(runUuid, heroId, actionType, itemId ?? null, targetHeroId ?? null);
      setHeroes(updatedHeroes);
      setHeroActions((prev) => ({ ...prev, [heroId]: true }));
    } catch (err) {
      if (err.response?.status !== 410) {
        showError(err.response?.data?.error ?? err.message ?? 'Prep action failed.');
      }
      throw err;
    }
  }

  async function handleReady() {
    setLoadingReady(true);
    try {
      const battleState = await wrapApiCall(nextFight)(runUuid);
      navigate('/battle', { state: { runState: battleState } });
    } catch (err) {
      if (err.response?.status !== 410) {
        showError(err.response?.data?.error ?? 'Failed to start next fight.');
      }
      setLoadingReady(false);
    }
  }

  const lootReady = lootAssigned || !lootItem;
  const allActionsDone = Object.values(heroActions).every((v) => v);
  const readyToStart = lootReady && allActionsDone;

  if (!prepResult) return null;

  return (
    <div className="prep-page">
      <div className="prep-content">
        {/* Header */}
        <div>
          <h1 className="prep-header-title">Between Fights</h1>
          <div className="prep-header-subtitle">Prepare your team for the next fight</div>
        </div>

        {/* Regen */}
        <RegenDisplay regenLog={prepResult.regenLog ?? []} heroes={heroes} autoRevivedHeroes={prepResult.autoRevivedHeroes ?? []} />

        {/* Loot */}
        {lootItem && (
          <LootDropPanel
            lootItem={lootItem}
            heroes={heroes}
            onAssignLoot={handleAssignLoot}
            lootAssigned={lootAssigned}
            lootRecipientHeroId={lootRecipientHeroId}
          />
        )}

        {/* Prep actions */}
        <PrepActionPanel
          heroes={heroes}
          heroActions={heroActions}
          onPrepAction={handlePrepAction}
        />

        {/* Ready button */}
        <div className="prep-bottom">
          {!readyToStart && (
            <div className="prep-ready-hint">
              {!lootReady && !allActionsDone
                ? 'Assign loot and complete all hero actions'
                : !lootReady
                  ? 'Assign the loot drop to continue'
                  : 'All heroes must take a prep action'}
            </div>
          )}
          <button
            className="btn-ready"
            onClick={readyToStart && !loadingReady ? handleReady : undefined}
            disabled={!readyToStart || loadingReady}
            style={{
              background: readyToStart ? theme.colors.borderGold : theme.colors.bgPanelDark,
              color: readyToStart ? theme.colors.bgPage : theme.colors.textMuted,
              border: `1px solid ${readyToStart ? theme.colors.borderGold : theme.colors.borderBrown}`,
              cursor: readyToStart && !loadingReady ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => { if (readyToStart) e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { if (readyToStart) e.currentTarget.style.background = theme.colors.borderGold; }}
            onMouseDown={(e) => { if (readyToStart) e.currentTarget.style.background = theme.colors.actionActive; }}
            onMouseUp={(e) => { if (readyToStart) e.currentTarget.style.background = theme.colors.actionHover; }}
          >
            {loadingReady ? 'Loading...' : 'Ready — Next Fight'}
          </button>
        </div>
      </div>

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
