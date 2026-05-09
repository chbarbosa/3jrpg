package com.jrpg.battle;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.battle.dto.*;
import com.jrpg.battle.state.*;
import com.jrpg.entity.EndReason;
import com.jrpg.entity.Run;
import com.jrpg.gamedata.GameData;
import com.jrpg.gamedata.GameDataService;
import com.jrpg.repository.RunRepository;
import com.jrpg.run.RunEventService;
import com.jrpg.run.RunService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class BattleService {

    private final RunRepository runRepository;
    private final ObjectMapper objectMapper;
    private final GameDataService gameDataService;
    private final GameLogicService gameLogicService;
    private final MonsterCapService monsterCapService;
    private final LootService lootService;
    private final RunService runService;
    private final RunEventService runEventService;

    // ═══════════════════════════════════════════════════════════════════════
    // Run lifecycle
    // ═══════════════════════════════════════════════════════════════════════

    public BattleStateResponse startRun(UUID playerUuid, StartRunRequest request) {
        runService.findActiveRun(playerUuid).ifPresent(r -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Active run already exists");
        });

        List<HeroConfigDTO> team = request.heroes();
        gameLogicService.validateTeam(team);

        BattleState state = new BattleState();
        state.setHeroes(gameLogicService.buildHeroStates(team));
        state.setFightNumber(1);
        state.setCyclePosition(GameData.cycleModifier(1));
        state.setEnemies(monsterCapService.generateEnemyGroup(1));
        state.setTurnOrder(gameLogicService.buildTurnOrder(state));
        state.setCurrentTurnIndex(0);
        state.setCombatLog(new ArrayList<>());

        Run run = new Run();
        run.setPlayerUuid(playerUuid);
        run.setStartedAt(LocalDateTime.now());
        run.setLastActionAt(LocalDateTime.now());
        run.setFightsSurvived(0);
        saveState(run, state);
        runRepository.save(run);

        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.RUN_STARTED, buildMap(
                "teamComposition", buildTeamComposition(state.getHeroes()),
                "fightNumber", 1));
        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.FIGHT_STARTED, buildMap(
                "fightNumber", 1,
                "enemyGroup", buildEnemyGroupPayload(state.getEnemies()),
                "cycleModifier", state.getCyclePosition()));
        resolveLeadingEnemyTurns(state, run, playerUuid);
        saveState(run, state);
        runRepository.save(run);
        log.info("Run {} started — player {}, fight 1", run.getUuid(), playerUuid);
        return gameLogicService.toBattleStateResponse(run.getUuid(), state);
    }

    public ActionResultResponse processAction(UUID playerUuid, ActionRequest req) {
        Run run = runService.getActiveRunByUuid(req.runUuid());
        runService.validateOwner(run, playerUuid);
        handleTimeoutCheck(run, playerUuid);
        runService.touchRun(run);

        BattleState state = loadState(run);

        if (state.isFightOver()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fight is already over");
        }

        String activeId = gameLogicService.findActiveActorId(state);
        if (!req.actorId().equals(activeId)) {
            log.warn("Invalid actor {} — expected {}", req.actorId(), activeId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not this actor's turn");
        }

        // Snapshot statuses and EN before processing so we can diff afterwards
        Map<String, Set<String>> heroStatusesBefore   = snapshotHeroStatuses(state);
        Map<String, Set<String>> enemyStatusesBefore  = snapshotEnemyStatuses(state);
        int enBefore = req.actorId().startsWith("hero_")
                ? gameLogicService.findHero(state, req.actorId()).getEn() : 0;

        // ENEMY_TURN: frontend-triggered enemy action (shown one at a time with 2s delay)
        if (req.actionType() == ActionType.ENEMY_TURN) {
            String description = gameLogicService.resolveOneEnemyTurn(state);
            boolean defeated = false;
            if (gameLogicService.checkAllEnemiesDead(state)) {
                state.setFightOver(true);
                state.setVictory(true);
                state.getCombatLog().add("Victory! All enemies defeated.");
                log.info("Fight {} won via enemy status tick — run {}", state.getFightNumber(), run.getUuid());
            } else if (gameLogicService.checkAllHeroesDead(state)) {
                state.setFightOver(true);
                state.setVictory(false);
                state.getCombatLog().add("Defeat! All heroes have fallen.");
                defeated = true;
            }
            saveState(run, state);
            runRepository.save(run);
            if (defeated) {
                List<Map<String, Object>> heroFinalStates = buildHeroFinalStates(state);
                runService.closeRun(run, EndReason.DEFEATED);
                runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.RUN_ENDED, buildMap(
                        "endReason", "DEFEATED",
                        "fightsSurvived", run.getFightsSurvived(),
                        "heroFinalStates", heroFinalStates));
            }
            return new ActionResultResponse(gameLogicService.toBattleStateResponse(run.getUuid(), state), description);
        }

        String description;
        try {
            description = gameLogicService.resolveAction(state, req);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error processing action {}: {}", req.actionType(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Game state error");
        }

        gameLogicService.tickHeroStatuses(state);
        // ITEM actions handle their own turn-order repositioning in resolveItem;
        // calling advanceTurn would skip the next actor that the postpone already set up.
        if (req.actionType() != ActionType.ITEM) {
            gameLogicService.advanceTurn(state);
        }
        // Enemy turns are resolved one-at-a-time by the frontend (ENEMY_TURN requests)
        // so we do NOT batch them here after hero actions.

        boolean defeated = false;
        if (gameLogicService.checkAllEnemiesDead(state)) {
            state.setFightOver(true);
            state.setVictory(true);
            state.getCombatLog().add("Victory! All enemies defeated.");
            log.info("Fight {} won — run {}", state.getFightNumber(), run.getUuid());
        } else if (gameLogicService.checkAllHeroesDead(state)) {
            state.setFightOver(true);
            state.setVictory(false);
            state.getCombatLog().add("Defeat! All heroes have fallen.");
            defeated = true;
        }

        saveState(run, state);
        runRepository.save(run);

        int enAfter  = req.actorId().startsWith("hero_")
                ? gameLogicService.findHero(state, req.actorId()).getEn() : 0;
        int enSpent  = Math.max(0, enBefore - enAfter);

        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.COMBAT_ACTION, buildMap(
                "actor",       req.actorId(),
                "actionType",  req.actionType().name(),
                "target",      String.valueOf(req.targetId()),
                "description", description,
                "enSpent",     enSpent,
                "fightNumber", state.getFightNumber()));

        if (req.actionType() == ActionType.ITEM && req.itemId() != null) {
            runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.ITEM_USED, buildMap(
                    "hero",         req.actorId(),
                    "itemName",     req.itemId(),
                    "effectResult", description));
        }

        logStatusChanges(run.getUuid(), playerUuid, heroStatusesBefore, enemyStatusesBefore, state);

        if (defeated) {
            List<Map<String, Object>> heroFinalStates = buildHeroFinalStates(state);
            runService.closeRun(run, EndReason.DEFEATED);
            runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.RUN_ENDED, buildMap(
                    "endReason",      "DEFEATED",
                    "fightsSurvived", run.getFightsSurvived(),
                    "heroFinalStates", heroFinalStates));
            log.info("Run {} ended DEFEATED", run.getUuid());
        }

        log.info("Action {} by {} resolved: {}", req.actionType(), req.actorId(), description);
        return new ActionResultResponse(gameLogicService.toBattleStateResponse(run.getUuid(), state), description);
    }

    public BattleStateResponse nextFight(UUID playerUuid, UUID runUuid) {
        Run run = runService.getActiveRunByUuid(runUuid);
        runService.validateOwner(run, playerUuid);
        handleTimeoutCheck(run, playerUuid);
        runService.touchRun(run);

        BattleState state = loadState(run);
        if (!state.isFightOver() || !state.isVictory()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current fight not won yet");
        }

        run.setFightsSurvived(run.getFightsSurvived() + 1);
        int nextFight = state.getFightNumber() + 1;

        state.setFightNumber(nextFight);
        state.setCyclePosition(GameData.cycleModifier(nextFight));
        state.setEnemies(monsterCapService.generateEnemyGroup(nextFight));
        gameLogicService.resetPerBattleBuffs(state.getHeroes());
        log.info("Hero states reset for new fight {} — heroes: {}", nextFight,
                state.getHeroes().stream().map(h -> h.getName() != null ? h.getName() : h.getClassId())
                        .collect(Collectors.joining(", ")));
        state.setTurnOrder(gameLogicService.buildTurnOrder(state));
        state.setCurrentTurnIndex(0);
        state.setFightOver(false);
        state.setVictory(false);
        state.setCombatLog(new ArrayList<>());
        state.setPrepPhase(false);
        state.setHeroPrepTaken(new HashMap<>());
        state.setPendingLoot(null);

        saveState(run, state);
        runRepository.save(run);
        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.FIGHT_STARTED, buildMap(
                "fightNumber",   nextFight,
                "enemyGroup",    buildEnemyGroupPayload(state.getEnemies()),
                "cycleModifier", state.getCyclePosition()));
        resolveLeadingEnemyTurns(state, run, playerUuid);
        saveState(run, state);
        runRepository.save(run);
        log.info("Fight {} started — run {}", nextFight, run.getUuid());
        return gameLogicService.toBattleStateResponse(run.getUuid(), state);
    }

    public PrepResultResponse startPrep(UUID playerUuid, UUID runUuid) {
        Run run = runService.getActiveRunByUuid(runUuid);
        runService.validateOwner(run, playerUuid);
        handleTimeoutCheck(run, playerUuid);
        runService.touchRun(run);

        BattleState state = loadState(run);
        if (!state.isFightOver() || !state.isVictory()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prep only available after a victory");
        }
        if (state.isPrepPhase()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prep phase already started");
        }

        List<String> regenLog = new ArrayList<>();
        List<Map<String, Object>> regenDetails = new ArrayList<>();
        for (HeroState hero : state.getHeroes()) {
            if (!hero.isKnockedOut()) {
                int hpGain = ThreadLocalRandom.current().nextInt(1, 4);
                int enGain = ThreadLocalRandom.current().nextInt(1, 3);
                hero.setHp(Math.min(hero.getHp() + hpGain, hero.getMaxHp()));
                hero.setEn(Math.min(hero.getEn() + enGain, hero.getMaxEn()));
                String heroLabel = hero.getName() != null ? hero.getName() : hero.getClassId();
                regenLog.add(heroLabel + " recovers " + hpGain + " HP and " + enGain + " EN.");
                Map<String, Object> detail = new LinkedHashMap<>();
                detail.put("heroId", hero.getId());
                detail.put("classId", hero.getClassId());
                detail.put("hpGain", hpGain);
                detail.put("enGain", enGain);
                regenDetails.add(detail);
            }
        }

        // Auto-revive knocked-out heroes with random 1–2 HP
        List<HeroState> autoRevived = new ArrayList<>();
        for (HeroState hero : state.getHeroes()) {
            if (hero.isKnockedOut()) {
                int reviveHp = ThreadLocalRandom.current().nextInt(1, 3); // 1 or 2
                hero.setKnockedOut(false);
                hero.setHp(reviveHp);
                hero.getStatuses().clear();
                String heroLabel = hero.getName() != null ? hero.getName() : hero.getClassId();
                regenLog.add(heroLabel + " is revived with " + reviveHp + " HP.");
                autoRevived.add(hero);
                runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.AUTO_REVIVE, buildMap(
                        "heroId", hero.getId(),
                        "heroName", heroLabel,
                        "hpRestored", reviveHp));
            }
        }

        int cap = GameData.monsterCap(state.getFightNumber());
        LootItemDTO loot = lootService.generateLootDrop(cap);
        state.setPendingLoot(loot);
        state.setPrepPhase(true);

        Map<String, Boolean> prepMap = new HashMap<>();
        state.getHeroes().forEach(h -> prepMap.put(h.getId(), false));
        state.setHeroPrepTaken(prepMap);

        saveState(run, state);
        runRepository.save(run);
        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.PREP_PHASE_STARTED, buildMap(
                "fightNumber",  state.getFightNumber(),
                "regenDetails", regenDetails));

        List<HeroStateDTO> autoRevivedDTOs = gameLogicService.toHeroDTOs(autoRevived);
        return new PrepResultResponse(gameLogicService.toHeroDTOs(state.getHeroes()), regenLog, loot, autoRevivedDTOs);
    }

    public List<HeroStateDTO> assignLoot(UUID playerUuid, LootAssignRequest req) {
        Run run = runService.getActiveRunByUuid(req.runUuid());
        runService.validateOwner(run, playerUuid);

        BattleState state = loadState(run);
        if (!state.isPrepPhase()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not in prep phase");
        }
        if (state.getPendingLoot() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending loot to assign");
        }

        HeroState hero = gameLogicService.findHero(state, req.recipientHeroId());
        LootItemDTO loot = state.getPendingLoot();

        if ("CONSUMABLE".equals(loot.itemType())) {
            String itemId = gameDataService.allItemIds().stream()
                    .filter(id -> gameDataService.findItem(id)
                            .map(i -> loot.name().toLowerCase().contains(i.name().toLowerCase()))
                            .orElse(false))
                    .findFirst()
                    .orElse("healingPotion");
            gameLogicService.addToInventory(hero, itemId, 1);
        } else {
            gameLogicService.addLootToInventory(hero, loot);
        }
        state.setPendingLoot(null);
        saveState(run, state);
        runRepository.save(run);
        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.LOOT_ASSIGNED, buildMap(
                "heroId",    req.recipientHeroId(),
                "itemName",  loot.name(),
                "quality",   loot.quality(),
                "modifiers", loot.modifiers() != null ? loot.modifiers() : List.of()));

        return gameLogicService.toHeroDTOs(state.getHeroes());
    }

    public List<HeroStateDTO> processPrepAction(UUID playerUuid, PrepActionRequest req) {
        Run run = runService.getActiveRunByUuid(req.runUuid());
        runService.validateOwner(run, playerUuid);

        BattleState state = loadState(run);
        if (!state.isPrepPhase()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not in prep phase");
        }
        if (Boolean.TRUE.equals(state.getHeroPrepTaken().get(req.heroId()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hero already used prep action");
        }

        HeroState actor = gameLogicService.findHero(state, req.heroId());

        switch (req.actionType()) {
            case USE_ITEM -> {
                if (req.itemId() == null)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemId required");
                gameLogicService.consumeItem(state, actor, req.targetHeroId(), req.itemId());
            }
            case SWAP_GEAR -> {
                if (req.itemUuid() != null) {
                    // Equip a loot item from inventory
                    if (req.equipSlot() == null)
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "equipSlot required when equipping loot");
                    gameLogicService.equipLootItemFromInventory(actor, req.itemUuid(), req.equipSlot());
                } else {
                    // Legacy: swap primary weapon by weaponId
                    if (req.itemId() == null)
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemId (weapon) or itemUuid required");
                    swapWeapon(actor, req.itemId());
                }
            }
            case REVIVE -> {
                if (req.targetHeroId() == null)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetHeroId required");
                HeroState target = gameLogicService.findHero(state, req.targetHeroId());
                if (!target.isKnockedOut())
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target is not knocked out");
                gameLogicService.reviveHero(target);
            }
            case PASS -> { /* no-op */ }
        }

        state.getHeroPrepTaken().put(req.heroId(), true);
        saveState(run, state);
        runRepository.save(run);

        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.PREP_ACTION, buildMap(
                "hero",         req.heroId(),
                "actionType",   req.actionType().name(),
                "targetHeroId", String.valueOf(req.targetHeroId()),
                "itemId",       String.valueOf(req.itemId())));

        if (req.actionType() == PrepActionType.USE_ITEM && req.itemId() != null) {
            runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.ITEM_USED, buildMap(
                    "hero",         req.heroId(),
                    "itemName",     req.itemId(),
                    "effectResult", "used during prep phase"));
        }

        return gameLogicService.toHeroDTOs(state.getHeroes());
    }

    public Map<String, Object> giveUp(UUID playerUuid, GiveUpRequest req) {
        Run run = runService.getActiveRunByUuid(req.runUuid());
        runService.validateOwner(run, playerUuid);
        BattleState state = loadState(run);
        List<Map<String, Object>> heroFinalStates = buildHeroFinalStates(state);
        runService.closeRun(run, EndReason.GAVE_UP);
        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.RUN_ENDED, buildMap(
                "endReason",       "GAVE_UP",
                "fightsSurvived",  run.getFightsSurvived(),
                "heroFinalStates", heroFinalStates));
        log.info("Player {} gave up after {} fights — run {}", playerUuid, run.getFightsSurvived(), run.getUuid());
        return Map.of("fightsSurvived", run.getFightsSurvived());
    }

    public BattleStateResponse restart(UUID playerUuid, RestartRequest req) {
        Run run = runService.getActiveRunByUuid(req.runUuid());
        runService.validateOwner(run, playerUuid);

        BattleState oldState = loadState(run);
        List<Map<String, Object>> heroFinalStates = buildHeroFinalStates(oldState);
        runService.closeRun(run, EndReason.RESTARTED);
        runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.RUN_ENDED, buildMap(
                "endReason",       "RESTARTED",
                "fightsSurvived",  run.getFightsSurvived(),
                "heroFinalStates", heroFinalStates));

        List<HeroState> freshHeroes = new ArrayList<>();
        List<HeroState> old = oldState.getHeroes();
        for (int i = 0; i < old.size(); i++) {
            HeroState h = old.get(i);
            HeroConfigDTO cfg = new HeroConfigDTO(
                    h.getClassId(), h.getAugmentationId(), h.getAdvantageId(),
                    h.getEquippedWeaponId(), null, h.getEquippedArmorId(), null, null, null);
            HeroState fresh = gameLogicService.buildHeroStates(List.of(cfg)).get(0);
            fresh.setId("hero_" + i);
            freshHeroes.add(fresh);
        }

        BattleState newState = new BattleState();
        newState.setHeroes(freshHeroes);
        newState.setFightNumber(1);
        newState.setCyclePosition(GameData.cycleModifier(1));
        newState.setEnemies(monsterCapService.generateEnemyGroup(1));
        newState.setTurnOrder(gameLogicService.buildTurnOrder(newState));
        newState.setCurrentTurnIndex(0);
        newState.setCombatLog(new ArrayList<>());

        Run newRun = new Run();
        newRun.setPlayerUuid(playerUuid);
        newRun.setStartedAt(LocalDateTime.now());
        newRun.setLastActionAt(LocalDateTime.now());
        newRun.setFightsSurvived(0);
        saveState(newRun, newState);
        runRepository.save(newRun);

        runEventService.logEvent(newRun.getUuid(), playerUuid, RunEventService.RUN_STARTED, buildMap(
                "teamComposition", buildTeamComposition(newState.getHeroes()),
                "fightNumber",     1,
                "restart",         true));
        runEventService.logEvent(newRun.getUuid(), playerUuid, RunEventService.FIGHT_STARTED, buildMap(
                "fightNumber",   1,
                "enemyGroup",    buildEnemyGroupPayload(newState.getEnemies()),
                "cycleModifier", newState.getCyclePosition()));
        resolveLeadingEnemyTurns(newState, newRun, playerUuid);
        saveState(newRun, newState);
        runRepository.save(newRun);
        log.info("Player {} restarted — new run {}", playerUuid, newRun.getUuid());
        return gameLogicService.toBattleStateResponse(newRun.getUuid(), newState);
    }

    /**
     * Returns the current active run as a BattleStateResponse for the given player,
     * or empty if the player has no open run. Used by GET /api/run/active.
     */
    public Optional<BattleStateResponse> getActiveRunState(UUID playerUuid) {
        return runService.findActiveRun(playerUuid)
                .map(run -> gameLogicService.toBattleStateResponse(run.getUuid(), loadState(run)));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Leading enemy turn resolution (new fight starts with enemy first)
    // ═══════════════════════════════════════════════════════════════════════

    private void resolveLeadingEnemyTurns(BattleState state, Run run, UUID playerUuid) {
        int limit = state.getTurnOrder().size() + 1;
        for (int guard = 0; guard < limit; guard++) {
            if (state.isFightOver()) break;
            String activeId = gameLogicService.findActiveActorId(state);
            if (activeId == null || activeId.startsWith("hero_")) break;
            String description = gameLogicService.resolveOneEnemyTurn(state);
            runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.COMBAT_ACTION, buildMap(
                    "actor",       activeId,
                    "actionType",  "ENEMY_TURN",
                    "description", description,
                    "fightNumber", state.getFightNumber()));
            if (gameLogicService.checkAllHeroesDead(state)) {
                state.setFightOver(true);
                state.setVictory(false);
                state.getCombatLog().add("Defeat! All heroes have fallen.");
                break;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Timeout check
    // ═══════════════════════════════════════════════════════════════════════

    private void handleTimeoutCheck(Run run, UUID playerUuid) {
        if (runService.isTimedOut(run)) {
            runService.closeRun(run, EndReason.TIMEOUT);
            runEventService.logEvent(run.getUuid(), playerUuid, RunEventService.RUN_ENDED, buildMap(
                    "endReason",      "TIMEOUT",
                    "fightsSurvived", run.getFightsSurvived()));
            throw new TimeoutException(run.getFightsSurvived());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // State persistence
    // ═══════════════════════════════════════════════════════════════════════

    private BattleState loadState(Run run) {
        try {
            return objectMapper.readValue(run.getTeamSnapshot(), BattleState.class);
        } catch (Exception e) {
            log.error("Failed to deserialize battle state for run {}: {}", run.getUuid(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid game state");
        }
    }

    private void saveState(Run run, BattleState state) {
        try {
            run.setTeamSnapshot(objectMapper.writeValueAsString(state));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize battle state: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Game state error");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Status-change audit logging
    // ═══════════════════════════════════════════════════════════════════════

    private Map<String, Set<String>> snapshotHeroStatuses(BattleState state) {
        return state.getHeroes().stream().collect(Collectors.toMap(
                HeroState::getId,
                h -> h.getStatuses().stream().map(ActiveStatus::getType).collect(Collectors.toSet())));
    }

    private Map<String, Set<String>> snapshotEnemyStatuses(BattleState state) {
        return state.getEnemies().stream().collect(Collectors.toMap(
                EnemyState::getId,
                e -> e.getStatuses().stream().map(ActiveStatus::getType).collect(Collectors.toSet())));
    }

    private void logStatusChanges(UUID runUuid, UUID playerUuid,
                                   Map<String, Set<String>> heroStatusesBefore,
                                   Map<String, Set<String>> enemyStatusesBefore,
                                   BattleState state) {
        for (HeroState h : state.getHeroes()) {
            Set<String> before = heroStatusesBefore.getOrDefault(h.getId(), Set.of());
            Set<String> after  = h.getStatuses().stream()
                    .map(ActiveStatus::getType).collect(Collectors.toSet());
            after.stream().filter(s -> !before.contains(s)).forEach(s ->
                    runEventService.logEvent(runUuid, playerUuid, RunEventService.STATUS_APPLIED, buildMap(
                            "target", h.getId(), "statusName", s, "source", "combat")));
            before.stream().filter(s -> !after.contains(s)).forEach(s ->
                    runEventService.logEvent(runUuid, playerUuid, RunEventService.STATUS_EXPIRED, buildMap(
                            "target", h.getId(), "statusName", s)));
        }
        for (EnemyState e : state.getEnemies()) {
            Set<String> before = enemyStatusesBefore.getOrDefault(e.getId(), Set.of());
            Set<String> after  = e.getStatuses().stream()
                    .map(ActiveStatus::getType).collect(Collectors.toSet());
            after.stream().filter(s -> !before.contains(s)).forEach(s ->
                    runEventService.logEvent(runUuid, playerUuid, RunEventService.STATUS_APPLIED, buildMap(
                            "target", e.getId(), "statusName", s, "source", "combat")));
            before.stream().filter(s -> !after.contains(s)).forEach(s ->
                    runEventService.logEvent(runUuid, playerUuid, RunEventService.STATUS_EXPIRED, buildMap(
                            "target", e.getId(), "statusName", s)));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Event payload builders
    // ═══════════════════════════════════════════════════════════════════════

    private List<Map<String, Object>> buildTeamComposition(List<HeroState> heroes) {
        return heroes.stream().map(h -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("heroId",      h.getId());
            m.put("classId",     h.getClassId());
            m.put("augmentation", h.getAugmentationId() != null ? h.getAugmentationId() : "");
            m.put("weapon",      h.getEquippedWeaponId() != null ? h.getEquippedWeaponId() : "");
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildEnemyGroupPayload(List<EnemyState> enemies) {
        return enemies.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",   e.getId());
            m.put("name", e.getName());
            m.put("type", e.getType());
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildHeroFinalStates(BattleState state) {
        return state.getHeroes().stream().map(h -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("classId",     h.getClassId());
            m.put("hp",          h.getHp());
            m.put("maxHp",       h.getMaxHp());
            m.put("en",          h.getEn());
            m.put("maxEn",       h.getMaxEn());
            m.put("isKnockedOut", h.isKnockedOut());
            return m;
        }).collect(Collectors.toList());
    }

    /** Varargs helper to build a Map<String,Object> inline without unchecked-cast warnings. */
    private static Map<String, Object> buildMap(Object... keysAndValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keysAndValues.length - 1; i += 2) {
            map.put(String.valueOf(keysAndValues[i]), keysAndValues[i + 1]);
        }
        return map;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Weapon swap (prep phase)
    // ═══════════════════════════════════════════════════════════════════════

    private void swapWeapon(HeroState actor, String weaponId) {
        var weapon = gameDataService.findWeapon(weaponId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unknown weapon: " + weaponId));
        if (!weapon.equippableBy().contains(actor.getClassId())) {
            var heroClass = gameDataService.findClass(actor.getClassId()).orElseThrow();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    heroClass.name() + " cannot equip " + weapon.name());
        }
        if ("greatsword".equals(actor.getEquippedWeaponId())) actor.setDex(actor.getDex() + 1);
        actor.setEquippedWeaponId(weaponId);
        if ("greatsword".equals(weaponId)) actor.setDex(Math.max(1, actor.getDex() - 1));
    }
}
