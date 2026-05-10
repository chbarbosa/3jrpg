import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { theme } from '../styles/theme';
import AlertModal from '../components/AlertModal';
import EnemyPanel from '../components/battle/EnemyPanel';
import HeroPanel from '../components/battle/HeroPanel';
import ActionMenu from '../components/battle/ActionMenu';
import TurnOrderBar from '../components/battle/TurnOrderBar';
import CombatLog from '../components/battle/CombatLog';
import { CYCLE_POSITIONS } from '../data/gameConstants';
import { SPELL_LIST } from '../data/spells';
import { STATUS_EFFECTS } from '../data/statusEffects';
import { performAction, startPrep, giveUp, restart, getActiveRun } from '../services/api';
import { playSound } from '../services/sound';

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', confirmLabel: 'OK', cancelLabel: null, onConfirm: null, onCancel: null };

const MAGIC_SOUND_MAP = {
  fire:     'magicFire',
  ice:      'magicIce',
  electric: 'magicElectric',
  arcane:   'magicArcane',
  light:    'magicLight',
};

export default function BattlePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const heroConfigs = location.state?.heroConfigs ?? null;
  const [battleState, setBattleState] = useState(location.state?.runState ?? null);
  const [targeting, setTargeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(MODAL_CLOSED);
  const [proceedingToPrep, setProceedingToPrep] = useState(false);
  const [victoryVisible, setVictoryVisible] = useState(false);

  const [hitHeroIds, setHitHeroIds] = useState(new Set());
  const [combatLogTypes, setCombatLogTypes] = useState(() =>
    (location.state?.runState?.combatLog ?? []).map(() => 'hero')
  );
  const [enemyTurnPending, setEnemyTurnPending] = useState(false);
  const [attackingEnemyId, setAttackingEnemyId] = useState(null);
  const [floatingDamage, setFloatingDamage] = useState([]); // [{id, targetId, value, color}]

  const prevVictoryRef = useRef(false);
  const enemyTurnScheduledRef = useRef(false);
  const enemyTurnTimerRef = useRef(null);
  const prevBattleStateRef = useRef(battleState);

  // Keep a ref that always holds the latest battleState so submitAction's prevState is never stale
  useEffect(() => { prevBattleStateRef.current = battleState; });

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

  // Enemy-turn auto-loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!battleState || battleState.fightOver) {
      enemyTurnScheduledRef.current = false;
      return;
    }
    const heroIds = new Set(battleState.heroes.map((h) => h.id));
    const isEnemyActor = battleState.activeActorId && !heroIds.has(battleState.activeActorId);
    if (!isEnemyActor) {
      enemyTurnScheduledRef.current = false;
      return;
    }
    if (enemyTurnScheduledRef.current) return;
    if (modal.open) return;
    enemyTurnScheduledRef.current = true;
    setEnemyTurnPending(true);
    const actorId = battleState.activeActorId;
    const timerId = setTimeout(() => {
      enemyTurnTimerRef.current = null;
      enemyTurnScheduledRef.current = false;
      setEnemyTurnPending(false);
      submitAction({ actionType: 'ENEMY_TURN', actorId });
    }, 1000);
    enemyTurnTimerRef.current = timerId;
    return () => {
      clearTimeout(timerId);
      enemyTurnTimerRef.current = null;
      enemyTurnScheduledRef.current = false;
      setEnemyTurnPending(false);
    };
  }, [battleState, modal.open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Victory: fade overlay in + play sound once
  useEffect(() => {
    const isVictory = battleState?.fightOver && battleState?.victory;
    if (isVictory && !prevVictoryRef.current) {
      playSound('victory');
      requestAnimationFrame(() => requestAnimationFrame(() => setVictoryVisible(true)));
    }
    if (!isVictory) setVictoryVisible(false);
    prevVictoryRef.current = !!isVictory;
  }, [battleState?.fightOver, battleState?.victory]);

  function closeModal() {
    setModal(MODAL_CLOSED);
  }

  function showError(message) {
    setModal({
      open: true, title: 'Error', message, variant: 'danger',
      confirmLabel: 'OK', cancelLabel: null, onConfirm: closeModal, onCancel: null,
    });
  }

  function findNewLogEntries(prevLog, newLog) {
    for (let len = Math.min(prevLog.length, newLog.length); len >= 0; len--) {
      if (prevLog.slice(prevLog.length - len).every((v, i) => v === newLog[i])) return newLog.slice(len);
    }
    return [...newLog];
  }

  function cancelEnemyTurnTimer() {
    if (enemyTurnTimerRef.current) {
      clearTimeout(enemyTurnTimerRef.current);
      enemyTurnTimerRef.current = null;
    }
    enemyTurnScheduledRef.current = false;
    setEnemyTurnPending(false);
  }

  function showFloatDamage(targetId, value, color) {
    const id = Date.now() + Math.random();
    setFloatingDamage((prev) => [...prev, { id, targetId, value, color }]);
    setTimeout(() => setFloatingDamage((prev) => prev.filter((d) => d.id !== id)), 700);
  }

  async function submitAction({ actionType, actorId, targetId, skillId, spellId, itemId }) {
    setTargeting(null);
    setLoading(true);
    const prevState = prevBattleStateRef.current ?? battleState;

    // Enemy attack animation — set class, then wait for the browser to actually paint
    // it before firing the API call; without the rAF wait the class and the result
    // state update can land in the same commit on fast local responses.
    if (actionType === 'ENEMY_TURN' && actorId) {
      setAttackingEnemyId(actorId);
      setTimeout(() => setAttackingEnemyId(null), 350);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    try {
      const result = await performAction(
        battleState.runUuid, actionType, actorId,
        targetId ?? null, skillId ?? null, spellId ?? null, itemId ?? null,
      );

      // Play sounds for hero actions
      if (actionType === 'ATTACK' || actionType === 'CHANGE_WEAPON') {
        playSound('hit');
      } else if (actionType === 'SKILL') {
        playSound('skill');
      } else if (actionType === 'MAGIC' && spellId) {
        const spellData = SPELL_LIST.find((s) => s.id === spellId);
        const school = spellData?.school ?? 'arcane';
        playSound(MAGIC_SOUND_MAP[school] ?? 'skill');
      } else if (actionType === 'ITEM') {
        playSound('itemUse');
      }

      // Death sounds
      result.enemies?.forEach((enemy) => {
        const prev = prevState.enemies?.find((e) => e.id === enemy.id);
        if (prev && prev.hp > 0 && enemy.hp <= 0) playSound('enemyDeath');
      });
      result.heroes?.forEach((hero) => {
        const prev = prevState.heroes?.find((h) => h.id === hero.id);
        if (prev && !prev.isKnockedOut && hero.isKnockedOut) playSound('heroDeath');
      });

      // Floating damage numbers — enemies hit by hero actions
      if (actionType !== 'ENEMY_TURN') {
        result.enemies?.forEach((enemy) => {
          const prev = prevState.enemies?.find((e) => e.id === enemy.id);
          if (prev && prev.hp > enemy.hp) {
            showFloatDamage(enemy.id, prev.hp - enemy.hp, theme.colors.textHeader);
          }
        });
      }

      // Enemy turn: hit flash + float damage + status floats on heroes
      if (actionType === 'ENEMY_TURN') {
        const hitIds = new Set();
        result.heroes?.forEach((hero) => {
          const prev = prevState.heroes?.find((h) => h.id === hero.id);
          if (prev && prev.hp > hero.hp) {
            hitIds.add(hero.id);
            showFloatDamage(hero.id, prev.hp - hero.hp, theme.colors.statusBleed);
          }
        });
        if (hitIds.size > 0) {
          playSound('hit');
          setHitHeroIds(hitIds);
          setTimeout(() => setHitHeroIds(new Set()), 350);
        }
        result.heroes?.forEach((hero) => {
          const prev = prevState.heroes?.find((h) => h.id === hero.id);
          if (prev) {
            const prevSTypes = new Set(prev.statuses?.map((s) => s.type));
            hero.statuses?.forEach((s) => {
              if (!prevSTypes.has(s.type)) {
                const statusColor = STATUS_EFFECTS[s.type]?.colorKey ?? theme.colors.textMuted;
                const statusLabel = s.type.charAt(0).toUpperCase() + s.type.slice(1);
                showFloatDamage(hero.id, statusLabel, statusColor);
                playSound('statusApply');
              }
            });
          }
        });
      }

      const prevLog = prevState.combatLog ?? [];
      const newLog = result.combatLog ?? [];
      const newEntries = findNewLogEntries(prevLog, newLog);
      const keptCount = newLog.length - newEntries.length;
      setCombatLogTypes((prevTypes) => {
        const kept = prevTypes.slice(prevTypes.length - keptCount);
        const added = newEntries.map(() => actionType === 'ENEMY_TURN' ? 'enemy' : 'hero');
        return [...kept, ...added];
      });

      setBattleState(result);

      if (result.fightOver && !result.victory) {
        navigate('/gameover', { state: { endReason: 'DEFEATED', fightsSurvived: result.fightNumber - 1, heroConfigs } });
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

  function promptChangeWeapon(actorId) {
    setModal({
      open: true, title: 'Change Weapon?',
      message: 'Swapping your weapon costs your turn. Continue?',
      variant: 'warning', confirmLabel: 'Swap', cancelLabel: 'Cancel',
      onConfirm: () => { closeModal(); submitAction({ actionType: 'CHANGE_WEAPON', actorId }); },
      onCancel: closeModal,
    });
  }

  function promptGiveUp() {
    cancelEnemyTurnTimer();
    setModal({
      open: true, title: 'Give Up?',
      message: 'Give up this run? It will count as a defeat.',
      variant: 'danger', confirmLabel: 'Give Up', cancelLabel: 'Cancel',
      onConfirm: handleGiveUp, onCancel: closeModal,
    });
  }

  async function handleGiveUp() {
    closeModal();
    setLoading(true);
    try {
      const result = await giveUp(battleState.runUuid);
      navigate('/gameover', { state: { endReason: 'GAVE_UP', fightsSurvived: result.fightsSurvived ?? battleState.fightNumber - 1, heroConfigs } });
    } catch {
      showError('Failed to give up. Try again.');
      setLoading(false);
    }
  }

  function promptRestart() {
    cancelEnemyTurnTimer();
    setModal({
      open: true, title: 'Restart Run?',
      message: 'Restart with the same team? This run counts as a defeat.',
      variant: 'warning', confirmLabel: 'Restart', cancelLabel: 'Cancel',
      onConfirm: handleRestart, onCancel: closeModal,
    });
  }

  async function handleRestart() {
    closeModal();
    setLoading(true);
    try {
      const newState = await restart(battleState.runUuid);
      setBattleState(newState);
      setTargeting(null);
    } catch {
      showError('Failed to restart. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProceedToPrep() {
    setProceedingToPrep(true);
    try {
      const prepResult = await startPrep(battleState.runUuid);
      navigate('/prep', { state: { prepResult, runUuid: battleState.runUuid } });
    } catch {
      showError('Failed to proceed. Try again.');
      setProceedingToPrep(false);
    }
  }

  if (!battleState) {
    return (
      <div className="page-loading-center">
        <div className="loading-text">Loading battle...</div>
      </div>
    );
  }

  const { fightNumber, cycleModifier, enemies, heroes, turnOrder, activeActorId, combatLog, fightOver, victory } = battleState;

  const activeHero = !fightOver ? heroes.find((h) => h.id === activeActorId && !h.isKnockedOut) : null;
  const heroIds = new Set(heroes.map((h) => h.id));
  const isEnemyTurn = !fightOver && activeActorId && !heroIds.has(activeActorId);
  const cycleLabel = cycleModifier && cycleModifier !== '' ? cycleModifier : null;

  return (
    <div className="battle-page">
      {/* Top bar */}
      <div className="battle-top-bar">
        <div className="battle-top-title">
          Fight #{fightNumber}
        </div>
        {cycleLabel && (
          <div className="battle-top-cycle-label">
            {cycleLabel}
          </div>
        )}
        <div className="battle-top-btns">
          <button
            onClick={promptGiveUp}
            className="btn-danger"
            onMouseEnter={(e) => { e.currentTarget.style.background = '#6B0000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.statusBleed; }}
          >
            Give Up
          </button>
          <button
            onClick={promptRestart}
            className="btn-restart"
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.borderBrown; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          >
            Restart
          </button>
        </div>
      </div>

      {/* Enemy area */}
      <div className="battle-enemy-area">
        <div className="battle-enemy-row">
          {enemies.map((enemy) => (
            <div
              key={enemy.id}
              className={`enemy-float-wrapper${enemy.id === attackingEnemyId ? ' enemy-attacking' : ''}`}
            >
              <EnemyPanel
                enemy={enemy}
                isTargeted={targeting?.mode === 'enemy' && targeting !== null}
                onClick={targeting?.mode === 'enemy' && enemy.hp > 0 ? () => handleEnemyClick(enemy) : null}
              />
              {floatingDamage.filter((d) => d.targetId === enemy.id).map((d) => (
                <span
                  key={d.id}
                  className="float-damage"
                  style={{ color: d.color }}
                >
                  {d.value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Turn order bar */}
      <div className="battle-turn-bar-wrapper">
        <TurnOrderBar
          turnOrder={turnOrder}
          activeActorId={activeActorId}
          heroes={heroes}
          enemies={enemies}
        />
      </div>

      <div className="battle-divider" />

      {/* Bottom area */}
      <div className="battle-bottom">
        {/* Hero area + combat log */}
        <div className="battle-hero-col">
          <div className="battle-heroes-row">
            {heroes.map((hero) => {
              const isAllyTarget = targeting && (targeting.mode === 'ally' || targeting.mode === 'ally-ko');
              const canClickAlly = isAllyTarget && (targeting.mode === 'ally' ? !hero.isKnockedOut : hero.isKnockedOut);
              const isInvalidAllyTarget = isAllyTarget && !canClickAlly;
              return (
                <div
                  key={hero.id}
                  onClick={canClickAlly ? () => handleHeroClick(hero) : undefined}
                  className={`battle-hero-wrapper${hitHeroIds.has(hero.id) ? ' hero-hit' : ''}`}
                  style={{
                    position: 'relative',
                    cursor: canClickAlly ? 'pointer' : 'default',
                    outline: canClickAlly ? `2px solid ${theme.colors.highlight}` : 'none',
                    opacity: isInvalidAllyTarget ? 0.4 : 1,
                  }}
                >
                  <HeroPanel
                    hero={hero}
                    isActive={hero.id === activeActorId && !fightOver}
                  />
                  {floatingDamage.filter((d) => d.targetId === hero.id).map((d) => (
                    <span
                      key={d.id}
                      className="float-damage"
                      style={{ color: d.color }}
                    >
                      {d.value}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
          <CombatLog entries={combatLog ?? []} entryTypes={combatLogTypes} />
        </div>

        {/* Action menu */}
        <div className="battle-action-col">
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
          ) : isEnemyTurn ? (
            <div className="battle-enemy-turn-msg">
              <div
                className="battle-enemy-turn-label"
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-xs)',
                }}
              >
                Enemy is acting
                <span className="pulsing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              </div>
              <div className="battle-enemy-turn-name">
                {enemies.find((e) => e.id === activeActorId)?.name ?? 'Enemy'}
              </div>
            </div>
          ) : !fightOver ? (
            <div className="battle-waiting-msg">
              Waiting...
            </div>
          ) : null}
        </div>
      </div>

      {/* Victory overlay */}
      {fightOver && victory && (
        <div
          className="victory-overlay-panel victory-overlay"
          style={{
            opacity: victoryVisible ? 1 : 0,
            transition: `opacity ${theme.transitions.slow}`,
          }}
        >
          <div
            className="victory-text"
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: 'var(--fs-xxl)',
              fontWeight: 'var(--fw-black)',
              color: theme.colors.highlight,
              transform: victoryVisible ? 'scale(1)' : 'scale(0.8)',
              transition: `transform ${theme.transitions.slow}`,
            }}
          >
            Victory!
          </div>
          <div className="victory-cleared-label">
            Fight #{fightNumber} cleared
          </div>
          <button
            onClick={handleProceedToPrep}
            disabled={proceedingToPrep}
            className="btn-victory-continue"
            style={{ cursor: proceedingToPrep ? 'wait' : 'pointer', opacity: proceedingToPrep ? 0.7 : 1 }}
            onMouseEnter={(e) => { if (!proceedingToPrep) e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { if (!proceedingToPrep) e.currentTarget.style.background = theme.colors.borderGold; }}
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
