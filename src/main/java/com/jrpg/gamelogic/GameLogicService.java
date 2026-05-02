package com.jrpg.gamelogic;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.entity.EndReason;
import com.jrpg.entity.Run;
import com.jrpg.entity.RunEvent;
import com.jrpg.gamedata.GameData;
import com.jrpg.gamedata.model.*;
import com.jrpg.gamelogic.dto.*;
import com.jrpg.gamelogic.state.*;
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
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameLogicService {

    private final RunRepository runRepository;
    private final RunEventRepository runEventRepository;
    private final PlayerRepository playerRepository;
    private final ObjectMapper objectMapper;

    // ═══════════════════════════════════════════════════════════════════════════
    // Run lifecycle
    // ═══════════════════════════════════════════════════════════════════════════

    public BattleStateResponse startRun(UUID playerUuid, StartRunRequest request) {
        // 409 if active run exists
        runRepository.findByPlayerUuidAndEndedAtIsNull(playerUuid).ifPresent(r -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Active run already exists");
        });

        List<HeroConfig> team = request.team();
        validateTeam(team);

        List<HeroState> heroes = buildHeroStates(team);

        BattleState state = new BattleState();
        state.setHeroes(heroes);
        state.setFightNumber(1);
        state.setCycleModifier(GameData.cycleModifier(1));
        state.setEnemyGroupSize(GameData.groupSize(1));
        state.setEnemies(generateEnemyGroup(1));
        state.setTurnOrder(buildTurnOrder(state));
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
        log.info("Run started for player {} — fight 1", playerUuid);
        return toResponse(run.getUuid(), state);
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

        String activeId = findActiveActorId(state);
        if (!req.actorId().equals(activeId)) {
            log.warn("Invalid actor {} — expected {}", req.actorId(), activeId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not this actor's turn");
        }

        String description;
        try {
            description = switch (req.actionType()) {
                case ATTACK       -> resolveAttack(state, req.actorId(), req.targetId());
                case SKILL        -> resolveSkill(state, req.actorId(), req.targetId(), req.skillId());
                case MAGIC        -> resolveMagic(state, req.actorId(), req.targetId(), req.skillId());
                case ITEM         -> resolveItem(state, req.actorId(), req.targetId(), req.skillId());
                case CHANGE_WEAPON-> changeWeapon(state, req.actorId(), req.skillId());
            };
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error processing action {}: {}", req.actionType(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Game state error");
        }

        // Tick status effects after player/hero action (only for non-enemy actors)
        if (req.actorId().startsWith("hero_")) {
            tickStatusEffects(state);
        }

        advanceTurn(state);

        // Resolve enemy turns consecutively until a hero must act
        resolveEnemyTurns(state);

        // Check end conditions
        if (checkAllEnemiesDead(state)) {
            state.setFightOver(true);
            state.setVictory(true);
            addLog(state, "Victory! All enemies defeated.");
            log.info("Fight {} won — player {}", state.getFightNumber(), playerUuid);
        } else if (checkAllHeroesDead(state)) {
            state.setFightOver(true);
            state.setVictory(false);
            addLog(state, "Defeat! All heroes have fallen.");
            closeRun(run, EndReason.DEFEATED, state);
            log.info("Run ended DEFEATED — player {}", playerUuid);
        }

        saveState(run, state);
        runRepository.save(run);
        saveEvent(run.getUuid(), "COMBAT_ACTION", Map.of(
                "actor", req.actorId(), "action", req.actionType(),
                "target", String.valueOf(req.targetId()), "description", description));

        log.info("Action {} by {} resolved: {}", req.actionType(), req.actorId(), description);
        return new ActionResultResponse(toResponse(run.getUuid(), state), description);
    }

    public BattleStateResponse nextFight(UUID playerUuid, UUID runUuid) {
        Run run = getActiveRun(runUuid);
        validateOwner(run, playerUuid);
        checkTimeout(run);
        run.setLastActionAt(LocalDateTime.now());

        BattleState state = loadState(run);
        if (!state.isFightOver() || !state.isVictory()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current fight is not won yet");
        }

        int nextFight = state.getFightNumber() + 1;
        run.setFightsSurvived(run.getFightsSurvived() + 1);

        state.setFightNumber(nextFight);
        state.setCycleModifier(GameData.cycleModifier(nextFight));
        state.setEnemyGroupSize(GameData.groupSize(nextFight));
        state.setEnemies(generateEnemyGroup(nextFight));
        state.setTurnOrder(buildTurnOrder(state));
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
        log.info("Fight {} started — player {}", nextFight, playerUuid);
        return toResponse(run.getUuid(), state);
    }

    public PrepResultResponse startPrep(UUID playerUuid, UUID runUuid) {
        Run run = getActiveRun(runUuid);
        validateOwner(run, playerUuid);
        checkTimeout(run);
        run.setLastActionAt(LocalDateTime.now());

        BattleState state = loadState(run);

        // Apply passive regen
        List<RegenDTO> regenResults = new ArrayList<>();
        for (HeroState hero : state.getHeroes()) {
            if (!hero.isKnockedOut()) {
                int hpGain = ThreadLocalRandom.current().nextInt(1, 4); // 1–3
                int enGain = ThreadLocalRandom.current().nextInt(1, 3); // 1–2
                hero.setHp(Math.min(hero.getHp() + hpGain, hero.getMaxHp()));
                hero.setEn(Math.min(hero.getEn() + enGain, hero.getMaxEn()));
                regenResults.add(new RegenDTO(hero.getId(), hpGain, enGain));
            }
        }

        // Generate loot
        int cap = GameData.monsterCap(state.getFightNumber());
        LootItemDTO loot = generateLootDrop(cap);
        state.setPendingLoot(loot);
        state.setPrepPhase(true);

        long livingCount = state.getHeroes().stream().filter(h -> !h.isKnockedOut()).count();
        int prepRemaining = (int) livingCount;
        Map<String, Boolean> prepMap = new HashMap<>();
        state.getHeroes().forEach(h -> prepMap.put(h.getId(), false));
        state.setHeroPrepTaken(prepMap);

        saveState(run, state);
        runRepository.save(run);
        saveEvent(run.getUuid(), "PREP_STARTED", Map.of("regenCount", regenResults.size()));
        return new PrepResultResponse(regenResults, loot, prepRemaining);
    }

    public List<HeroStateDTO> assignLoot(UUID playerUuid, LootAssignRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);

        BattleState state = loadState(run);
        HeroState hero = findHero(state, req.recipientHeroId());

        LootItemDTO loot = req.lootItem();
        if ("consumable".equals(loot.itemType())) {
            // Find matching item ID by name match (best effort)
            String itemId = GameData.allItemIds().stream()
                    .filter(id -> GameData.findItem(id)
                            .map(i -> i.name().equalsIgnoreCase(loot.name()) ||
                                      loot.name().toLowerCase().contains(i.name().toLowerCase()))
                            .orElse(false))
                    .findFirst()
                    .orElse("healingPotion");
            addToInventory(hero, itemId, 1);
        }

        state.setPendingLoot(null);
        saveState(run, state);
        runRepository.save(run);
        saveEvent(run.getUuid(), "LOOT_ASSIGNED",
                Map.of("heroId", req.recipientHeroId(), "item", loot.name()));

        return state.getHeroes().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<HeroStateDTO> processPrepAction(UUID playerUuid, PrepActionRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);

        BattleState state = loadState(run);
        if (!state.isPrepPhase()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not in prep phase");
        }

        HeroState actor = findHero(state, req.heroId());
        if (Boolean.TRUE.equals(state.getHeroPrepTaken().get(req.heroId()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hero already used prep action");
        }

        switch (req.actionType()) {
            case USE_ITEM -> {
                if (req.itemId() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemId required");
                consumeItem(state, actor, req.targetHeroId(), req.itemId());
            }
            case SWAP_GEAR -> {
                if (req.itemId() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "weaponId required");
                swapWeaponDirect(actor, req.itemId());
            }
            case REVIVE -> {
                if (req.targetHeroId() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetHeroId required");
                HeroState target = findHero(state, req.targetHeroId());
                if (!target.isKnockedOut()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target is not knocked out");
                reviveHero(target);
            }
            case PASS -> {} // no-op
        }

        state.getHeroPrepTaken().put(req.heroId(), true);
        saveState(run, state);
        runRepository.save(run);
        saveEvent(run.getUuid(), "PREP_ACTION",
                Map.of("heroId", req.heroId(), "action", req.actionType()));

        return state.getHeroes().stream().map(this::toDto).collect(Collectors.toList());
    }

    public Map<String, Object> giveUp(UUID playerUuid, GiveUpRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);
        BattleState state = loadState(run);
        closeRun(run, EndReason.GAVE_UP, state);
        log.info("Player {} gave up after {} fights", playerUuid, run.getFightsSurvived());
        return Map.of("fightsSurvived", run.getFightsSurvived());
    }

    public BattleStateResponse restart(UUID playerUuid, RestartRequest req) {
        Run run = getActiveRun(req.runUuid());
        validateOwner(run, playerUuid);
        BattleState oldState = loadState(run);
        closeRun(run, EndReason.RESTARTED, oldState);

        // Reconstruct fresh hero states from stored classId/augmentation
        List<HeroState> freshHeroes = oldState.getHeroes().stream()
                .map(h -> {
                    HeroConfig cfg = new HeroConfig(h.getClassId(), h.getAugmentationId(),
                            h.getAdvantageId(),
                            new Loadout(h.getEquippedWeaponId(), h.getEquippedArmorId()));
                    return buildHeroState(h.getId(), cfg);
                })
                .collect(Collectors.toList());

        BattleState newState = new BattleState();
        newState.setHeroes(freshHeroes);
        newState.setFightNumber(1);
        newState.setCycleModifier(GameData.cycleModifier(1));
        newState.setEnemyGroupSize(GameData.groupSize(1));
        newState.setEnemies(generateEnemyGroup(1));
        newState.setTurnOrder(buildTurnOrder(newState));
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
        return toResponse(newRun.getUuid(), newState);
    }

    public Map<String, Object> getProfile(UUID playerUuid) {
        var player = playerRepository.findByUuid(playerUuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));
        List<Run> runs = runRepository.findByPlayerUuid(playerUuid);
        int best = runs.stream().mapToInt(Run::getFightsSurvived).max().orElse(0);
        return Map.of(
                "nickname", player.getNickname(),
                "avatarId", player.getAvatarId() != null ? player.getAvatarId() : "",
                "playerUuid", player.getUuid(),
                "bestRunFightsSurvived", best,
                "currentSeasonRank", 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // State management helpers
    // ═══════════════════════════════════════════════════════════════════════════

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
        if (run.getLastActionAt() != null &&
                run.getLastActionAt().isBefore(LocalDateTime.now().minusHours(1))) {
            BattleState state = loadState(run);
            closeRun(run, EndReason.TIMEOUT, state);
            Map<String, Object> body = Map.of("timeout", true, "fightsSurvived", run.getFightsSurvived());
            // Throw a 410 Gone with the body embedded in the message (controller handles this)
            throw new ResponseStatusException(HttpStatus.GONE, objectMapper.valueToTree(body).toString());
        }
    }

    private void closeRun(Run run, EndReason reason, BattleState state) {
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

    // ═══════════════════════════════════════════════════════════════════════════
    // Team & hero construction
    // ═══════════════════════════════════════════════════════════════════════════

    private void validateTeam(List<HeroConfig> team) {
        if (team.size() != 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team must have exactly 3 heroes");
        }
        Set<String> validClasses = GameData.allClassIds();
        for (HeroConfig cfg : team) {
            if (!validClasses.contains(cfg.classId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown class: " + cfg.classId());
            }
            ClassData cls = GameData.findClass(cfg.classId()).orElseThrow();
            // Validate weapon equippable by class
            if (cfg.loadout() != null && cfg.loadout().weaponId() != null) {
                WeaponType weapon = GameData.findWeapon(cfg.loadout().weaponId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Unknown weapon: " + cfg.loadout().weaponId()));
                if (!weapon.equippableBy().contains(cfg.classId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            cls.name() + " cannot equip " + weapon.name());
                }
            }
            // Cyber augmentation only on physical classes
            if ("cyber".equalsIgnoreCase(cfg.augmentationId()) && "MAGIC".equals(cls.type())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cyber augmentation not available to magic classes");
            }
        }
    }

    private List<HeroState> buildHeroStates(List<HeroConfig> team) {
        List<HeroState> heroes = new ArrayList<>();
        for (int i = 0; i < team.size(); i++) {
            heroes.add(buildHeroState("hero_" + i, team.get(i)));
        }
        return heroes;
    }

    private HeroState buildHeroState(String id, HeroConfig cfg) {
        ClassData cls = GameData.findClass(cfg.classId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown class: " + cfg.classId()));

        HeroState heroState = new HeroState();
        heroState.setId(id);
        heroState.setClassId(cfg.classId());
        heroState.setAugmentationId(cfg.augmentationId());
        heroState.setAdvantageId(cfg.advantageId());

        // Base stats from class
        int str = cls.str(), dex = cls.dex(), intel = cls.intel();
        int maxHp = cls.hp(), maxEn = cls.en(), spd = cls.spd();

        // Apply augmentation tradeoff + advantage
        if (cfg.augmentationId() != null && cfg.advantageId() != null) {
            switch (cfg.augmentationId()) {
                case "powerCore" -> {
                    dex -= 1; // tradeoff
                    if ("powerCoreDmg".equals(cfg.advantageId())) str += 2;
                    else if ("powerCoreHp".equals(cfg.advantageId())) maxHp += 4;
                }
                case "swiftMechanism" -> {
                    maxHp -= 2; // tradeoff
                    if ("swiftSpd".equals(cfg.advantageId())) spd += 4;
                    else if ("swiftDex".equals(cfg.advantageId())) dex += 2;
                }
                case "magicCrystal" -> {
                    str -= 1; // tradeoff
                    if ("crystalInt".equals(cfg.advantageId())) intel += 2;
                    else if ("crystalEn".equals(cfg.advantageId())) maxEn += 4;
                }
                case "ironFrame" -> {
                    spd -= 2; // tradeoff
                    if ("ironHp".equals(cfg.advantageId())) maxHp += 6;
                    else if ("ironDef".equals(cfg.advantageId())) heroState.setArmorDefBonus(1);
                }
                case "cyber" -> {
                    // no stat tradeoff — weakness to Electric is handled in damage resolution
                }
                case "enhanced" -> {
                    // random elemental weakness assigned at run start
                    String[] elements = {"fire", "electric", "ice", "arcane"};
                    heroState.setElementalWeakness(elements[ThreadLocalRandom.current().nextInt(elements.length)]);
                }
            }
        }

        heroState.setBaseStr(str); heroState.setBaseDex(dex); heroState.setBaseIntel(intel);
        heroState.setBaseSpd(spd); heroState.setBaseMaxHp(maxHp); heroState.setBaseMaxEn(maxEn);
        heroState.setStr(str); heroState.setDex(dex); heroState.setIntel(intel);
        heroState.setSpd(spd); heroState.setMaxHp(Math.max(1, maxHp)); heroState.setMaxEn(Math.max(1, maxEn));
        heroState.setHp(heroState.getMaxHp()); heroState.setEn(heroState.getMaxEn());

        // Equip weapon (with greatsword passive)
        String weaponId = (cfg.loadout() != null && cfg.loadout().weaponId() != null)
                ? cfg.loadout().weaponId() : defaultWeapon(cfg.classId());
        equipWeapon(heroState, weaponId);

        heroState.setEquippedArmorId((cfg.loadout() != null && cfg.loadout().armorId() != null)
                ? cfg.loadout().armorId() : cls.equippableArmor());

        heroState.setKnockedOut(false);
        return heroState;
    }

    private String defaultWeapon(String classId) {
        return switch (classId) {
            case "warrior" -> "sword";
            case "ranger"  -> "bow";
            case "mage"    -> "staff";
            case "priest"  -> "mace";
            default        -> "sword";
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Enemy generation
    // ═══════════════════════════════════════════════════════════════════════════

    private List<EnemyState> generateEnemyGroup(int fightNumber) {
        int cap   = GameData.monsterCap(fightNumber);
        int size  = GameData.groupSize(fightNumber);
        String cycle = GameData.cycleModifier(fightNumber);

        List<EnemyData> pool = GameData.enemyPool(cap);
        if (pool.isEmpty()) {
            pool = List.of(GameData.findEnemy("goblin").orElseThrow());
        }

        List<EnemyState> group = new ArrayList<>();
        Map<String, Integer> nameCount = new HashMap<>();

        for (int i = 0; i < size; i++) {
            EnemyData data = pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
            int idx = nameCount.merge(data.id(), 0, Integer::sum);
            nameCount.put(data.id(), idx + 1);

            EnemyState e = new EnemyState();
            e.setId(data.id() + "_" + i);
            e.setEnemyDataId(data.id());
            e.setName(data.name() + (size > 1 ? " " + (char)('A' + i) : ""));
            e.setType(data.type());
            e.setAiTier(data.aiTier());
            e.setStr(data.str()); e.setDex(data.dex()); e.setIntel(data.intel());
            e.setSpd(data.spd());

            int maxHp = data.hp();
            int maxEn = data.intel() * 2;

            // Apply difficulty cycle modifier
            if ("A".equals(cycle)) {
                if (ThreadLocalRandom.current().nextBoolean()) maxHp = Math.max(1, maxHp - 2);
                else maxEn = Math.max(0, maxEn - 2);
            } else if ("C".equals(cycle)) {
                int roll = ThreadLocalRandom.current().nextInt(3);
                if (roll == 0) maxHp += 2;
                else if (roll == 1) maxEn += 2;
                else { maxHp += 1; maxEn += 1; }
            }

            e.setMaxHp(maxHp); e.setHp(maxHp);
            e.setMaxEn(maxEn); e.setEn(maxEn);
            if (data.elementalImmunity() != null) e.setElementalImmunity(new ArrayList<>(data.elementalImmunity()));
            e.setInstantKillImmune(data.instantKillImmune());
            group.add(e);
        }
        return group;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Turn order
    // ═══════════════════════════════════════════════════════════════════════════

    private List<String> buildTurnOrder(BattleState state) {
        List<Map.Entry<String, Integer>> actors = new ArrayList<>();
        for (HeroState h : state.getHeroes()) {
            if (!h.isKnockedOut()) actors.add(Map.entry(h.getId(), h.getSpd()));
        }
        for (EnemyState e : state.getEnemies()) {
            if (e.getHp() > 0) actors.add(Map.entry(e.getId(), e.getSpd()));
        }
        actors.sort((a, b) -> b.getValue() - a.getValue());
        return actors.stream().map(Map.Entry::getKey).collect(Collectors.toList());
    }

    private String findActiveActorId(BattleState state) {
        List<String> order = state.getTurnOrder();
        int n = order.size();
        if (n == 0) return null;
        int start = state.getCurrentTurnIndex() % n;
        for (int i = 0; i < n; i++) {
            String id = order.get((start + i) % n);
            if (isAlive(id, state)) return id;
        }
        return null;
    }

    private void advanceTurn(BattleState state) {
        List<String> order = state.getTurnOrder();
        int n = order.size();
        if (n == 0) return;
        int next = (state.getCurrentTurnIndex() + 1) % n;
        int safety = 0;
        while (!isAlive(order.get(next), state) && safety < n) {
            next = (next + 1) % n;
            safety++;
        }
        state.setCurrentTurnIndex(next);
    }

    private boolean isAlive(String actorId, BattleState state) {
        if (actorId.startsWith("hero_")) {
            return state.getHeroes().stream()
                    .filter(h -> h.getId().equals(actorId))
                    .anyMatch(h -> !h.isKnockedOut());
        }
        return state.getEnemies().stream()
                .filter(e -> e.getId().equals(actorId))
                .anyMatch(e -> e.getHp() > 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Action resolution — heroes
    // ═══════════════════════════════════════════════════════════════════════════

    private String resolveAttack(BattleState state, String actorId, String targetId) {
        if (!actorId.startsWith("hero_")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only heroes can ATTACK");
        HeroState hero = findHero(state, actorId);

        WeaponType weapon = GameData.findWeapon(hero.getEquippedWeaponId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid weapon"));

        // Staff/wand auto-trigger as magic bolt on basic attack
        if ("staff".equals(weapon.id()) || "wand".equals(weapon.id())) {
            return performMagicAttack(state, hero, targetId, 0);
        }

        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");

        // Enemy has no armor tier — flat 0 reduction unless high-tier mechanical
        int dmg = Math.max(1, hero.getStr() - enemyPhysDefense(target));

        // Bow special: 20% SPD reduction, 10% slow
        if ("bow".equals(weapon.id())) {
            if (ThreadLocalRandom.current().nextDouble() < 0.20) {
                applyStatusEnemy(target, "slow", 2, 0);
                addLog(state, target.getName() + " is slowed!");
            }
        }

        // Greatsword bonus vs beast
        if ("greatsword".equals(weapon.id()) && "beast".equals(target.getType())) dmg += 2;

        applyDmgToEnemy(target, dmg, state);
        String msg = hero.getClassId() + " attacks " + target.getName() + " for " + dmg + " damage.";
        addLog(state, msg);
        return msg;
    }

    private String resolveSkill(BattleState state, String actorId, String targetId, String skillId) {
        HeroState hero = findHero(state, actorId);
        SkillData skill = GameData.findSkill(hero.getEquippedWeaponId(), skillId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown skill: " + skillId));

        if (hero.getEn() < skill.enCost()) {
            log.warn("Hero {} has insufficient EN for skill {}", actorId, skillId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient EN");
        }
        if (skill.enCost() > 0) hero.setEn(hero.getEn() - skill.enCost());

        // DoubleShot: hits two targets (or same target twice if only one alive)
        if ("doubleShot".equals(skillId)) {
            return resolveDoubleShot(state, hero, targetId);
        }

        // Cleave: hits all enemies
        if ("cleave".equals(skillId)) {
            return resolveCleave(state, hero);
        }

        // HeavyStrike: +4 bonus damage
        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");

        int dmg = Math.max(1, hero.getStr() - enemyPhysDefense(target));
        if ("heavyStrike".equals(skillId)) dmg += 4;
        if ("greatsword".equals(hero.getEquippedWeaponId()) && "beast".equals(target.getType())) dmg += 2;

        // Dismember: 20% instant kill vs humanoids (not mechanical/undead)
        if ("dismember".equals(skillId) &&
                "humanoid".equals(target.getType()) && !target.isInstantKillImmune()) {
            if (ThreadLocalRandom.current().nextDouble() < 0.20) {
                target.setHp(0);
                String msg = hero.getClassId() + " dismembers " + target.getName() + " (instant kill)!";
                addLog(state, msg);
                return msg;
            }
        }

        applyDmgToEnemy(target, dmg, state);

        String msg = hero.getClassId() + " uses " + skill.name() + " on " + target.getName() + " for " + dmg + " damage.";

        // Apply status effect from skill
        if (skill.statusEffect() != null && ThreadLocalRandom.current().nextDouble() < skill.statusChance()) {
            applyStatusEnemy(target, skill.statusEffect(), statusDuration(skill.statusEffect()), 0);
            msg += " " + target.getName() + " is " + skill.statusEffect() + "!";
        }

        addLog(state, msg);
        return msg;
    }

    private String resolveDoubleShot(BattleState state, HeroState hero, String targetId) {
        List<EnemyState> living = state.getEnemies().stream().filter(e -> e.getHp() > 0).collect(Collectors.toList());
        if (living.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No enemies alive");

        EnemyState t1 = findEnemy(state, targetId);
        EnemyState t2 = living.size() > 1
                ? living.stream().filter(e -> !e.getId().equals(targetId)).findFirst().orElse(t1)
                : t1;

        int dmg = Math.max(1, (hero.getStr() - enemyPhysDefense(t1)) / 2);
        applyDmgToEnemy(t1, dmg, state);
        applyDmgToEnemy(t2, dmg, state);

        String msg = hero.getClassId() + " fires Double Shot hitting " + t1.getName() + " and " + t2.getName() + " for " + dmg + " each.";
        addLog(state, msg);
        return msg;
    }

    private String resolveCleave(BattleState state, HeroState hero) {
        StringBuilder sb = new StringBuilder(hero.getClassId() + " Cleaves:");
        for (EnemyState e : state.getEnemies()) {
            if (e.getHp() <= 0) continue;
            int dmg = Math.max(1, hero.getStr() - enemyPhysDefense(e));
            applyDmgToEnemy(e, dmg, state);
            sb.append(" ").append(e.getName()).append(" -").append(dmg).append("HP;");
        }
        String msg = sb.toString();
        addLog(state, msg);
        return msg;
    }

    private String resolveMagic(BattleState state, String actorId, String targetId, String spellId) {
        HeroState hero = findHero(state, actorId);
        SpellData spell = GameData.findSpell(spellId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown spell: " + spellId));

        // Silence check
        boolean silenced = hero.getStatuses().stream().anyMatch(s -> "silence".equals(s.getType()));
        if (silenced) {
            log.warn("Hero {} is silenced and cannot cast", actorId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hero is silenced");
        }

        if (hero.getEn() < spell.enCost()) {
            log.warn("Hero {} insufficient EN for spell {}", actorId, spellId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient EN");
        }
        if (spell.enCost() > 0) hero.setEn(hero.getEn() - spell.enCost());

        String targetType = spell.targetType();
        StringBuilder msg = new StringBuilder();

        if ("ally".equals(targetType)) {
            return resolveAllySpell(state, hero, targetId, spell);
        }

        if ("all".equals(targetType)) {
            return resolveAoeSpell(state, hero, spell);
        }

        // Single-target offensive spell
        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");

        // Elemental immunity
        String school = spell.school().toLowerCase();
        if (target.getElementalImmunity().contains(school)) {
            msg.append(target.getName()).append(" is immune to ").append(spell.school()).append("!");
            addLog(state, msg.toString());
            return msg.toString();
        }

        int bonus = spellDamageBonus(spell.enCost());
        int dmg = Math.max(1, hero.getIntel() + bonus);

        // Drain: absorb half damage as HP
        if ("drain".equals(spellId)) {
            hero.setHp(Math.min(hero.getHp() + dmg / 2, hero.getMaxHp()));
        }
        // HolyBolt: bonus vs undead
        if ("holyBolt".equals(spellId) && "undead".equals(target.getType())) dmg += 3;

        applyDmgToEnemy(target, dmg, state);
        msg.append(hero.getClassId()).append(" casts ").append(spell.name())
           .append(" on ").append(target.getName()).append(" for ").append(dmg).append(" damage.");

        if (spell.statusEffect() != null) {
            applyStatusEnemy(target, spell.statusEffect(), statusDuration(spell.statusEffect()), 0);
            msg.append(" ").append(target.getName()).append(" is ").append(spell.statusEffect()).append("!");
        }

        addLog(state, msg.toString());
        return msg.toString();
    }

    private String resolveAllySpell(BattleState state, HeroState caster, String targetId, SpellData spell) {
        HeroState target = (targetId != null) ? findHero(state, targetId) : caster;

        if ("revive".equals(spell.id())) {
            if (!target.isKnockedOut()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target is not knocked out");
            reviveHero(target);
            String msg = caster.getClassId() + " revives " + target.getClassId() + "!";
            addLog(state, msg);
            return msg;
        }
        if ("cure".equals(spell.id())) {
            if (!target.getStatuses().isEmpty()) {
                target.getStatuses().clear();
            }
            String msg = caster.getClassId() + " cures " + target.getClassId() + " of a status effect.";
            addLog(state, msg);
            return msg;
        }

        // Healing spells
        int healAmt = switch (spell.enCost()) {
            case 3 -> 5;
            case 5 -> 10;
            case 7 -> 20;
            default -> 3;
        };
        target.setHp(Math.min(target.getHp() + healAmt, target.getMaxHp()));
        String msg = caster.getClassId() + " casts " + spell.name() + " on " + target.getClassId()
                + " restoring " + healAmt + " HP.";
        addLog(state, msg);
        return msg;
    }

    private String resolveAoeSpell(BattleState state, HeroState caster, SpellData spell) {
        String school = spell.school().toLowerCase();
        int bonus = spellDamageBonus(spell.enCost());
        int baseDmg = Math.max(1, caster.getIntel() + bonus);
        StringBuilder sb = new StringBuilder(caster.getClassId() + " casts " + spell.name() + ":");
        for (EnemyState e : state.getEnemies()) {
            if (e.getHp() <= 0) continue;
            if (e.getElementalImmunity().contains(school)) {
                sb.append(" ").append(e.getName()).append(" (immune);");
                continue;
            }
            applyDmgToEnemy(e, baseDmg, state);
            sb.append(" ").append(e.getName()).append(" -").append(baseDmg).append("HP;");
        }
        String msg = sb.toString();
        addLog(state, msg);
        return msg;
    }

    /** Staff/wand basic attack falls through to a magic bolt. */
    private String performMagicAttack(BattleState state, HeroState hero, String targetId, int bonus) {
        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");
        int dmg = Math.max(1, hero.getIntel() + bonus);
        applyDmgToEnemy(target, dmg, state);
        String msg = hero.getClassId() + " fires a magic bolt at " + target.getName() + " for " + dmg + " damage.";
        addLog(state, msg);
        return msg;
    }

    private String resolveItem(BattleState state, String actorId, String targetId, String itemId) {
        HeroState actor = findHero(state, actorId);
        consumeItem(state, actor, targetId, itemId);
        String msg = actor.getClassId() + " uses " + itemId + ".";
        addLog(state, msg);
        return msg;
    }

    private void consumeItem(BattleState state, HeroState actor, String targetId, String itemId) {
        // Find item in actor's inventory
        InventoryItem inv = actor.getInventory().stream()
                .filter(i -> i.getItemId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> {
                    log.warn("Hero {} does not have item {}", actor.getId(), itemId);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item not in inventory: " + itemId);
                });

        HeroState targetHero = (targetId != null && targetId.startsWith("hero_"))
                ? findHero(state, targetId) : actor;

        switch (itemId) {
            case "healingPotion"      -> targetHero.setHp(Math.min(targetHero.getHp() + 8, targetHero.getMaxHp()));
            case "energyPotion"       -> targetHero.setEn(Math.min(targetHero.getEn() + 6, targetHero.getMaxEn()));
            case "regenEnergyPotion"  -> targetHero.setEn(Math.min(targetHero.getEn() + 6, targetHero.getMaxEn()));
            case "reviveScroll"       -> {
                HeroState kd = findHero(state, targetId);
                if (!kd.isKnockedOut()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target is not knocked out");
                reviveHero(kd);
            }
            case "magicSicknessPotion" -> {
                EnemyState enemy = findEnemy(state, targetId);
                applyStatusEnemy(enemy, "poison", 3, 2);
            }
            case "speedPotion"        -> targetHero.setSpd(targetHero.getSpd() + 4);
            case "regenLifePotion"    -> applyStatusHero(targetHero, "regen", 3, 2);
        }

        // Decrement inventory
        if (inv.getQuantity() <= 1) actor.getInventory().remove(inv);
        else inv.setQuantity(inv.getQuantity() - 1);
    }

    private String changeWeapon(BattleState state, String actorId, String weaponId) {
        HeroState hero = findHero(state, actorId);
        ClassData cls = GameData.findClass(hero.getClassId()).orElseThrow();
        WeaponType newWeapon = GameData.findWeapon(weaponId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown weapon: " + weaponId));
        if (!newWeapon.equippableBy().contains(hero.getClassId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    cls.name() + " cannot equip " + newWeapon.name());
        }
        equipWeapon(hero, weaponId);
        String msg = hero.getClassId() + " equips " + newWeapon.name() + ". (full turn)";
        addLog(state, msg);
        return msg;
    }

    private void equipWeapon(HeroState hero, String weaponId) {
        // Remove old greatsword passive
        if ("greatsword".equals(hero.getEquippedWeaponId())) {
            hero.setDex(hero.getDex() + 1);
        }
        hero.setEquippedWeaponId(weaponId);
        // Apply new greatsword passive
        if ("greatsword".equals(weaponId)) {
            hero.setDex(Math.max(1, hero.getDex() - 1));
        }
    }

    private void swapWeaponDirect(HeroState hero, String weaponId) {
        ClassData cls = GameData.findClass(hero.getClassId()).orElseThrow();
        WeaponType w = GameData.findWeapon(weaponId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown weapon: " + weaponId));
        if (!w.equippableBy().contains(hero.getClassId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    cls.name() + " cannot equip " + w.name());
        }
        equipWeapon(hero, weaponId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Enemy AI
    // ═══════════════════════════════════════════════════════════════════════════

    private void resolveEnemyTurns(BattleState state) {
        if (state.isFightOver()) return;
        // Keep processing enemy turns until a hero is next or fight ends
        for (int guard = 0; guard < state.getTurnOrder().size(); guard++) {
            String activeId = findActiveActorId(state);
            if (activeId == null || activeId.startsWith("hero_")) break;

            EnemyState enemy = state.getEnemies().stream()
                    .filter(e -> e.getId().equals(activeId)).findFirst().orElse(null);
            if (enemy == null || enemy.getHp() <= 0) { advanceTurn(state); continue; }

            // Check stun/frozen — skip turn
            boolean skipped = enemy.getStatuses().stream()
                    .anyMatch(s -> "stun".equals(s.getType()) || "frozen".equals(s.getType()));
            if (!skipped) resolveEnemyAttack(enemy, state);

            tickEnemyStatuses(enemy, state);
            advanceTurn(state);

            if (checkAllHeroesDead(state)) {
                state.setFightOver(true);
                state.setVictory(false);
                return;
            }
        }
    }

    private void resolveEnemyAttack(EnemyState enemy, BattleState state) {
        HeroState target = selectEnemyTarget(enemy, state);
        if (target == null) return;

        int heroReduction = armorReduction(target.getEquippedArmorId()) + target.getArmorDefBonus();
        int dmg = Math.max(1, enemy.getStr() - heroReduction);

        // Shell status reduces incoming damage
        boolean hasShell = target.getStatuses().stream().anyMatch(s -> "shell".equals(s.getType()));
        if (hasShell) dmg = Math.max(1, dmg - 2);

        applyDmgToHero(target, dmg, state);
        String msg = enemy.getName() + " attacks " + target.getClassId() + " for " + dmg + " damage.";
        addLog(state, msg);
        log.info("{}", msg);
    }

    private HeroState selectEnemyTarget(EnemyState enemy, BattleState state) {
        List<HeroState> living = state.getHeroes().stream()
                .filter(h -> !h.isKnockedOut()).collect(Collectors.toList());
        if (living.isEmpty()) return null;

        return switch (enemy.getAiTier()) {
            case "average" -> living.stream()
                    .min(Comparator.comparingInt(HeroState::getHp)).orElse(living.get(0));
            case "high" -> {
                // Target hero with lowest armor reduction (lowest defense)
                yield living.stream()
                        .min(Comparator.comparingInt(h -> armorReduction(h.getEquippedArmorId())))
                        .orElse(living.get(0));
            }
            // random target
            default -> living.get(ThreadLocalRandom.current().nextInt(living.size()));
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Status effects
    // ═══════════════════════════════════════════════════════════════════════════

    private void tickStatusEffects(BattleState state) {
        for (HeroState h : state.getHeroes()) {
            if (h.isKnockedOut()) continue;
            Iterator<ActiveStatus> it = h.getStatuses().iterator();
            while (it.hasNext()) {
                ActiveStatus s = it.next();
                applyStatusTick(h, s, state);
                s.setDuration(s.getDuration() - 1);
                if (s.getDuration() <= 0) it.remove();
            }
        }
    }

    private void tickEnemyStatuses(EnemyState enemy, BattleState state) {
        Iterator<ActiveStatus> it = enemy.getStatuses().iterator();
        while (it.hasNext()) {
            ActiveStatus s = it.next();
            switch (s.getType()) {
                case "bleed", "burn", "poison" -> {
                    int dmg = Math.max(1, s.getMagnitude());
                    enemy.setHp(Math.max(0, enemy.getHp() - dmg));
                    addLog(state, enemy.getName() + " takes " + dmg + " " + s.getType() + " damage.");
                }
            }
            s.setDuration(s.getDuration() - 1);
            if (s.getDuration() <= 0) it.remove();
        }
    }

    private void applyStatusTick(HeroState hero, ActiveStatus s, BattleState state) {
        switch (s.getType()) {
            case "bleed", "burn", "poison" -> {
                int dmg = Math.max(1, s.getMagnitude());
                applyDmgToHero(hero, dmg, state);
                addLog(state, hero.getClassId() + " takes " + dmg + " " + s.getType() + " damage.");
            }
            case "regen" -> {
                hero.setHp(Math.min(hero.getHp() + s.getMagnitude(), hero.getMaxHp()));
                addLog(state, hero.getClassId() + " regenerates " + s.getMagnitude() + " HP.");
            }
        }
    }

    private void applyStatusHero(HeroState hero, String type, int duration, int magnitude) {
        // Don't stack same status — refresh duration
        hero.getStatuses().removeIf(s -> s.getType().equals(type));
        hero.getStatuses().add(new ActiveStatus(type, duration, magnitude));
        // Apply immediate stat changes
        switch (type) {
            case "stun"  -> hero.setSpd(Math.max(1, hero.getSpd() / 2));
            case "haste" -> hero.setSpd(hero.getSpd() * 2);
        }
    }

    private void applyStatusEnemy(EnemyState enemy, String type, int duration, int magnitude) {
        enemy.getStatuses().removeIf(s -> s.getType().equals(type));
        enemy.getStatuses().add(new ActiveStatus(type, duration, magnitude));
        switch (type) {
            case "stun", "slow" -> enemy.setSpd(Math.max(1, enemy.getSpd() / 2));
        }
    }

    private int statusDuration(String type) {
        return switch (type) {
            case "stun", "frozen" -> 1;
            case "bleed"  -> 4;
            case "burn", "poison", "regen" -> 3;
            case "slow", "silence", "blind", "haste", "shell" -> 2;
            case "curse"  -> 2;
            default -> 2;
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Damage & armor
    // ═══════════════════════════════════════════════════════════════════════════

    private int armorReduction(String armorId) {
        if (armorId == null) return 0;
        return switch (armorId) {
            case "heavy"       -> 2;
            case "medium"      -> ThreadLocalRandom.current().nextBoolean() ? 1 : 2;
            case "light"       -> 1;
            case "magicClothes"-> 0;
            default            -> 0;
        };
    }

    private int enemyPhysDefense(EnemyState enemy) {
        // Mechanical enemies have slight physical resist (represent armor plating)
        return "mechanical".equals(enemy.getType()) ? 1 : 0;
    }

    private int spellDamageBonus(int enCost) {
        return switch (enCost) {
            case 2 -> 0;
            case 3 -> 1;
            case 5 -> 3;
            case 6 -> 2;
            case 7 -> 5;
            default -> 0;
        };
    }

    private void applyDmgToHero(HeroState hero, int dmg, BattleState state) {
        hero.setHp(Math.max(0, hero.getHp() - dmg));
        if (hero.getHp() == 0 && !hero.isKnockedOut()) {
            hero.setKnockedOut(true);
            hero.getStatuses().clear();
            addLog(state, hero.getClassId() + " is knocked out!");
        }
    }

    private void applyDmgToEnemy(EnemyState enemy, int dmg, BattleState state) {
        enemy.setHp(Math.max(0, enemy.getHp() - dmg));
        if (enemy.getHp() == 0) {
            enemy.getStatuses().clear();
            addLog(state, enemy.getName() + " is defeated!");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Win/loss conditions
    // ═══════════════════════════════════════════════════════════════════════════

    private boolean checkAllEnemiesDead(BattleState state) {
        return state.getEnemies().stream().allMatch(e -> e.getHp() <= 0);
    }

    private boolean checkAllHeroesDead(BattleState state) {
        return state.getHeroes().stream().allMatch(HeroState::isKnockedOut);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Loot
    // ═══════════════════════════════════════════════════════════════════════════

    private LootItemDTO generateLootDrop(int monsterCap) {
        List<String> qualityPool = GameData.lootQualityPool(monsterCap);
        String quality = qualityPool.get(ThreadLocalRandom.current().nextInt(qualityPool.size()));

        List<String> allItems = GameData.allItemIds();
        String itemId = allItems.get(ThreadLocalRandom.current().nextInt(allItems.size()));
        ItemData item = GameData.findItem(itemId).orElseThrow();

        List<String> modifiers = new ArrayList<>();
        if ("MAGIC".equals(quality)) modifiers.add(randomModifier());
        if ("RARE".equals(quality)) { modifiers.add(randomModifier()); modifiers.add(randomModifier()); }

        String prefix = modifiers.isEmpty() ? "" : modifiers.get(0) + " ";
        return new LootItemDTO("consumable", prefix + item.name(), quality, modifiers, item.effect());
    }

    private String randomModifier() {
        String[] mods = {"Strong","Swift","Wise","Tough","Quick","Enduring","Sharp","Warded"};
        return mods[ThreadLocalRandom.current().nextInt(mods.length)];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Utility & DTO mapping
    // ═══════════════════════════════════════════════════════════════════════════

    private HeroState findHero(BattleState state, String heroId) {
        return state.getHeroes().stream()
                .filter(h -> h.getId().equals(heroId))
                .findFirst()
                .orElseThrow(() -> {
                    log.warn("Hero {} not found in battle state", heroId);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hero not found: " + heroId);
                });
    }

    private EnemyState findEnemy(BattleState state, String enemyId) {
        return state.getEnemies().stream()
                .filter(e -> e.getId().equals(enemyId))
                .findFirst()
                .orElseThrow(() -> {
                    log.warn("Enemy {} not found in battle state", enemyId);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enemy not found: " + enemyId);
                });
    }

    private void reviveHero(HeroState hero) {
        hero.setKnockedOut(false);
        hero.setHp(Math.max(1, hero.getMaxHp() / 4));
        hero.getStatuses().clear();
    }

    private void addToInventory(HeroState hero, String itemId, int qty) {
        hero.getInventory().stream()
                .filter(i -> i.getItemId().equals(itemId))
                .findFirst()
                .ifPresentOrElse(
                        i -> i.setQuantity(i.getQuantity() + qty),
                        () -> hero.getInventory().add(new InventoryItem(itemId, qty)));
    }

    private void addLog(BattleState state, String msg) {
        state.getCombatLog().add(msg);
        if (state.getCombatLog().size() > 30) state.getCombatLog().remove(0);
    }

    private BattleStateResponse toResponse(UUID runUuid, BattleState state) {
        List<HeroStateDTO> heroes = state.getHeroes().stream().map(this::toDto).collect(Collectors.toList());
        List<EnemyStateDTO> enemies = state.getEnemies().stream().map(this::toDto).collect(Collectors.toList());
        List<String> log = List.copyOf(state.getCombatLog());
        String activeId = state.isFightOver() ? null : findActiveActorId(state);
        return new BattleStateResponse(
                runUuid, state.getFightNumber(), state.getCycleModifier(),
                enemies, heroes, state.getTurnOrder(),
                activeId, log, state.isFightOver(), state.isVictory());
    }

    private HeroStateDTO toDto(HeroState h) {
        List<String> statuses = h.getStatuses().stream().map(ActiveStatus::getType).collect(Collectors.toList());
        String name = GameData.findClass(h.getClassId()).map(ClassData::name).orElse(h.getClassId());
        return new HeroStateDTO(h.getId(), name, h.getClassId(),
                h.getHp(), h.getMaxHp(), h.getEn(), h.getMaxEn(), statuses, h.isKnockedOut());
    }

    private EnemyStateDTO toDto(EnemyState e) {
        List<String> statuses = e.getStatuses().stream().map(ActiveStatus::getType).collect(Collectors.toList());
        return new EnemyStateDTO(e.getId(), e.getName(), e.getType(),
                e.getHp(), e.getMaxHp(), e.getEn(), statuses);
    }
}
