package com.jrpg.battle;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.battle.dto.*;
import com.jrpg.battle.state.*;
import com.jrpg.entity.EndReason;
import com.jrpg.entity.Run;
import com.jrpg.entity.RunEvent;
import com.jrpg.gamedata.GameData;
import com.jrpg.gamedata.GameDataService;
import com.jrpg.repository.PlayerRepository;
import com.jrpg.repository.RunEventRepository;
import com.jrpg.repository.RunRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@RequiredArgsConstructor
public class BattleService {

    private final RunRepository runRepository;
    private final RunEventRepository runEventRepository;
    private final PlayerRepository playerRepository;
    private final ObjectMapper objectMapper;
    private final GameDataService gameDataService;
    private final GameLogicService gameLogicService;
    private final MonsterCapService monsterCapService;
    private final LootService lootService;

    // ═══════════════════════════════════════════════════════════════════════
    // Run lifecycle
    // ═══════════════════════════════════════════════════════════════════════

    public BattleStateResponse startRun(UUID playerUuid, StartRunRequest request) {
        runRepository.findByPlayerUuidAndEndedAtIsNull(playerUuid).ifPresent(r -> {
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

        saveEvent(run.getUuid(), "RUN_STARTED", Map.of("teamSize", 3, "fightNumber", 1));
        log.info("Run {} started — player {}, fight 1", run.getUuid(), playerUuid);
        return gameLogicService.toBattleStateResponse(run.getUuid(), state);
    }

    public ActionResultResponse processAction(UUID playerUuid, ActionRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);
        checkTimeout(run);
        run.setLastActionAt(LocalDateTime.now());

        BattleState state = loadState(run);

        if (state.isFightOver()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fight is already over");
        }

        String activeId = gameLogicService.findActiveActorId(state);
        if (!req.actorId().equals(activeId)) {
            log.warn("Invalid actor {} — expected {}", req.actorId(), activeId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not this actor's turn");
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
        gameLogicService.advanceTurn(state);
        gameLogicService.resolveEnemyTurns(state);

        if (gameLogicService.checkAllEnemiesDead(state)) {
            state.setFightOver(true);
            state.setVictory(true);
            state.getCombatLog().add("Victory! All enemies defeated.");
            log.info("Fight {} won — run {}", state.getFightNumber(), run.getUuid());
        } else if (gameLogicService.checkAllHeroesDead(state)) {
            state.setFightOver(true);
            state.setVictory(false);
            state.getCombatLog().add("Defeat! All heroes have fallen.");
            closeRun(run, EndReason.DEFEATED);
            log.info("Run {} ended DEFEATED", run.getUuid());
        }

        saveState(run, state);
        runRepository.save(run);
        saveEvent(run.getUuid(), "COMBAT_ACTION", Map.of(
                "actor", req.actorId(), "action", req.actionType().name(),
                "target", String.valueOf(req.targetId()), "description", description));
        log.info("Action {} by {} resolved: {}", req.actionType(), req.actorId(), description);

        return new ActionResultResponse(gameLogicService.toBattleStateResponse(run.getUuid(), state), description);
    }

    public BattleStateResponse nextFight(UUID playerUuid, UUID runUuid) {
        Run run = getActiveRun(runUuid);
        validateOwner(run, playerUuid);
        checkTimeout(run);
        run.setLastActionAt(LocalDateTime.now());

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
        saveEvent(run.getUuid(), "FIGHT_STARTED", Map.of("fightNumber", nextFight));
        log.info("Fight {} started — run {}", nextFight, run.getUuid());
        return gameLogicService.toBattleStateResponse(run.getUuid(), state);
    }

    public PrepResultResponse startPrep(UUID playerUuid, UUID runUuid) {
        Run run = getActiveRun(runUuid);
        validateOwner(run, playerUuid);
        checkTimeout(run);
        run.setLastActionAt(LocalDateTime.now());

        BattleState state = loadState(run);
        if (!state.isFightOver() || !state.isVictory()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prep only available after a victory");
        }
        if (state.isPrepPhase()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prep phase already started");
        }

        List<String> regenLog = new ArrayList<>();
        for (HeroState hero : state.getHeroes()) {
            if (!hero.isKnockedOut()) {
                int hpGain = ThreadLocalRandom.current().nextInt(1, 4); // 1–3
                int enGain = ThreadLocalRandom.current().nextInt(1, 3); // 1–2
                hero.setHp(Math.min(hero.getHp() + hpGain, hero.getMaxHp()));
                hero.setEn(Math.min(hero.getEn() + enGain, hero.getMaxEn()));
                regenLog.add(hero.getClassId() + " recovers " + hpGain + " HP and " + enGain + " EN.");
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
        saveEvent(run.getUuid(), "PREP_PHASE_STARTED", Map.of("survivingHeroes", regenLog.size()));

        return new PrepResultResponse(gameLogicService.toHeroDTOs(state.getHeroes()), regenLog, loot);
    }

    public List<HeroStateDTO> assignLoot(UUID playerUuid, LootAssignRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);

        BattleState state = loadState(run);
        if (!state.isPrepPhase()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not in prep phase");
        }
        if (state.getPendingLoot() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending loot to assign");
        }

        HeroState hero = gameLogicService.findHero(state, req.recipientHeroId());
        LootItemDTO loot = state.getPendingLoot();

        // Resolve the base item id by matching name suffix (loot name = "[prefix] [item name]")
        String itemId = gameDataService.allItemIds().stream()
                .filter(id -> gameDataService.findItem(id)
                        .map(i -> loot.name().toLowerCase().contains(i.name().toLowerCase()))
                        .orElse(false))
                .findFirst()
                .orElse("healingPotion");

        gameLogicService.addToInventory(hero, itemId, 1);
        state.setPendingLoot(null);
        saveState(run, state);
        runRepository.save(run);
        saveEvent(run.getUuid(), "LOOT_ASSIGNED",
                Map.of("heroId", req.recipientHeroId(), "item", loot.name()));

        return gameLogicService.toHeroDTOs(state.getHeroes());
    }

    public List<HeroStateDTO> processPrepAction(UUID playerUuid, PrepActionRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);

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
                if (req.itemId() == null)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemId (weapon) required");
                swapWeapon(actor, req.itemId());
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
        saveEvent(run.getUuid(), "PREP_ACTION",
                Map.of("heroId", req.heroId(), "action", req.actionType().name()));

        return gameLogicService.toHeroDTOs(state.getHeroes());
    }

    public Map<String, Object> giveUp(UUID playerUuid, GiveUpRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);
        closeRun(run, EndReason.GAVE_UP);
        log.info("Player {} gave up after {} fights — run {}", playerUuid, run.getFightsSurvived(), run.getUuid());
        return Map.of("fightsSurvived", run.getFightsSurvived());
    }

    public BattleStateResponse restart(UUID playerUuid, RestartRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);

        BattleState oldState = loadState(run);
        closeRun(run, EndReason.RESTARTED);

        // Rebuild fresh hero states from original class/augmentation config
        List<HeroState> freshHeroes = new ArrayList<>();
        List<HeroState> old = oldState.getHeroes();
        for (int i = 0; i < old.size(); i++) {
            HeroState h = old.get(i);
            HeroConfigDTO cfg = new HeroConfigDTO(
                    h.getClassId(), h.getAugmentationId(), h.getAdvantageId(),
                    h.getEquippedWeaponId(), null, h.getEquippedArmorId(), null, null);
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
        saveEvent(newRun.getUuid(), "RUN_STARTED", Map.of("restart", true));

        log.info("Player {} restarted — new run {}", playerUuid, newRun.getUuid());
        return gameLogicService.toBattleStateResponse(newRun.getUuid(), newState);
    }

    public Map<String, Object> getProfile(UUID playerUuid) {
        var player = playerRepository.findByUuid(playerUuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));
        int best = runRepository.findByPlayerUuid(playerUuid).stream()
                .mapToInt(Run::getFightsSurvived).max().orElse(0);
        return Map.of(
                "nickname", player.getNickname(),
                "avatarId", player.getAvatarId() != null ? player.getAvatarId() : "",
                "playerUuid", player.getUuid(),
                "bestRunFightsSurvived", best,
                "currentSeasonRank", 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Persistence helpers
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

    private Run getActiveRun(UUID runUuid) {
        return runRepository.findByUuid(runUuid)
                .filter(r -> r.getEndedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active run not found"));
    }

    private void validateOwner(Run run, UUID playerUuid) {
        if (!run.getPlayerUuid().equals(playerUuid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your run");
        }
    }

    private void checkTimeout(Run run) {
        if (run.getLastActionAt() != null
                && run.getLastActionAt().isBefore(LocalDateTime.now().minusHours(1))) {
            closeRun(run, EndReason.TIMEOUT);
            throw new TimeoutException(run.getFightsSurvived());
        }
    }

    private void closeRun(Run run, EndReason reason) {
        run.setEndReason(reason);
        run.setEndedAt(LocalDateTime.now());
        runRepository.save(run);
        saveEvent(run.getUuid(), "RUN_ENDED",
                Map.of("endReason", reason.name(), "fightsSurvived", run.getFightsSurvived()));
    }

    private RunEvent saveEvent(UUID runUuid, String eventType, Object payload) {
        RunEvent event = new RunEvent();
        event.setRunUuid(runUuid);
        event.setEventType(eventType);
        event.setOccurredAt(LocalDateTime.now());
        try {
            event.setPayload(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            event.setPayload("{}");
        }
        return runEventRepository.save(event);
    }

    private void swapWeapon(HeroState actor, String weaponId) {
        var weapon = gameDataService.findWeapon(weaponId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unknown weapon: " + weaponId));
        var heroClass = gameDataService.findClass(actor.getClassId()).orElseThrow();
        if (!weapon.equippableBy().contains(actor.getClassId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    heroClass.name() + " cannot equip " + weapon.name());
        }
        if ("greatsword".equals(actor.getEquippedWeaponId())) actor.setDex(actor.getDex() + 1);
        actor.setEquippedWeaponId(weaponId);
        if ("greatsword".equals(weaponId)) actor.setDex(Math.max(1, actor.getDex() - 1));
    }
}
