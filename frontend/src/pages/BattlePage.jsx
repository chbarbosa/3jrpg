import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { theme } from '../styles/theme';
import AlertModal from '../components/AlertModal';
import EnemyPanel from '../components/battle/EnemyPanel';
import HeroPanel from '../components/battle/HeroPanel';
import ActionMenu from '../components/battle/ActionMenu';
import TurnOrderBar from '../components/battle/TurnOrderBar';
import CombatLog from '../components/battle/CombatLog';
import { CYCLE_POSITIONS } from '../data/gameConstants';
import { performAction, nextFight, giveUp, restart, getActiveRun } from '../services/api';

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', confirmLabel: 'OK', cancelLabel: null, onConfirm: null, onCancel: null };

export default function BattlePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [battleState, setBattleState] = useState(location.state?.runState ?? null);
  const [targeting, setTargeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(MODAL_CLOSED);
  const [proceedingToPrep, setProceedingToPrep] = useState(false);

  // Restore active run on page load if no state passed
  useEffect(() => {
    if (!battleState) {
      getActiveRun()
        .then((state) => {
          if (state) setBattleState(state);
          else navigate('/select', { replace: true });
        })
        .catch(() => navigate('/select', { replace: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeModal() {
    setModal(MODAL_CLOSED);
  }

  function showError(message) {
    setModal({
      open: true,
      title: 'Error',
      message,
      variant: 'danger',
      confirmLabel: 'OK',
      cancelLabel: null,
      onConfirm: closeModal,
      onCancel: null,
    });
  }

  // ── Action submission ────────────────────────────────────────────────────

  async function submitAction({ actionType, actorId, targetId, skillId, spellId, itemId }) {
    setTargeting(null);
    setLoading(true);
    try {
      const result = await performAction(
        battleState.runUuid,
        actionType,
        actorId,
        targetId ?? null,
        skillId ?? null,
        spellId ?? null,
        itemId ?? null,
      );
      setBattleState(result);
      if (result.fightOver && !result.victory) {
        navigate('/gameover', { state: { endReason: 'DEFEATED', fightsSurvived: result.fightNumber - 1 } });
      }
    } catch (err) {
      showError(err.response?.data?.error ?? err.message ?? 'Action failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleBeginTarget(targetingConfig) {
    setTargeting(targetingConfig);
  }

  function handleCancelTarget() {
    setTargeting(null);
  }

  function handleEnemyClick(enemy) {
    if (!targeting || targeting.mode !== 'enemy') return;
    submitAction({ ...targeting, targetId: enemy.id });
  }

  function handleHeroClick(hero) {
    if (!targeting) return;
    if (targeting.mode === 'ally' || targeting.mode === 'ally-ko') {
      submitAction({ ...targeting, targetId: hero.id });
    }
  }

  // ── Weapon swap ──────────────────────────────────────────────────────────

  function promptChangeWeapon(actorId) {
    setModal({
      open: true,
      title: 'Change Weapon?',
      message: 'Swapping your weapon costs your turn. Continue?',
      variant: 'warning',
      confirmLabel: 'Swap',
      cancelLabel: 'Cancel',
      onConfirm: () => { closeModal(); submitAction({ actionType: 'CHANGE_WEAPON', actorId }); },
      onCancel: closeModal,
    });
  }

  // ── Give Up ──────────────────────────────────────────────────────────────

  function promptGiveUp() {
    setModal({
      open: true,
      title: 'Give Up?',
      message: 'Give up this run? It will count as a defeat.',
      variant: 'danger',
      confirmLabel: 'Give Up',
      cancelLabel: 'Cancel',
      onConfirm: handleGiveUp,
      onCancel: closeModal,
    });
  }

  async function handleGiveUp() {
    closeModal();
    setLoading(true);
    try {
      const result = await giveUp(battleState.runUuid);
      navigate('/gameover', { state: { endReason: 'GAVE_UP', fightsSurvived: result.fightsSurvived ?? battleState.fightNumber - 1 } });
    } catch (err) {
      showError('Failed to give up. Try again.');
      setLoading(false);
    }
  }

  // ── Restart ──────────────────────────────────────────────────────────────

  function promptRestart() {
    setModal({
      open: true,
      title: 'Restart Run?',
      message: 'Restart with the same team? This run counts as a defeat.',
      variant: 'warning',
      confirmLabel: 'Restart',
      cancelLabel: 'Cancel',
      onConfirm: handleRestart,
      onCancel: closeModal,
    });
  }

  async function handleRestart() {
    closeModal();
    setLoading(true);
    try {
      const newState = await restart(battleState.runUuid);
      setBattleState(newState);
      setTargeting(null);
    } catch (err) {
      showError('Failed to restart. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Victory — proceed to prep ────────────────────────────────────────────

  async function handleProceedToPrep() {
    setProceedingToPrep(true);
    try {
      const prepResult = await nextFight(battleState.runUuid);
      navigate('/prep', { state: { prepResult } });
    } catch (err) {
      showError('Failed to proceed. Try again.');
      setProceedingToPrep(false);
    }
  }

  // ── Render guard ─────────────────────────────────────────────────────────

  if (!battleState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.colors.bgPage }}>
        <div style={{ fontFamily: theme.fonts.body, color: theme.colors.textMuted }}>Loading battle...</div>
      </div>
    );
  }

  const { runUuid, fightNumber, cycleModifier, enemies, heroes, turnOrder, activeActorId, combatLog, fightOver, victory } = battleState;

  const activeHero = !fightOver ? heroes.find((h) => h.id === activeActorId && !h.isKnockedOut) : null;

  const cycleLabel = cycleModifier && cycleModifier !== '' ? cycleModifier : null;

  // ── Layout styles ────────────────────────────────────────────────────────

  const pageStyle = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: theme.colors.bgPage,
    overflow: 'hidden',
  };

  const topBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    background: theme.colors.bgPanel,
    borderBottom: `1px solid ${theme.colors.borderBrown}`,
    flexShrink: 0,
  };

  const topBtnBase = {
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.sm,
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    border: 'none',
    fontWeight: theme.fontWeights.bold,
    transition: `background ${theme.transitions.fast}`,
  };

  return (
    <div style={pageStyle}>
      {/* ── Top bar ── */}
      <div style={topBarStyle}>
        <div style={{ fontFamily: theme.fonts.header, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.bold, color: theme.colors.textHeader }}>
          Fight #{fightNumber}
        </div>
        {cycleLabel && (
          <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, fontStyle: 'italic' }}>
            {cycleLabel}
          </div>
        )}
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <button
            onClick={promptGiveUp}
            disabled={loading}
            style={{ ...topBtnBase, background: theme.colors.statusBleed, color: theme.colors.bgPage }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#6B0000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.statusBleed; }}
          >
            Give Up
          </button>
          <button
            onClick={promptRestart}
            disabled={loading}
            style={{ ...topBtnBase, background: theme.colors.bgPanelDark, color: theme.colors.textPrimary, border: `1px solid ${theme.colors.borderBrown}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.borderBrown; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          >
            Restart
          </button>
        </div>
      </div>

      {/* ── Enemy area ── */}
      <div style={{
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end' }}>
          {enemies.map((enemy) => (
            <EnemyPanel
              key={enemy.id}
              enemy={enemy}
              isTargeted={targeting?.mode === 'enemy' && targeting !== null}
              onClick={targeting?.mode === 'enemy' && enemy.hp > 0 ? () => handleEnemyClick(enemy) : null}
            />
          ))}
        </div>
      </div>

      {/* ── Turn order bar ── */}
      <div style={{
        background: theme.colors.bgPanel,
        borderTop: `1px solid ${theme.colors.borderBrown}`,
        flexShrink: 0,
      }}>
        <TurnOrderBar
          turnOrder={turnOrder}
          activeActorId={activeActorId}
          heroes={heroes}
          enemies={enemies}
        />
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: theme.colors.borderBrown, flexShrink: 0 }} />

      {/* ── Bottom area ── */}
      <div style={{
        display: 'flex',
        flexShrink: 0,
        height: '42vh',
        overflow: 'hidden',
      }}>
        {/* Hero area + combat log — 65% */}
        <div style={{
          flex: '0 0 65%',
          display: 'flex',
          flexDirection: 'column',
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', gap: theme.spacing.sm, flex: 1, overflow: 'hidden' }}>
            {heroes.map((hero) => {
              const isAllyTarget = targeting && (targeting.mode === 'ally' || targeting.mode === 'ally-ko');
              const canClickAlly = isAllyTarget && (targeting.mode === 'ally' ? !hero.isKnockedOut : hero.isKnockedOut);
              return (
                <div
                  key={hero.id}
                  onClick={canClickAlly ? () => handleHeroClick(hero) : undefined}
                  style={{
                    flex: 1,
                    cursor: canClickAlly ? 'pointer' : 'default',
                    outline: canClickAlly ? `2px solid ${theme.colors.highlight}` : 'none',
                    borderRadius: theme.radius.md,
                    transition: `outline ${theme.transitions.fast}`,
                  }}
                >
                  <HeroPanel
                    hero={hero}
                    isActive={hero.id === activeActorId && !fightOver}
                  />
                </div>
              );
            })}
          </div>
          <CombatLog entries={combatLog ?? []} />
        </div>

        {/* Action menu — 35% */}
        <div style={{
          flex: '0 0 35%',
          padding: theme.spacing.md,
          borderLeft: `1px solid ${theme.colors.borderBrown}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {activeHero ? (
            <ActionMenu
              hero={activeHero}
              targeting={targeting}
              onBeginTarget={handleBeginTarget}
              onAction={submitAction}
              onChangeWeapon={() => promptChangeWeapon(activeHero.id)}
              onCancelTarget={handleCancelTarget}
              isLoading={loading}
            />
          ) : !fightOver ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              fontStyle: 'italic',
            }}>
              Waiting...
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Victory overlay ── */}
      {fightOver && victory && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: theme.colors.overlayBg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.lg,
          zIndex: 50,
        }}>
          <div style={{
            fontFamily: theme.fonts.header,
            fontSize: theme.fontSizes.xxl,
            fontWeight: theme.fontWeights.black,
            color: theme.colors.highlight,
          }}>
            Victory!
          </div>
          <div style={{ fontSize: theme.fontSizes.md, color: theme.colors.bgPage }}>
            Fight #{fightNumber} cleared
          </div>
          <button
            onClick={handleProceedToPrep}
            disabled={proceedingToPrep}
            style={{
              fontFamily: theme.fonts.header,
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.bold,
              padding: `${theme.spacing.sm} ${theme.spacing.xl}`,
              background: theme.colors.borderGold,
              color: theme.colors.bgPage,
              border: 'none',
              borderRadius: theme.radius.md,
              cursor: proceedingToPrep ? 'wait' : 'pointer',
              opacity: proceedingToPrep ? 0.7 : 1,
            }}
          >
            {proceedingToPrep ? 'Loading...' : 'Continue →'}
          </button>
        </div>
      )}

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
