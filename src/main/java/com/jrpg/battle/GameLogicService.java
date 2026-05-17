package com.jrpg.battle;

import com.jrpg.battle.dto.*;
import com.jrpg.battle.state.*;
import com.jrpg.gamedata.GameDataService;
import com.jrpg.gamedata.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameLogicService {

    private final GameDataService gameDataService;

    // ═══════════════════════════════════════════════════════════════════════
    // Hero state construction
    // ═══════════════════════════════════════════════════════════════════════

    private static final List<String> HERO_NAMES = List.of(
            "Kael", "Vera", "Zorn", "Mira", "Dax", "Lyra", "Theron", "Sable", "Crix", "Elara",
            "Voss", "Nira", "Aldric", "Zephyr", "Soryn", "Tanith", "Rook", "Celara", "Brix", "Mael",
            "Ondra", "Tavar", "Lyss", "Doran", "Vex", "Caela", "Strix", "Morel", "Zada", "Fenric");

    public List<HeroState> buildHeroStates(List<HeroConfigDTO> team) {
        List<String> namePool = new ArrayList<>(HERO_NAMES);
        Collections.shuffle(namePool, ThreadLocalRandom.current());
        List<HeroState> heroes = new ArrayList<>();
        for (int i = 0; i < team.size(); i++) {
            HeroState h = buildHeroState("hero_" + i, team.get(i));
            h.setName(namePool.get(i));
            heroes.add(h);
        }
        return heroes;
    }

    public void validateTeam(List<HeroConfigDTO> team) {
        if (team.size() != 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team must have exactly 3 heroes");
        }
        Set<String> validClasses = gameDataService.allClassIds();
        for (HeroConfigDTO cfg : team) {
            if (!validClasses.contains(cfg.classId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown class: " + cfg.classId());
            }
            ClassData cls = gameDataService.findClass(cfg.classId()).orElseThrow();
            WeaponType weapon = gameDataService.findWeapon(cfg.primaryWeaponId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Unknown weapon: " + cfg.primaryWeaponId()));
            if (!weapon.equippableBy().contains(cfg.classId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        cls.name() + " cannot equip " + weapon.name());
            }
            if ("cyber".equalsIgnoreCase(cfg.augmentationType()) && "MAGIC".equals(cls.type())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Cyber augmentation not available to magic classes");
            }
        }
    }

    private HeroState buildHeroState(String id, HeroConfigDTO cfg) {
        ClassData cls = gameDataService.findClass(cfg.classId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown class: " + cfg.classId()));

        HeroState h = new HeroState();
        h.setId(id);
        h.setClassId(cfg.classId());
        h.setAugmentationId(cfg.augmentationType());
        h.setAdvantageId(cfg.augmentationAdvantageId());

        int str = cls.str(), dex = cls.dex(), intel = cls.intel();
        int maxHp = cls.hp(), maxEn = cls.en(), spd = cls.spd();

        if (cfg.augmentationType() != null) {
            switch (cfg.augmentationType()) {
                case "powerCore" -> {
                    dex -= 1;
                    if ("powerCoreDmg".equals(cfg.augmentationAdvantageId())) str += 2;
                    else if ("powerCoreHp".equals(cfg.augmentationAdvantageId())) maxHp += 4;
                }
                case "swiftMechanism" -> {
                    maxHp -= 2;
                    if ("swiftSpd".equals(cfg.augmentationAdvantageId())) spd += 4;
                    else if ("swiftDex".equals(cfg.augmentationAdvantageId())) dex += 2;
                }
                case "magicCrystal" -> {
                    str -= 1;
                    if ("crystalInt".equals(cfg.augmentationAdvantageId())) intel += 2;
                    else if ("crystalEn".equals(cfg.augmentationAdvantageId())) maxEn += 4;
                }
                case "ironFrame" -> {
                    spd -= 2;
                    if ("ironHp".equals(cfg.augmentationAdvantageId())) maxHp += 6;
                    else if ("ironDef".equals(cfg.augmentationAdvantageId())) h.setArmorDefBonus(1);
                }
                case "enhanced" -> {
                    String[] elements = {"fire", "electric", "ice", "arcane"};
                    h.setElementalWeakness(elements[ThreadLocalRandom.current().nextInt(elements.length)]);
                    if ("bonusHp".equals(cfg.augmentationAdvantageId())) maxHp += 5;
                    else if ("bonusEn".equals(cfg.augmentationAdvantageId())) maxEn += 5;
                    // "recover" advantage fires after each turn (handled in resolveAction)
                }
                case "cyber" -> {
                    // No stat tradeoff; vulnerability to Electric handled in damage resolution
                    switch (cfg.augmentationAdvantageId() != null ? cfg.augmentationAdvantageId() : "") {
                        case "precision" -> {
                            int bonus = 1 + ThreadLocalRandom.current().nextInt(2); // 1 or 2
                            h.setCyberPrecisionBonus(bonus);
                        }
                        case "reflexBooster" -> {
                            int dexBonus = 2 + ThreadLocalRandom.current().nextInt(2); // 2 or 3
                            dex += dexBonus;
                            spd += dexBonus * 2;
                            h.setCyberReflexDexBonus(dexBonus);
                        }
                        case "armorSkin" -> {
                            int bonus = 1 + ThreadLocalRandom.current().nextInt(2); // 1 or 2
                            h.setCyberArmorSkinBonus(bonus);
                        }
                    }
                }
            }
        }

        // Mage specialization: store specId and randomly assign 3 Arcane spells
        if ("mage".equals(cfg.classId()) && cfg.mageSpecializationId() != null) {
            h.setMageSpecId(cfg.mageSpecializationId());
            List<SpellData> arcanePool = new ArrayList<>(gameDataService.allSpells().stream()
                    .filter(s -> "arcane".equalsIgnoreCase(s.school()))
                    .collect(Collectors.toList()));
            Collections.shuffle(arcanePool, ThreadLocalRandom.current());
            h.setMageSpellPool(arcanePool.stream().limit(3).map(SpellData::id).collect(Collectors.toList()));
        }

        h.setBaseStr(str); h.setBaseDex(dex); h.setBaseIntel(intel);
        h.setBaseSpd(spd); h.setBaseMaxHp(maxHp); h.setBaseMaxEn(maxEn);
        h.setStr(str); h.setDex(dex); h.setIntel(intel);
        h.setSpd(spd);
        h.setMaxHp(Math.max(1, maxHp)); h.setMaxEn(Math.max(1, maxEn));
        h.setHp(h.getMaxHp()); h.setEn(h.getMaxEn());
        h.setKnockedOut(false);

        equipWeapon(h, cfg.primaryWeaponId());
        if (cfg.secondaryWeaponId() != null) {
            h.setSecondaryWeaponId(cfg.secondaryWeaponId());
        }
        String armorId = (cfg.armorId() != null) ? cfg.armorId() : cls.equippableArmor();
        h.setEquippedArmorId(armorId);

        if (cfg.items() != null) {
            cfg.items().forEach((itemId, qty) -> {
                if (qty != null && qty > 0) addToInventory(h, itemId, qty);
            });
        }

        if (cfg.accessoryId() != null) {
            h.setEquippedStartingAccessoryId(cfg.accessoryId());
            applyStartingAccessoryBonus(h, cfg.accessoryId());
        }

        return h;
    }

    private void applyStartingAccessoryBonus(HeroState hero, String accessoryId) {
        switch (accessoryId) {
            case "commonStr"   -> hero.setStr(hero.getStr() + 1);
            case "commonDex"   -> hero.setDex(hero.getDex() + 1);
            case "commonInt"   -> hero.setIntel(hero.getIntel() + 1);
            case "commonHp"    -> { hero.setMaxHp(hero.getMaxHp() + 2); hero.setHp(hero.getMaxHp()); }
            case "commonEn"    -> { hero.setMaxEn(hero.getMaxEn() + 2); hero.setEn(hero.getMaxEn()); }
            case "commonHpEn"  -> { hero.setMaxHp(hero.getMaxHp() + 1); hero.setHp(hero.getMaxHp());
                                    hero.setMaxEn(hero.getMaxEn() + 1); hero.setEn(hero.getMaxEn()); }
            case "barrierRing" -> {} // effect handled in applyDmgToHero
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Per-battle buff reset (called on nextFight)
    // ═══════════════════════════════════════════════════════════════════════

    public void resetPerBattleBuffs(List<HeroState> heroes) {
        for (HeroState h : heroes) {
            if (h.getBowSpdDebuff() > 0) {
                h.setSpd(Math.min(h.getSpd() + h.getBowSpdDebuff(), h.getBaseSpd()));
                h.setBowSpdDebuff(0);
            }
            h.setPostponed(false);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Turn order
    // ═══════════════════════════════════════════════════════════════════════

    public List<String> buildTurnOrder(BattleState state) {
        final List<String> prev = state.getTurnOrder() != null
                ? List.copyOf(state.getTurnOrder()) : List.of();

        List<Map.Entry<String, Integer>> normalActors = new ArrayList<>();
        List<String> brokenActors = new ArrayList<>();

        for (HeroState h : state.getHeroes()) {
            if (!h.isKnockedOut()) normalActors.add(Map.entry(h.getId(), h.getSpd()));
        }
        for (EnemyState e : state.getEnemies()) {
            if (e.getHp() > 0) {
                if (e.isBroken()) brokenActors.add(e.getId());
                else normalActors.add(Map.entry(e.getId(), e.getSpd()));
            }
        }

        normalActors.sort((a, b) -> {
            int spdDiff = b.getValue() - a.getValue();
            if (spdDiff != 0) return spdDiff;
            boolean aHero = a.getKey().startsWith("hero_");
            boolean bHero = b.getKey().startsWith("hero_");
            if (aHero && !bHero) return -1;
            if (!aHero && bHero) return 1;
            int aIdx = prev.indexOf(a.getKey());
            int bIdx = prev.indexOf(b.getKey());
            if (aIdx < 0) aIdx = Integer.MAX_VALUE;
            if (bIdx < 0) bIdx = Integer.MAX_VALUE;
            return Integer.compare(aIdx, bIdx);
        });

        List<String> result = normalActors.stream().map(Map.Entry::getKey).collect(Collectors.toList());
        result.addAll(brokenActors);
        return result;
    }

    public String findActiveActorId(BattleState state) {
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

    public void advanceTurn(BattleState state) {
        String currentId = findActiveActorId(state);

        List<String> newOrder = buildTurnOrder(state);
        state.setTurnOrder(newOrder);

        int n = newOrder.size();
        if (n == 0) return;

        int currentIdx = currentId != null ? newOrder.indexOf(currentId) : -1;
        int next = (currentIdx + 1) % n;
        for (int safety = 0; safety < n; safety++) {
            if (isAlive(newOrder.get(next), state)) break;
            next = (next + 1) % n;
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

    // ═══════════════════════════════════════════════════════════════════════
    // Win / loss checks
    // ═══════════════════════════════════════════════════════════════════════

    public boolean checkAllEnemiesDead(BattleState state) {
        return state.getEnemies().stream().allMatch(e -> e.getHp() <= 0);
    }

    public boolean checkAllHeroesDead(BattleState state) {
        return state.getHeroes().stream().allMatch(HeroState::isKnockedOut);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Action resolution
    // ═══════════════════════════════════════════════════════════════════════

    public String resolveAction(BattleState state, ActionRequest req) {
        // Clear postponed flag when hero takes any action (including their deferred one)
        HeroState actor = null;
        if (req.actorId() != null && req.actorId().startsWith("hero_")) {
            actor = state.getHeroes().stream()
                    .filter(h -> h.getId().equals(req.actorId())).findFirst().orElse(null);
            if (actor != null) actor.setPostponed(false);
        }
        String result = switch (req.actionType()) {
            case ATTACK        -> resolveAttack(state, req.actorId(), req.targetId());
            case SKILL         -> resolveSkill(state, req.actorId(), req.targetId(), req.skillId());
            case MAGIC         -> resolveMagic(state, req.actorId(), req.targetId(), req.spellId());
            case ITEM          -> resolveItem(state, req.actorId(), req.targetId(), req.itemId());
            case CHANGE_WEAPON -> changeWeapon(state, req.actorId(), req.itemId());
            case ENEMY_TURN    -> resolveOneEnemyTurn(state);
        };
        return result;
    }

    private String resolveAttack(BattleState state, String actorId, String targetId) {
        HeroState hero = findHero(state, actorId);
        WeaponType weapon = gameDataService.findWeapon(hero.getEquippedWeaponId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid weapon"));

        // Staff/wand auto-trigger as magic bolt
        if ("staff".equals(weapon.id()) || "wand".equals(weapon.id())) {
            return performMagicBolt(state, hero, targetId);
        }

        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");

        int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target));

        // Class damage bonuses
        ClassData cls = gameDataService.findClass(hero.getClassId()).orElse(null);
        if (cls != null && cls.damageBonus() != null
                && target.getType().equals(cls.damageBonus().targetType())) {
            dmg += cls.damageBonus().bonusAmount();
        }

        // Greatsword bonus vs beast
        if ("greatsword".equals(weapon.id()) && "beast".equals(target.getType())) dmg += 2;

        dmg += hero.getCyberPrecisionBonus();
        if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);

        applyDmgToEnemy(target, dmg, state);
        String msg = heroLabel(hero) + " attacks " + target.getName() + " for " + dmg + " damage.";
        addLog(state, msg);

        // Bow: 20% chance slow, 10% chance pain; and per-shot SPD debuff on archer
        if ("bow".equals(weapon.id())) {
            double roll = ThreadLocalRandom.current().nextDouble();
            if (roll < 0.10) {
                applyStatusEnemy(target, "pain", 2, 1);
                addLog(state, target.getName() + " is in pain (-1 STR)!");
            } else if (roll < 0.30) {
                applyStatusEnemy(target, "slow", 2, 0);
                addLog(state, target.getName() + " is slowed!");
            }
            applyBowSpdDebuff(state, hero);
        }

        // Hammer: 30% chance Pain on normal attack
        if ("hammer".equals(weapon.id()) && target.getHp() > 0) {
            if (ThreadLocalRandom.current().nextDouble() < 0.30) {
                applyStatusEnemy(target, "pain", 2, 1);
                addLog(state, target.getName() + " is in pain (-1 STR)!");
            }
        }

        return msg;
    }

    private String resolveSkill(BattleState state, String actorId, String targetId, String skillId) {
        if (skillId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "skillId required");
        HeroState hero = findHero(state, actorId);
        SkillData skill = gameDataService.findSkill(hero.getEquippedWeaponId(), skillId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown skill: " + skillId));

        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");

        if (hero.getEn() < skill.enCost()) {
            log.warn("Hero {} insufficient EN for skill {}", actorId, skillId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient EN");
        }
        if (skill.enCost() > 0) hero.setEn(hero.getEn() - skill.enCost());

        if ("doubleShot".equals(skillId))        return resolveDoubleShot(state, hero, targetId);
        if ("cleave".equals(skillId))             return resolveCleave(state, hero);
        if ("normalAttack".equals(skillId))       return resolveAttack(state, actorId, targetId);
        if ("deathDance".equals(skillId))         return resolveDeathDance(state, hero, target);
        if ("fatalShot".equals(skillId))          return resolveFatalShot(state, hero, target);
        if ("piercingShot".equals(skillId))       return resolvePiercingShot(state, hero, target);
        if ("poisonShot".equals(skillId))         return resolvePoisonShot(state, hero, target);
        if ("fireShot".equals(skillId))           return resolveFireShot(state, hero, target);
        if ("doubleHit".equals(skillId))          return resolveDoubleHit(state, hero, target);
        if ("perfectDoubleCut".equals(skillId))   return resolvePerfectDoubleCut(state, hero, target);
        if ("smash".equals(skillId))              return resolveSmash(state, hero, target);
        if ("execution".equals(skillId))          return resolveExecution(state, hero, target);
        if ("largeHit".equals(skillId))           return resolveLargeHit(state, hero, target);

        int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target));

        // Greatsword passive bonus vs beast
        if ("greatsword".equals(hero.getEquippedWeaponId()) && "beast".equals(target.getType())) dmg += 2;

        if ("heavyStrike".equals(skillId)) dmg += 4;
        dmg += hero.getCyberPrecisionBonus();
        if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);

        // Dismember: 20% instant kill vs humanoids only (undead/mechanical immune)
        if ("dismember".equals(skillId)
                && "humanoid".equals(target.getType())
                && !target.isInstantKillImmune()
                && ThreadLocalRandom.current().nextDouble() < 0.20) {
            target.setHp(0);
            String msg = heroLabel(hero) + " dismembers " + target.getName() + " — instant kill!";
            addLog(state, msg);
            return msg;
        }

        applyDmgToEnemy(target, dmg, state);

        StringBuilder msg = new StringBuilder(heroLabel(hero) + " uses " + skill.name()
                + " on " + target.getName() + " for " + dmg + " damage.");

        // SpeedBreak: reduce SPD by ~25%
        if ("speedBreak".equals(skillId)) {
            int reduction = Math.max(1, target.getSpd() / 4);
            target.setSpd(Math.max(1, target.getSpd() - reduction));
            msg.append(" ").append(target.getName()).append("'s SPD reduced!");
        }

        // HeadBash → Stunned (half SPD)
        if ("headBash".equals(skillId)) {
            applyStatusEnemy(target, "stun", 1, 0);
            msg.append(" ").append(target.getName()).append(" is stunned!");
        }

        // LimbStrike → Pain (-1 STR)
        if ("limbStrike".equals(skillId)) {
            applyStatusEnemy(target, "pain", 2, 1);
            msg.append(" ").append(target.getName()).append(" is in pain!");
        }

        // Hammer: Destroy Armor — +2-3 extra damage on all subsequent hits
        if ("destroyArmor".equals(skillId)) {
            target.setDestroyArmorDebuff(true);
            msg.append(" ").append(target.getName()).append("'s armor is shattered!");
        }

        // Hammer: Break — pushed to last in turn order permanently
        if ("breakSkill".equals(skillId)) {
            target.setBroken(true);
            state.setTurnOrder(buildTurnOrder(state));
            msg.append(" ").append(target.getName()).append(" is broken and will act last this battle!");
        }

        // Hammer: Disarm — deals half damage permanently
        if ("disarm".equals(skillId)) {
            target.setDisarmedDebuff(true);
            msg.append(" ").append(target.getName()).append(" is disarmed and deals half damage!");
        }

        // Generic skill status from data
        if (skill.statusEffect() != null && !"stun".equals(skillId) && !"pain".equals(skillId)
                && ThreadLocalRandom.current().nextDouble() < skill.statusChance()) {
            applyStatusEnemy(target, skill.statusEffect(), statusDuration(skill.statusEffect()), 1);
            msg.append(" ").append(target.getName()).append(" is ").append(skill.statusEffect()).append("!");
        }

        String result = msg.toString();
        addLog(state, result);
        return result;
    }

    private String resolveDoubleShot(BattleState state, HeroState hero, String targetId) {
        List<EnemyState> living = state.getEnemies().stream()
                .filter(e -> e.getHp() > 0).collect(Collectors.toList());
        if (living.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No enemies alive");

        EnemyState t1 = findEnemy(state, targetId);
        EnemyState t2 = living.size() > 1
                ? living.stream().filter(e -> !e.getId().equals(targetId)).findFirst().orElse(t1)
                : t1;

        int dmg1 = Math.max(1, (hero.getStr() - enemyPhysDef(t1) + hero.getCyberPrecisionBonus()) / 2);
        if ("elemental".equals(t1.getType())) dmg1 = Math.max(1, dmg1 / 2);
        int dmg2 = Math.max(1, (hero.getStr() - enemyPhysDef(t2) + hero.getCyberPrecisionBonus()) / 2);
        if ("elemental".equals(t2.getType())) dmg2 = Math.max(1, dmg2 / 2);
        applyDmgToEnemy(t1, dmg1, state);
        applyBowSpdDebuff(state, hero); // shot 1
        applyDmgToEnemy(t2, dmg2, state);
        applyBowSpdDebuff(state, hero); // shot 2

        String msg = heroLabel(hero) + " fires Double Shot: " + t1.getName()
                + " takes " + dmg1 + " and " + t2.getName() + " takes " + dmg2 + " damage.";
        addLog(state, msg);
        return msg;
    }

    private String resolveCleave(BattleState state, HeroState hero) {
        StringBuilder sb = new StringBuilder(heroLabel(hero) + " cleaves:");
        for (EnemyState e : state.getEnemies()) {
            if (e.getHp() <= 0) continue;
            int dmg = Math.max(1, hero.getStr() - enemyPhysDef(e) + hero.getCyberPrecisionBonus());
            if ("elemental".equals(e.getType())) dmg = Math.max(1, dmg / 2);
            applyDmgToEnemy(e, dmg, state);
            sb.append(" ").append(e.getName()).append(" -").append(dmg).append("HP;");
        }
        String msg = sb.toString();
        addLog(state, msg);
        return msg;
    }

    private void applyBowSpdDebuff(BattleState state, HeroState hero) {
        if (hero.getSpd() > 1) {
            hero.setSpd(hero.getSpd() - 1);
            hero.setBowSpdDebuff(hero.getBowSpdDebuff() + 1);
            addLog(state, hero.getName() + "'s SPD reduced by 1 from bow strain.");
        }
    }

    private String resolveDeathDance(BattleState state, HeroState hero, EnemyState target) {
        String intro = heroLabel(hero) + " performs Death Dance on " + target.getName() + "!";
        addLog(state, intro);
        for (int hit = 1; hit <= 3 && target.getHp() > 0; hit++) {
            int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus());
            if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);
            applyDmgToEnemy(target, dmg, state);
            addLog(state, "  Hit " + hit + ": " + dmg + " damage.");
        }
        return intro;
    }

    private String resolveFatalShot(BattleState state, HeroState hero, EnemyState target) {
        applyBowSpdDebuff(state, hero);
        String msg;
        if (ThreadLocalRandom.current().nextDouble() < 0.5) {
            int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus()) * 2;
            if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);
            applyDmgToEnemy(target, dmg, state);
            msg = heroLabel(hero) + " lands a Fatal Shot on " + target.getName() + " for " + dmg + " damage!";
        } else {
            int dmg = ThreadLocalRandom.current().nextInt(1, 3);
            target.setHp(Math.max(0, target.getHp() - dmg));
            if (target.getHp() == 0) { target.getStatuses().clear(); addLog(state, target.getName() + " is defeated!"); }
            msg = heroLabel(hero) + "'s Fatal Shot grazes " + target.getName() + " for " + dmg + " damage.";
        }
        addLog(state, msg);
        return msg;
    }

    private String resolvePiercingShot(BattleState state, HeroState hero, EnemyState target) {
        applyBowSpdDebuff(state, hero);
        int baseDmg = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus());
        if ("elemental".equals(target.getType())) baseDmg = Math.max(1, baseDmg / 2);
        int extra = enemyPhysDef(target) > 0 ? ThreadLocalRandom.current().nextInt(1, 3) : 0;
        int dmg = baseDmg + extra;
        applyDmgToEnemy(target, dmg, state);
        String msg = heroLabel(hero) + " fires Piercing Shot at " + target.getName() + " for " + dmg + " damage"
                + (extra > 0 ? " (+" + extra + " piercing)!" : ".");
        addLog(state, msg);
        return msg;
    }

    private String resolvePoisonShot(BattleState state, HeroState hero, EnemyState target) {
        applyBowSpdDebuff(state, hero);
        int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus());
        if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);
        applyDmgToEnemy(target, dmg, state);
        StringBuilder msg = new StringBuilder(heroLabel(hero) + " fires Poison Shot at " + target.getName() + " for " + dmg + " damage.");
        if (target.getHp() > 0) {
            applyStatusEnemy(target, "poison", statusDuration("poison"), 1);
            msg.append(" ").append(target.getName()).append(" is poisoned!");
        }
        String result = msg.toString();
        addLog(state, result);
        return result;
    }

    private String resolveFireShot(BattleState state, HeroState hero, EnemyState target) {
        applyBowSpdDebuff(state, hero);
        int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus());
        if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);
        applyDmgToEnemy(target, dmg, state);
        StringBuilder msg = new StringBuilder(heroLabel(hero) + " fires Fire Shot at " + target.getName() + " for " + dmg + " damage.");
        if (target.getHp() > 0) {
            applyStatusEnemy(target, "burn", statusDuration("burn"), 1);
            msg.append(" ").append(target.getName()).append(" is burning!");
        }
        String result = msg.toString();
        addLog(state, result);
        return result;
    }

    private String resolveDoubleHit(BattleState state, HeroState hero, EnemyState target) {
        String weaponId = hero.getEquippedWeaponId();
        StringBuilder msg = new StringBuilder(heroLabel(hero) + " uses Double Hit on " + target.getName() + "!");

        int dmg1 = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus());
        if ("elemental".equals(target.getType())) dmg1 = Math.max(1, dmg1 / 2);
        applyDmgToEnemy(target, dmg1, state);
        msg.append(" Hit 1: ").append(dmg1).append(" dmg.");

        if (target.getHp() > 0 && "sword".equals(weaponId)) {
            if (ThreadLocalRandom.current().nextDouble() < 0.5) {
                applyStatusEnemy(target, "bleed", statusDuration("bleed"), 1);
                msg.append(" Bleed!");
            }
            if (ThreadLocalRandom.current().nextDouble() < 0.30) {
                applyStatusEnemy(target, "trauma", statusDuration("trauma"), 1);
                msg.append(" Trauma!");
            }
        }

        if (target.getHp() > 0) {
            int dmg2 = Math.max(1, (hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus()) / 2);
            if ("elemental".equals(target.getType())) dmg2 = Math.max(1, dmg2 / 2);
            applyDmgToEnemy(target, dmg2, state);
            msg.append(" Hit 2: ").append(dmg2).append(" dmg.");

            if (target.getHp() > 0 && "sword".equals(weaponId)) {
                if (ThreadLocalRandom.current().nextDouble() < 0.5) {
                    applyStatusEnemy(target, "bleed", statusDuration("bleed"), 1);
                    msg.append(" Bleed!");
                }
                if (ThreadLocalRandom.current().nextDouble() < 0.30) {
                    applyStatusEnemy(target, "trauma", statusDuration("trauma"), 1);
                    msg.append(" Trauma!");
                }
            }
        }

        String result = msg.toString();
        addLog(state, result);
        return result;
    }

    private String resolvePerfectDoubleCut(BattleState state, HeroState hero, EnemyState target) {
        StringBuilder msg = new StringBuilder(heroLabel(hero) + " performs Perfect Double Cut on " + target.getName() + "!");
        for (int hit = 1; hit <= 2; hit++) {
            if (target.getHp() <= 0) break;
            int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus());
            if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);
            applyDmgToEnemy(target, dmg, state);
            msg.append(" Hit ").append(hit).append(": ").append(dmg).append(" dmg.");
            if (target.getHp() > 0) {
                applyStatusEnemy(target, "bleed", statusDuration("bleed"), 1);
                msg.append(" Bleed!");
                if (ThreadLocalRandom.current().nextDouble() < 0.30) {
                    applyStatusEnemy(target, "trauma", statusDuration("trauma"), 1);
                    msg.append(" Trauma!");
                }
            }
        }
        String result = msg.toString();
        addLog(state, result);
        return result;
    }

    private String resolveSmash(BattleState state, HeroState hero, EnemyState target) {
        int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus());
        if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);
        applyDmgToEnemy(target, dmg, state);
        StringBuilder msg = new StringBuilder(heroLabel(hero) + " smashes " + target.getName() + " for " + dmg + " damage!");
        if (target.getHp() > 0) {
            applyStatusEnemy(target, "stun", statusDuration("stun"), 0);
            msg.append(" ").append(target.getName()).append(" is stunned!");
            applyStatusEnemy(target, "trauma", statusDuration("trauma"), 1);
            msg.append(" Trauma!");
        }
        String result = msg.toString();
        addLog(state, result);
        return result;
    }

    private String resolveExecution(BattleState state, HeroState hero, EnemyState target) {
        target.setHp(0);
        target.getStatuses().clear();
        String msg = heroLabel(hero) + " executes " + target.getName() + " — instant kill!";
        addLog(state, msg);
        addLog(state, target.getName() + " is defeated!");
        return msg;
    }

    private String resolveLargeHit(BattleState state, HeroState hero, EnemyState target) {
        int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target) + hero.getCyberPrecisionBonus());
        if ("elemental".equals(target.getType())) dmg = Math.max(1, dmg / 2);
        applyDmgToEnemy(target, dmg, state);
        StringBuilder msg = new StringBuilder(heroLabel(hero) + " uses Large Hit on " + target.getName() + " for " + dmg + " damage!");
        List<EnemyState> others = state.getEnemies().stream()
                .filter(e -> e.getHp() > 0 && !e.getId().equals(target.getId()))
                .collect(Collectors.toList());
        if (!others.isEmpty()) {
            EnemyState splash = others.get(ThreadLocalRandom.current().nextInt(others.size()));
            int splashDmg = Math.max(1, (hero.getStr() - enemyPhysDef(splash) + hero.getCyberPrecisionBonus()) / 2);
            if ("elemental".equals(splash.getType())) splashDmg = Math.max(1, splashDmg / 2);
            applyDmgToEnemy(splash, splashDmg, state);
            msg.append(" ").append(splash.getName()).append(" takes ").append(splashDmg).append(" splash damage.");
        }
        String result = msg.toString();
        addLog(state, result);
        return result;
    }

    private String resolveMagic(BattleState state, String actorId, String targetId, String spellId) {
        if (spellId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "spellId required");
        HeroState hero = findHero(state, actorId);

        if (hero.getStatuses().stream().anyMatch(s -> "silence".equals(s.getType()))) {
            log.warn("Hero {} is silenced", actorId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hero is silenced");
        }

        SpellData spell = gameDataService.findSpell(spellId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown spell: " + spellId));

        if (hero.getEn() < spell.enCost()) {
            log.warn("Hero {} insufficient EN for spell {}", actorId, spellId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient EN");
        }
        if (spell.enCost() > 0) hero.setEn(hero.getEn() - spell.enCost());

        if ("ally".equals(spell.targetType())) return resolveAllySpell(state, hero, targetId, spell);
        if ("all".equals(spell.targetType())) return resolveAoeSpell(state, hero, spell);
        if ("all_allies".equals(spell.targetType())) return resolveAllAlliesHealSpell(state, hero, spell);

        // Single-target offensive
        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");

        String school = spell.school().toLowerCase();
        if (target.getElementalImmunity().contains(school)) {
            String msg = target.getName() + " is immune to " + spell.school() + "!";
            addLog(state, msg);
            return msg;
        }

        int dmg = Math.max(1, hero.getIntel() + spellDamageBonus(spell.enCost()));

        // HolyBolt / Radiance bonus vs undead
        if (("holyBolt".equals(spellId) || "radiance".equals(spellId))
                && "undead".equals(target.getType())) dmg += 3;

        // Drain: caster absorbs half the damage dealt as HP
        if ("drain".equals(spellId)) {
            hero.setHp(Math.min(hero.getHp() + dmg / 2, hero.getMaxHp()));
        }

        applyDmgToEnemy(target, dmg, state);
        StringBuilder msg = new StringBuilder(heroLabel(hero) + " casts " + spell.name()
                + " on " + target.getName() + " for " + dmg + " damage.");

        if (spell.statusEffect() != null) {
            applyStatusEnemy(target, spell.statusEffect(), statusDuration(spell.statusEffect()), 1);
            msg.append(" ").append(target.getName()).append(" is ").append(spell.statusEffect()).append("!");
        }

        // Elemental schools have 50% chance to inflict their school status
        if (target.getHp() > 0) {
            String schoolStatus = switch (school) {
                case "fire"     -> "burn";
                case "ice"      -> "frozen";
                case "electric" -> "dizzle";
                default         -> null;
            };
            if (schoolStatus != null && ThreadLocalRandom.current().nextDouble() < 0.5) {
                applyStatusEnemy(target, schoolStatus, statusDuration(schoolStatus), 0);
                msg.append(" ").append(target.getName()).append(" is ").append(schoolStatus).append("!");
            }
        }

        // High-damage single-target spells (enCost 7) cause arcane splash on a random other enemy
        if (spell.enCost() == 7 && "single".equalsIgnoreCase(spell.targetType())) {
            List<EnemyState> others = state.getEnemies().stream()
                    .filter(e -> e.getHp() > 0 && !e.getId().equals(target.getId()))
                    .collect(Collectors.toList());
            if (!others.isEmpty()) {
                EnemyState splashTarget = others.get(ThreadLocalRandom.current().nextInt(others.size()));
                int splashDmg = ThreadLocalRandom.current().nextInt(1, 4); // 1–3 raw, ignores MDEF
                splashTarget.setHp(Math.max(0, splashTarget.getHp() - splashDmg));
                if (splashTarget.getHp() == 0) splashTarget.getStatuses().clear();
                addLog(state, msg.toString());
                String splashMsg = "Arcane shockwave hits " + splashTarget.getName() + " for " + splashDmg + "!";
                addLog(state, splashMsg);
                return msg + " " + splashMsg;
            }
        }

        String result = msg.toString();
        addLog(state, result);
        return result;
    }

    private String resolveAllySpell(BattleState state, HeroState caster, String targetId, SpellData spell) {
        HeroState target = (targetId != null) ? findHero(state, targetId) : caster;

        if ("revive".equals(spell.id())) {
            if (!target.isKnockedOut())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target is not knocked out");
            reviveHero(target);
            String msg = heroLabel(caster) + " revives " + heroLabel(target) + "!";
            addLog(state, msg);
            return msg;
        }

        if ("cure".equals(spell.id())) {
            target.getStatuses().clear();
            String msg = heroLabel(caster) + " cures " + heroLabel(target) + " of all status effects.";
            addLog(state, msg);
            return msg;
        }

        int healAmt = switch (spell.enCost()) {
            case 3 -> 5;
            case 5 -> 10;
            case 7 -> 20;
            default -> 3;
        };
        target.setHp(Math.min(target.getHp() + healAmt, target.getMaxHp()));
        String msg = heroLabel(caster) + " casts " + spell.name() + " on " + heroLabel(target)
                + ", restoring " + healAmt + " HP.";
        addLog(state, msg);
        return msg;
    }

    private String resolveAoeSpell(BattleState state, HeroState caster, SpellData spell) {
        String school = spell.school().toLowerCase();
        int dmg = Math.max(1, caster.getIntel() + spellDamageBonus(spell.enCost()));
        StringBuilder sb = new StringBuilder(heroLabel(caster) + " casts " + spell.name() + ":");
        for (EnemyState e : state.getEnemies()) {
            if (e.getHp() <= 0) continue;
            if (e.getElementalImmunity().contains(school)) {
                sb.append(" ").append(e.getName()).append(" (immune);");
                continue;
            }
            applyDmgToEnemy(e, dmg, state);
            sb.append(" ").append(e.getName()).append(" -").append(dmg).append("HP;");
        }
        String msg = sb.toString();
        addLog(state, msg);
        return msg;
    }

    private String resolveAllAlliesHealSpell(BattleState state, HeroState caster, SpellData spell) {
        int healAmt = 5;
        for (HeroState hero : state.getHeroes()) {
            if (!hero.isKnockedOut()) {
                hero.setHp(Math.min(hero.getHp() + healAmt, hero.getMaxHp()));
            }
        }
        String msg = heroLabel(caster) + " casts " + spell.name() + "! All heroes restore 5 HP.";
        addLog(state, msg);
        return msg;
    }

    public List<Map<String, Object>> castHealingSpellPrep(BattleState state, HeroState caster, String spellId, String targetHeroId) {
        SpellData spell = gameDataService.findSpell(spellId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown spell: " + spellId));
        if (caster.getEn() < spell.enCost()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient EN to cast " + spell.name());
        }
        caster.setEn(caster.getEn() - spell.enCost());

        List<Map<String, Object>> healed = new ArrayList<>();
        if ("massHeal".equals(spellId)) {
            for (HeroState hero : state.getHeroes()) {
                if (!hero.isKnockedOut()) {
                    int prev = hero.getHp();
                    hero.setHp(Math.min(hero.getHp() + 5, hero.getMaxHp()));
                    int amount = hero.getHp() - prev;
                    if (amount > 0) {
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("heroId", hero.getId());
                        entry.put("amount", amount);
                        healed.add(entry);
                    }
                }
            }
        } else {
            HeroState target = (targetHeroId != null) ? findHero(state, targetHeroId) : caster;
            if (target.isKnockedOut()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot heal a knocked-out hero with Mend");
            }
            int healAmt = 5;
            int prev = target.getHp();
            target.setHp(Math.min(target.getHp() + healAmt, target.getMaxHp()));
            int amount = target.getHp() - prev;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("heroId", target.getId());
            entry.put("amount", amount);
            healed.add(entry);
        }
        return healed;
    }

    private String performMagicBolt(BattleState state, HeroState hero, String targetId) {
        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");
        int dmg = Math.max(1, hero.getIntel());
        applyDmgToEnemy(target, dmg, state);
        String msg = heroLabel(hero) + " fires a magic bolt at " + target.getName() + " for " + dmg + " damage.";
        addLog(state, msg);
        return msg;
    }

    private String resolveItem(BattleState state, String actorId, String targetId, String itemId) {
        if (itemId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemId required");
        HeroState actor = findHero(state, actorId);
        consumeItem(state, actor, targetId, itemId);

        // Postpone: remove actor from current turn position, append to end
        List<String> order = state.getTurnOrder();
        int idx = order.indexOf(actorId);
        if (idx >= 0) {
            order.remove(idx);
            int nextIdx = order.isEmpty() ? 0 : idx % order.size();
            order.add(actorId);
            state.setCurrentTurnIndex(nextIdx);
            actor.setPostponed(true);
        }

        ItemData itemData = gameDataService.findItem(itemId).orElse(null);
        String itemName = itemData != null ? itemData.name() : itemId;
        String msg = heroLabel(actor) + " uses " + itemName + " and will act last this round.";
        addLog(state, msg);
        return msg;
    }

    public void consumeItem(BattleState state, HeroState actor, String targetId, String itemId) {
        InventoryItem inv = actor.getInventory().stream()
                .filter(i -> i.getItemId() != null && i.getItemId().equals(itemId)).findFirst()
                .orElseThrow(() -> {
                    log.warn("Hero {} does not have item {} (inventory size: {})", actor.getId(), itemId, actor.getInventory().size());
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item not in inventory: " + itemId);
                });

        HeroState targetHero = (targetId != null && targetId.startsWith("hero_"))
                ? findHero(state, targetId) : actor;

        switch (itemId) {
            case "healingPotion" -> {
                int heal = ThreadLocalRandom.current().nextInt(2, 5); // 2–4
                targetHero.setHp(Math.min(targetHero.getHp() + heal, targetHero.getMaxHp()));
                targetHero.getStatuses().removeIf(s ->
                        List.of("bleed", "stun", "slow", "blind", "pain").contains(s.getType()));
            }
            case "energyPotion" -> {
                int en = ThreadLocalRandom.current().nextInt(3, 6); // 3–5
                targetHero.setEn(Math.min(targetHero.getEn() + en, targetHero.getMaxEn()));
            }
            case "reviveScroll" -> {
                HeroState kd = findHero(state, targetId);
                if (!kd.isKnockedOut())
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target is not knocked out");
                reviveHero(kd);
            }
            case "speedPotion" -> {
                targetHero.setDex(targetHero.getDex() + 1);
                targetHero.setSpd(targetHero.getSpd() + 2);
                targetHero.setBaseSpd(targetHero.getBaseSpd() + 2);
                targetHero.setSpeedPotionDexBonus(targetHero.getSpeedPotionDexBonus() + 1);
            }
            case "regenLifePotion"   -> targetHero.setRegenHpPerTurn(targetHero.getRegenHpPerTurn() + 1);
            case "regenEnergyPotion" -> targetHero.setRegenEnPerTurn(targetHero.getRegenEnPerTurn() + 1);
            default -> log.warn("Unknown consumable item: {}", itemId);
        }

        if (inv.getQuantity() <= 1) actor.getInventory().remove(inv);
        else inv.setQuantity(inv.getQuantity() - 1);
    }

    private String changeWeapon(BattleState state, String actorId, String weaponId) {
        if (weaponId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemId (weapon) required");
        HeroState hero = findHero(state, actorId);
        ClassData cls = gameDataService.findClass(hero.getClassId()).orElseThrow();
        WeaponType newWeapon = gameDataService.findWeapon(weaponId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown weapon: " + weaponId));
        if (!newWeapon.equippableBy().contains(hero.getClassId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    cls.name() + " cannot equip " + newWeapon.name());
        }
        equipWeapon(hero, weaponId);
        String msg = heroLabel(hero) + " equips " + newWeapon.name() + ". (full turn used)";
        addLog(state, msg);
        return msg;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Enemy AI
    // ═══════════════════════════════════════════════════════════════════════

    public void resolveEnemyTurns(BattleState state) {
        if (state.isFightOver()) return;
        for (int guard = 0; guard < state.getTurnOrder().size(); guard++) {
            String activeId = findActiveActorId(state);
            if (activeId == null || activeId.startsWith("hero_")) break;

            EnemyState enemy = state.getEnemies().stream()
                    .filter(e -> e.getId().equals(activeId)).findFirst().orElse(null);
            if (enemy == null || enemy.getHp() <= 0) { advanceTurn(state); continue; }

            boolean stunned = enemy.getStatuses().stream()
                    .anyMatch(s -> "stun".equals(s.getType()) || "frozen".equals(s.getType()));
            if (!stunned) resolveEnemyAttack(enemy, state);

            tickEnemyStatuses(enemy, state);
            advanceTurn(state);

            if (checkAllHeroesDead(state)) {
                state.setFightOver(true);
                state.setVictory(false);
                return;
            }
        }
    }

    public String resolveOneEnemyTurn(BattleState state) {
        if (state.isFightOver()) return "Fight already over";
        String activeId = findActiveActorId(state);
        if (activeId == null || activeId.startsWith("hero_")) return "Hero turn";

        EnemyState enemy = state.getEnemies().stream()
                .filter(e -> e.getId().equals(activeId)).findFirst().orElse(null);
        if (enemy == null || enemy.getHp() <= 0) {
            advanceTurn(state);
            return "Dead enemy skipped";
        }

        boolean stunned = enemy.getStatuses().stream()
                .anyMatch(s -> "stun".equals(s.getType()) || "frozen".equals(s.getType()));
        String msg;
        if (!stunned) {
            resolveEnemyAttack(enemy, state);
            msg = enemy.getName() + " acts.";
        } else {
            addLog(state, enemy.getName() + " is stunned and cannot act.");
            msg = enemy.getName() + " is stunned.";
        }
        tickEnemyStatuses(enemy, state);
        advanceTurn(state);
        return msg;
    }

    private void resolveEnemyAttack(EnemyState enemy, BattleState state) {
        HeroState target = selectEnemyTarget(enemy, state);
        if (target == null) return;

        int reduction = physArmorReductionRandom(target.getEquippedArmorId()) + target.getArmorDefBonus();
        int dmg = Math.max(1, enemy.getStr() - reduction);

        if (target.getStatuses().stream().anyMatch(s -> "shell".equals(s.getType()))) {
            dmg = Math.max(1, dmg - 2);
        }

        if (enemy.isDisarmedDebuff()) {
            dmg = Math.max(1, dmg / 2);
        }

        if (target.getCyberArmorSkinBonus() > 0) {
            int skinReduction = ThreadLocalRandom.current().nextInt(target.getCyberArmorSkinBonus()) + 1;
            dmg = Math.max(1, dmg - skinReduction);
        }

        applyDmgToHero(target, dmg, state);
        String msg = enemy.getName() + " attacks " + heroLabel(target) + " for " + dmg + " damage.";
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
            case "high" -> living.stream()
                    .min(Comparator.comparingInt(h -> physArmorReductionBase(h.getEquippedArmorId())))
                    .orElse(living.get(0));
            default -> living.get(ThreadLocalRandom.current().nextInt(living.size()));
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Status effects
    // ═══════════════════════════════════════════════════════════════════════

    public void tickHeroStatuses(BattleState state) {
        for (HeroState h : state.getHeroes()) {
            if (h.isKnockedOut()) continue;

            // Per-battle regen from potions (no duration limit)
            if (h.getRegenHpPerTurn() > 0) {
                h.setHp(Math.min(h.getHp() + h.getRegenHpPerTurn(), h.getMaxHp()));
                addLog(state, heroLabel(h) + " regenerates " + h.getRegenHpPerTurn() + " HP.");
            }
            if (h.getRegenEnPerTurn() > 0) {
                h.setEn(Math.min(h.getEn() + h.getRegenEnPerTurn(), h.getMaxEn()));
            }

            // Enhanced "recover" advantage: +1 HP or EN per turn
            if ("enhanced".equals(h.getAugmentationId()) && "recover".equals(h.getAdvantageId())) {
                if (ThreadLocalRandom.current().nextBoolean()) {
                    if (h.getHp() < h.getMaxHp()) {
                        h.setHp(h.getHp() + 1);
                        addLog(state, heroLabel(h) + " recovers 1 HP (Recover).");
                    }
                } else {
                    if (h.getEn() < h.getMaxEn()) {
                        h.setEn(h.getEn() + 1);
                        addLog(state, heroLabel(h) + " recovers 1 EN (Recover).");
                    }
                }
            }

            Iterator<ActiveStatus> it = h.getStatuses().iterator();
            while (it.hasNext()) {
                ActiveStatus s = it.next();
                applyHeroStatusTick(h, s, state);
                s.setDuration(s.getDuration() - 1);
                if (s.getDuration() <= 0) it.remove();
            }
        }
    }

    private void applyHeroStatusTick(HeroState hero, ActiveStatus s, BattleState state) {
        switch (s.getType()) {
            case "bleed", "burn", "poison" -> {
                int dmg = Math.max(1, s.getMagnitude());
                applyDmgToHero(hero, dmg, state);
                addLog(state, heroLabel(hero) + " suffers " + dmg + " " + s.getType() + " damage.");
            }
            case "regen" -> {
                hero.setHp(Math.min(hero.getHp() + s.getMagnitude(), hero.getMaxHp()));
                addLog(state, heroLabel(hero) + " regenerates " + s.getMagnitude() + " HP.");
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
            if (s.getDuration() <= 0) {
                // Expire stat penalties
                if ("pain".equals(s.getType())) {
                    enemy.setStr(enemy.getStr() + s.getMagnitude());
                }
                if ("trauma".equals(s.getType())) {
                    if (s.getMagnitude() == 1) enemy.setStr(enemy.getStr() + 1);
                    else                       enemy.setDex(enemy.getDex() + 1);
                }
                if ("frozen".equals(s.getType())) {
                    enemy.setDex(enemy.getDex() + 2);
                }
                it.remove();
            }
        }
    }

    private void applyStatusEnemy(EnemyState enemy, String type, int duration, int magnitude) {
        enemy.getStatuses().removeIf(s -> s.getType().equals(type));
        enemy.getStatuses().add(new ActiveStatus(type, duration, magnitude));
        switch (type) {
            case "stun", "slow" -> enemy.setSpd(Math.max(1, enemy.getSpd() / 2));
            case "frozen" -> {
                enemy.setSpd(Math.max(1, enemy.getSpd() / 2));
                enemy.setDex(Math.max(1, enemy.getDex() - 2));
            }
            case "dizzle" -> {} // effect applied in enemyPhysDef; no immediate stat change
            case "pain"         -> enemy.setStr(Math.max(1, enemy.getStr() - magnitude));
            case "trauma" -> {
                // magnitude: 1 = reduce STR, 2 = reduce DEX (determined randomly at application)
                int statChoice = ThreadLocalRandom.current().nextBoolean() ? 1 : 2;
                enemy.getStatuses().stream()
                        .filter(s -> "trauma".equals(s.getType()))
                        .findFirst()
                        .ifPresent(s -> s.setMagnitude(statChoice));
                if (statChoice == 1) enemy.setStr(Math.max(1, enemy.getStr() - 1));
                else                 enemy.setDex(Math.max(1, enemy.getDex() - 1));
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Damage helpers
    // ═══════════════════════════════════════════════════════════════════════

    private int physArmorReductionBase(String armorId) {
        if (armorId == null) return 0;
        return switch (armorId) {
            case "heavy"        -> 2;
            case "medium"       -> 1;
            case "light"        -> 1;
            default             -> 0;
        };
    }

    private int physArmorReductionRandom(String armorId) {
        if (armorId == null) return 0;
        return switch (armorId) {
            case "heavy"  -> 2;
            case "medium" -> ThreadLocalRandom.current().nextBoolean() ? 1 : 2;
            case "light"  -> 1;
            default       -> 0;
        };
    }

    private int magicArmorReduction(String armorId) {
        return "magicClothes".equals(armorId) ? 1 : 0;
    }

    private int enemyPhysDef(EnemyState enemy) {
        int base = "mechanical".equals(enemy.getType()) ? 1 : 0;
        if (enemy.getStatuses().stream().anyMatch(s -> "dizzle".equals(s.getType()))) {
            base = Math.max(0, base - 1);
        }
        return base;
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

    private int statusDuration(String type) {
        return switch (type) {
            case "stun", "frozen" -> 1;
            case "bleed"          -> 4;
            case "burn", "poison", "regen" -> 3;
            case "dizzle"         -> 2;
            default               -> 2;
        };
    }

    private void applyDmgToHero(HeroState hero, int dmg, BattleState state) {
        // Barrier Ring: absorbs this entire attack (starting accessory)
        if ("barrierRing".equals(hero.getEquippedStartingAccessoryId())) {
            hero.setEquippedStartingAccessoryId(null);
            addLog(state, heroLabel(hero) + "'s Common Barrier Ring absorbs the attack and shatters!");
            return;
        }

        int newHp = Math.max(0, hero.getHp() - dmg);
        hero.setHp(newHp);

        if (newHp <= 0 && !hero.isKnockedOut()) {
            // Rebirth Ring: triggers on fatal blow — restore full HP/EN, destroy ring
            InventoryItem rebirthRing = findEquippedEffectAccessory(hero, "rebirth");
            if (rebirthRing != null) {
                hero.setHp(hero.getMaxHp());
                hero.setEn(hero.getMaxEn());
                hero.getInventory().remove(rebirthRing);
                hero.setEquippedLootAccessoryUuid(null);
                addLog(state, heroLabel(hero) + "'s Magic Rebirth Ring shatters! "
                        + heroLabel(hero) + " is fully restored!");
                return; // no knockout
            }
            hero.setKnockedOut(true);
            hero.getStatuses().clear();
            addLog(state, heroLabel(hero) + " is knocked out!");
        }
    }

    private InventoryItem findEquippedEffectAccessory(HeroState hero, String effectId) {
        String uuid = hero.getEquippedLootAccessoryUuid();
        if (uuid == null) return null;
        return hero.getInventory().stream()
                .filter(i -> uuid.equals(i.getItemUuid()) && effectId.equals(i.getEffectId()))
                .findFirst().orElse(null);
    }

    private void applyDmgToEnemy(EnemyState enemy, int dmg, BattleState state) {
        int finalDmg = dmg;
        if (enemy.isDestroyArmorDebuff()) {
            int bonus = ThreadLocalRandom.current().nextInt(2, 4); // 2-3
            finalDmg += bonus;
            addLog(state, "Shattered armor: +" + bonus + " bonus damage to " + enemy.getName() + ".");
        }
        enemy.setHp(Math.max(0, enemy.getHp() - finalDmg));
        if (enemy.getHp() == 0) {
            enemy.getStatuses().clear();
            addLog(state, enemy.getName() + " is defeated!");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Weapon equip
    // ═══════════════════════════════════════════════════════════════════════

    private void equipWeapon(HeroState hero, String weaponId) {
        if ("greatsword".equals(hero.getEquippedWeaponId())) hero.setDex(hero.getDex() + 1);
        hero.setEquippedWeaponId(weaponId);
        if ("greatsword".equals(weaponId)) hero.setDex(Math.max(1, hero.getDex() - 1));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Hero / enemy finders
    // ═══════════════════════════════════════════════════════════════════════

    public HeroState findHero(BattleState state, String heroId) {
        return state.getHeroes().stream().filter(h -> h.getId().equals(heroId)).findFirst()
                .orElseThrow(() -> {
                    log.warn("Hero {} not found", heroId);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hero not found: " + heroId);
                });
    }

    public EnemyState findEnemy(BattleState state, String enemyId) {
        return state.getEnemies().stream().filter(e -> e.getId().equals(enemyId)).findFirst()
                .orElseThrow(() -> {
                    log.warn("Enemy {} not found", enemyId);
                    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enemy not found: " + enemyId);
                });
    }

    public void reviveHero(HeroState hero) {
        hero.setKnockedOut(false);
        hero.setHp(Math.max(1, hero.getMaxHp() / 4));
        hero.getStatuses().clear();
    }

    public void addToInventory(HeroState hero, String itemId, int qty) {
        hero.getInventory().stream()
                .filter(i -> itemId.equals(i.getItemId()))
                .findFirst()
                .ifPresentOrElse(
                        i -> i.setQuantity(i.getQuantity() + qty),
                        () -> hero.getInventory().add(InventoryItem.consumable(itemId, qty)));
    }

    public void addLootToInventory(HeroState hero, LootItemDTO loot) {
        if ("CONSUMABLE".equals(loot.itemType()) && loot.itemId() != null) {
            addToInventory(hero, loot.itemId(), 1);
            return;
        }
        if ("WEAPON".equals(loot.itemType()) && loot.weaponTypeId() != null) {
            hero.getInventory().add(InventoryItem.weaponLoot(
                    loot.itemUuid(), loot.weaponTypeId(), loot.name(),
                    loot.quality(), loot.modifiers(), loot.description()));
            return;
        }
        // Check for named special accessories (e.g. Rebirth Ring)
        if ("ACCESSORY".equals(loot.itemType()) && loot.name() != null
                && loot.name().contains("Rebirth Ring")) {
            hero.getInventory().add(InventoryItem.specialAccessoryLoot(
                    loot.itemUuid(), "rebirth", loot.name(), loot.quality(),
                    loot.description() != null ? loot.description() : "Restores full HP and EN once on defeat."));
            return;
        }
        hero.getInventory().add(InventoryItem.loot(
                loot.itemUuid(), loot.itemType(), loot.name(),
                loot.quality(), loot.modifiers(), loot.description()));
    }

    public void equipLootItemFromInventory(HeroState hero, String itemUuid, String equipSlot) {
        InventoryItem lootItem = hero.getInventory().stream()
                .filter(i -> itemUuid.equals(i.getItemUuid()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Item not found in inventory: " + itemUuid));

        boolean valid = switch (equipSlot) {
            case "WEAPON_PRIMARY", "WEAPON_SECONDARY" -> "WEAPON".equals(lootItem.getItemType());
            case "ARMOR"     -> "ARMOR".equals(lootItem.getItemType());
            case "ACCESSORY" -> "ACCESSORY".equals(lootItem.getItemType());
            default -> false;
        };
        if (!valid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Item type " + lootItem.getItemType() + " does not match slot " + equipSlot);

        // Revert bonuses from the previously equipped loot in this slot
        String prevUuid = getEquippedLootUuid(hero, equipSlot);
        if (prevUuid != null && !prevUuid.equals(itemUuid)) {
            hero.getInventory().stream()
                    .filter(i -> prevUuid.equals(i.getItemUuid()))
                    .findFirst()
                    .ifPresent(prev -> revertModifierBonuses(hero, prev.getModifiers()));
        }

        if (!itemUuid.equals(prevUuid)) {
            applyModifierBonuses(hero, lootItem.getModifiers());
            setEquippedLootUuid(hero, equipSlot, itemUuid);
        }
        int logDef  = physArmorReductionBase(hero.getEquippedArmorId()) + hero.getArmorDefBonus();
        int logMdef = magicArmorReduction(hero.getEquippedArmorId());
        log.info("Hero {} equipped {}. New stats: STR={} DEX={} INT={} DEF={} MDEF={} HP={} EN={}",
                hero.getName() != null ? hero.getName() : hero.getClassId(),
                lootItem.getName(), hero.getStr(), hero.getDex(), hero.getIntel(),
                logDef, logMdef, hero.getHp(), hero.getEn());
    }

    private String getEquippedLootUuid(HeroState hero, String slot) {
        return switch (slot) {
            case "WEAPON_PRIMARY"   -> hero.getEquippedLootWeaponUuid();
            case "WEAPON_SECONDARY" -> hero.getEquippedLootSecondaryUuid();
            case "ARMOR"            -> hero.getEquippedLootArmorUuid();
            case "ACCESSORY"        -> hero.getEquippedLootAccessoryUuid();
            default -> null;
        };
    }

    private void setEquippedLootUuid(HeroState hero, String slot, String uuid) {
        switch (slot) {
            case "WEAPON_PRIMARY"   -> hero.setEquippedLootWeaponUuid(uuid);
            case "WEAPON_SECONDARY" -> hero.setEquippedLootSecondaryUuid(uuid);
            case "ARMOR"            -> hero.setEquippedLootArmorUuid(uuid);
            case "ACCESSORY"        -> hero.setEquippedLootAccessoryUuid(uuid);
        }
    }

    private void applyModifierBonuses(HeroState hero, List<String> modifiers) {
        if (modifiers == null) return;
        for (String mod : modifiers) {
            switch (mod) {
                case "Strong", "Sharp" -> hero.setStr(hero.getStr() + 1);
                case "Swift"           -> hero.setDex(hero.getDex() + 1);
                case "Wise"            -> hero.setIntel(hero.getIntel() + 1);
                case "Quick"           -> hero.setSpd(hero.getSpd() + 1);
                case "Tough"           -> {
                    hero.setMaxHp(hero.getMaxHp() + 2);
                    hero.setHp(Math.min(hero.getHp() + 2, hero.getMaxHp()));
                }
                case "Enduring"        -> {
                    hero.setMaxEn(hero.getMaxEn() + 2);
                    hero.setEn(Math.min(hero.getEn() + 2, hero.getMaxEn()));
                }
                case "Warded"          -> hero.setArmorDefBonus(hero.getArmorDefBonus() + 1);
            }
        }
    }

    private void revertModifierBonuses(HeroState hero, List<String> modifiers) {
        if (modifiers == null) return;
        for (String mod : modifiers) {
            switch (mod) {
                case "Strong", "Sharp" -> hero.setStr(Math.max(1, hero.getStr() - 1));
                case "Swift"           -> hero.setDex(Math.max(1, hero.getDex() - 1));
                case "Wise"            -> hero.setIntel(Math.max(1, hero.getIntel() - 1));
                case "Quick"           -> hero.setSpd(Math.max(1, hero.getSpd() - 1));
                case "Tough"           -> {
                    hero.setMaxHp(Math.max(1, hero.getMaxHp() - 2));
                    hero.setHp(Math.min(hero.getHp(), hero.getMaxHp()));
                }
                case "Enduring"        -> {
                    hero.setMaxEn(Math.max(1, hero.getMaxEn() - 2));
                    hero.setEn(Math.min(hero.getEn(), hero.getMaxEn()));
                }
                case "Warded"          -> hero.setArmorDefBonus(Math.max(0, hero.getArmorDefBonus() - 1));
            }
        }
    }

    private void addLog(BattleState state, String msg) {
        state.getCombatLog().add(msg);
        if (state.getCombatLog().size() > 30) state.getCombatLog().remove(0);
    }

    // Returns the hero's assigned name, falling back to classId
    private String heroLabel(HeroState h) {
        return (h.getName() != null && !h.getName().isEmpty()) ? h.getName() : h.getClassId();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DTO mapping
    // ═══════════════════════════════════════════════════════════════════════

    public BattleStateResponse toBattleStateResponse(UUID runUuid, BattleState state) {
        List<HeroStateDTO> heroes = state.getHeroes().stream().map(this::toHeroDTO).collect(Collectors.toList());
        List<EnemyStateDTO> enemies = state.getEnemies().stream().map(this::toEnemyDTO).collect(Collectors.toList());
        String activeId = state.isFightOver() ? null : findActiveActorId(state);
        String cyclePos = state.getCyclePosition();
        // Trim combat log to last 10
        List<String> log = state.getCombatLog();
        List<String> trimmedLog = log.size() > 10 ? List.copyOf(log.subList(log.size() - 10, log.size())) : List.copyOf(log);
        return new BattleStateResponse(
                runUuid, state.getFightNumber(),
                cyclePos, "No modifier",
                enemies, heroes, List.copyOf(state.getTurnOrder()),
                activeId, trimmedLog, state.isFightOver(), state.isVictory());
    }

    public List<HeroStateDTO> toHeroDTOs(List<HeroState> heroes) {
        return heroes.stream().map(this::toHeroDTO).collect(Collectors.toList());
    }

    private HeroStateDTO toHeroDTO(HeroState h) {
        ClassData cls = gameDataService.findClass(h.getClassId()).orElse(null);
        String heroName = h.getName() != null ? h.getName() : h.getClassId();
        String name = cls != null ? cls.name() : h.getClassId();

        List<ActiveStatusDTO> statuses = h.getStatuses().stream()
                .map(s -> new ActiveStatusDTO(s.getType(), s.getDuration()))
                .collect(Collectors.toList());

        int def = physArmorReductionBase(h.getEquippedArmorId()) + h.getArmorDefBonus();
        int mdef = magicArmorReduction(h.getEquippedArmorId());

        // Derive effective weapon: loot weapon overrides base weapon for skill list
        String effectiveWeaponId = h.getEquippedWeaponId();
        if (h.getEquippedLootWeaponUuid() != null) {
            String lootWepType = h.getInventory().stream()
                    .filter(i -> h.getEquippedLootWeaponUuid().equals(i.getItemUuid())
                            && i.getWeaponTypeId() != null)
                    .map(InventoryItem::getWeaponTypeId)
                    .findFirst().orElse(null);
            if (lootWepType != null) effectiveWeaponId = lootWepType;
        }
        List<SkillSummaryDTO> skills = List.of();
        if (effectiveWeaponId != null) {
            WeaponType weapon = gameDataService.findWeapon(effectiveWeaponId).orElse(null);
            if (weapon != null && weapon.skills() != null) {
                skills = weapon.skills().stream()
                        .map(s -> new SkillSummaryDTO(s.id(), s.name(), s.enCost()))
                        .collect(Collectors.toList());
            }
        }

        List<SpellSummaryDTO> spells = null;
        if (cls != null && "MAGIC".equals(cls.type())) {
            spells = availableSpells(h);
        }

        List<ItemSummaryDTO> inventory = new ArrayList<>();
        for (InventoryItem inv : h.getInventory()) {
            if (inv.getItemUuid() != null) {
                // Loot item — include directly
                inventory.add(new ItemSummaryDTO(
                        null, inv.getName(), inv.getItemType() != null ? inv.getItemType().toLowerCase() : "loot",
                        inv.getItemUuid(), inv.getQuality(), inv.getModifiers(), inv.getDescription()));
            } else if (inv.getItemId() != null) {
                // Consumable stack — one entry per quantity
                ItemData item = gameDataService.findItem(inv.getItemId()).orElse(null);
                if (item != null) {
                    for (int q = 0; q < inv.getQuantity(); q++) {
                        inventory.add(new ItemSummaryDTO(
                                inv.getItemId(), item.name(), "consumable",
                                null, null, null, item.effect()));
                    }
                }
            }
        }

        return new HeroStateDTO(
                h.getId(), heroName, name, h.getClassId(),
                h.getHp(), h.getMaxHp(), h.getEn(), h.getMaxEn(),
                h.getSpd(), h.getStr(), def, mdef,
                statuses, h.isKnockedOut(), skills, spells, inventory,
                h.getSecondaryWeaponId(), h.isPostponed(),
                h.getEquippedWeaponId(), h.getEquippedArmorId(),
                h.getEquippedLootWeaponUuid(), h.getEquippedLootSecondaryUuid(),
                h.getEquippedLootArmorUuid(), h.getEquippedLootAccessoryUuid(),
                h.getEquippedStartingAccessoryId(),
                h.getAugmentationId(), h.getAdvantageId());
    }

    private List<SpellSummaryDTO> availableSpells(HeroState hero) {
        if ("cleric".equals(hero.getClassId())) {
            return gameDataService.allSpells().stream()
                    .filter(s -> "light".equalsIgnoreCase(s.school()))
                    .map(s -> new SpellSummaryDTO(s.id(), s.name(), s.school(), s.enCost()))
                    .collect(Collectors.toList());
        }
        if ("mage".equals(hero.getClassId())) {
            String specId = hero.getMageSpecId();
            String specSchool = specId != null ? switch (specId) {
                case "fireMage"  -> "fire";
                case "iceMage"   -> "ice";
                case "stormMage" -> "electric";
                default          -> null;
            } : null;
            Set<String> arcanePool = new HashSet<>(
                    hero.getMageSpellPool() != null ? hero.getMageSpellPool() : List.of());
            return gameDataService.allSpells().stream()
                    .filter(s -> {
                        String school = s.school().toLowerCase();
                        if (specSchool != null && school.equals(specSchool)) return true;
                        return "arcane".equals(school) && arcanePool.contains(s.id());
                    })
                    .map(s -> new SpellSummaryDTO(s.id(), s.name(), s.school(), s.enCost()))
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    private EnemyStateDTO toEnemyDTO(EnemyState e) {
        List<ActiveStatusDTO> statuses = e.getStatuses().stream()
                .map(s -> new ActiveStatusDTO(s.getType(), s.getDuration()))
                .collect(Collectors.toList());
        return new EnemyStateDTO(e.getId(), e.getName(), e.getType(), e.getHp(), e.getMaxHp(), statuses);
    }
}
