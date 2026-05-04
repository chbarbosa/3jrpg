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

    public List<HeroState> buildHeroStates(List<HeroConfigDTO> team) {
        List<HeroState> heroes = new ArrayList<>();
        for (int i = 0; i < team.size(); i++) {
            heroes.add(buildHeroState("hero_" + i, team.get(i)));
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

        if (cfg.augmentationType() != null && cfg.augmentationAdvantageId() != null) {
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
                }
                // "cyber" — no stat tradeoff; vulnerability to Electric handled in damage resolution
            }
        }

        h.setBaseStr(str); h.setBaseDex(dex); h.setBaseIntel(intel);
        h.setBaseSpd(spd); h.setBaseMaxHp(maxHp); h.setBaseMaxEn(maxEn);
        h.setStr(str); h.setDex(dex); h.setIntel(intel);
        h.setSpd(spd);
        h.setMaxHp(Math.max(1, maxHp)); h.setMaxEn(Math.max(1, maxEn));
        h.setHp(h.getMaxHp()); h.setEn(h.getMaxEn());
        h.setKnockedOut(false);

        equipWeapon(h, cfg.primaryWeaponId());
        String armorId = (cfg.armorId() != null) ? cfg.armorId() : cls.equippableArmor();
        h.setEquippedArmorId(armorId);

        return h;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Per-battle buff reset (called on nextFight)
    // ═══════════════════════════════════════════════════════════════════════

    public void resetPerBattleBuffs(List<HeroState> heroes) {
        for (HeroState h : heroes) {
            if (h.getSpdPotionBonus() > 0) {
                h.setSpd(Math.max(1, h.getSpd() - h.getSpdPotionBonus()));
                h.setSpdPotionBonus(0);
            }
            h.setRegenHpPerTurn(0);
            h.setRegenEnPerTurn(0);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Turn order
    // ═══════════════════════════════════════════════════════════════════════

    public List<String> buildTurnOrder(BattleState state) {
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
        List<String> order = state.getTurnOrder();
        int n = order.size();
        if (n == 0) return;
        int next = (state.getCurrentTurnIndex() + 1) % n;
        for (int safety = 0; safety < n; safety++) {
            if (isAlive(order.get(next), state)) break;
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
        return switch (req.actionType()) {
            case ATTACK        -> resolveAttack(state, req.actorId(), req.targetId());
            case SKILL         -> resolveSkill(state, req.actorId(), req.targetId(), req.skillId());
            case MAGIC         -> resolveMagic(state, req.actorId(), req.targetId(), req.spellId());
            case ITEM          -> resolveItem(state, req.actorId(), req.targetId(), req.itemId());
            case CHANGE_WEAPON -> changeWeapon(state, req.actorId(), req.itemId());
        };
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

        // Bow: 20% chance slow, 10% chance pain
        if ("bow".equals(weapon.id())) {
            double roll = ThreadLocalRandom.current().nextDouble();
            if (roll < 0.10) {
                applyStatusEnemy(target, "pain", 2, 1);
                addLog(state, target.getName() + " is in pain (-1 STR)!");
            } else if (roll < 0.30) {
                applyStatusEnemy(target, "slow", 2, 0);
                addLog(state, target.getName() + " is slowed!");
            }
        }

        applyDmgToEnemy(target, dmg, state);
        String msg = hero.getClassId() + " attacks " + target.getName() + " for " + dmg + " damage.";
        addLog(state, msg);
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

        if ("doubleShot".equals(skillId)) return resolveDoubleShot(state, hero, targetId);
        if ("cleave".equals(skillId)) return resolveCleave(state, hero);

        int dmg = Math.max(1, hero.getStr() - enemyPhysDef(target));

        // Greatsword passive bonus vs beast
        if ("greatsword".equals(hero.getEquippedWeaponId()) && "beast".equals(target.getType())) dmg += 2;

        if ("heavyStrike".equals(skillId)) dmg += 4;

        // Dismember: 20% instant kill vs humanoids only (undead/mechanical immune)
        if ("dismember".equals(skillId)
                && "humanoid".equals(target.getType())
                && !target.isInstantKillImmune()
                && ThreadLocalRandom.current().nextDouble() < 0.20) {
            target.setHp(0);
            String msg = hero.getClassId() + " dismembers " + target.getName() + " — instant kill!";
            addLog(state, msg);
            return msg;
        }

        applyDmgToEnemy(target, dmg, state);

        StringBuilder msg = new StringBuilder(hero.getClassId() + " uses " + skill.name()
                + " on " + target.getName() + " for " + dmg + " damage.");

        // SpeedBreak: reduce SPD by ~25%
        if ("speedBreak".equals(skillId)) {
            int reduction = Math.max(1, target.getSpd() / 4);
            target.setSpd(Math.max(1, target.getSpd() - reduction));
            msg.append(" " + target.getName() + "'s SPD reduced!");
            // needs to reorder after the end of the current turn.
        }

        // HeadBash → Stunned (half SPD)
        if ("headBash".equals(skillId)) {
            applyStatusEnemy(target, "stun", 1, 0);
            msg.append(" " + target.getName() + " is stunned!");
            // needs to reorder after the end of the current turn.
        }

        // LimbStrike → Pain (-1 STR)
        if ("limbStrike".equals(skillId)) {
            applyStatusEnemy(target, "pain", 2, 1);
            msg.append(" " + target.getName() + " is in pain!");
        }

        // Generic skill status from data
        if (skill.statusEffect() != null && !"stun".equals(skillId) && !"pain".equals(skillId)
                && ThreadLocalRandom.current().nextDouble() < skill.statusChance()) {
            applyStatusEnemy(target, skill.statusEffect(), statusDuration(skill.statusEffect()), 1);
            msg.append(" " + target.getName() + " is " + skill.statusEffect() + "!");
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

        int dmg = Math.max(1, (hero.getStr() - enemyPhysDef(t1)) / 2);
        applyDmgToEnemy(t1, dmg, state);
        applyDmgToEnemy(t2, dmg, state);

        String msg = hero.getClassId() + " fires Double Shot: " + t1.getName()
                + " and " + t2.getName() + " each take " + dmg + " damage.";
        addLog(state, msg);
        return msg;
    }

    private String resolveCleave(BattleState state, HeroState hero) {
        StringBuilder sb = new StringBuilder(hero.getClassId() + " cleaves:");
        for (EnemyState e : state.getEnemies()) {
            if (e.getHp() <= 0) continue;
            int dmg = Math.max(1, hero.getStr() - enemyPhysDef(e));
            applyDmgToEnemy(e, dmg, state);
            sb.append(" ").append(e.getName()).append(" -").append(dmg).append("HP;");
        }
        String msg = sb.toString();
        addLog(state, msg);
        return msg;
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
        StringBuilder msg = new StringBuilder(hero.getClassId() + " casts " + spell.name()
                + " on " + target.getName() + " for " + dmg + " damage.");

        if (spell.statusEffect() != null) {
            applyStatusEnemy(target, spell.statusEffect(), statusDuration(spell.statusEffect()), 1);
            msg.append(" ").append(target.getName()).append(" is ").append(spell.statusEffect()).append("!");
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
            String msg = caster.getClassId() + " revives " + target.getClassId() + "!";
            addLog(state, msg);
            return msg;
        }

        if ("cure".equals(spell.id())) {
            target.getStatuses().clear();
            String msg = caster.getClassId() + " cures " + target.getClassId() + " of all status effects.";
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
        String msg = caster.getClassId() + " casts " + spell.name() + " on " + target.getClassId()
                + ", restoring " + healAmt + " HP.";
        addLog(state, msg);
        return msg;
    }

    private String resolveAoeSpell(BattleState state, HeroState caster, SpellData spell) {
        String school = spell.school().toLowerCase();
        int dmg = Math.max(1, caster.getIntel() + spellDamageBonus(spell.enCost()));
        StringBuilder sb = new StringBuilder(caster.getClassId() + " casts " + spell.name() + ":");
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

    private String performMagicBolt(BattleState state, HeroState hero, String targetId) {
        EnemyState target = findEnemy(state, targetId);
        if (target.getHp() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target already dead");
        int dmg = Math.max(1, hero.getIntel());
        applyDmgToEnemy(target, dmg, state);
        String msg = hero.getClassId() + " fires a magic bolt at " + target.getName() + " for " + dmg + " damage.";
        addLog(state, msg);
        return msg;
    }

    private String resolveItem(BattleState state, String actorId, String targetId, String itemId) {
        if (itemId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemId required");
        HeroState actor = findHero(state, actorId);
        consumeItem(state, actor, targetId, itemId);
        String msg = actor.getClassId() + " uses " + itemId + ".";
        addLog(state, msg);
        return msg;
    }

    public void consumeItem(BattleState state, HeroState actor, String targetId, String itemId) {
        InventoryItem inv = actor.getInventory().stream()
                .filter(i -> i.getItemId().equals(itemId)).findFirst()
                .orElseThrow(() -> {
                    log.warn("Hero {} does not have item {}", actor.getId(), itemId);
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
            case "magicSicknessPotion" -> {
                targetHero.getStatuses().removeIf(s ->
                        List.of("burn", "poison", "frozen", "silence", "blind").contains(s.getType()));
            }
            case "speedPotion" -> {
                int bonus = 2;
                targetHero.setSpd(targetHero.getSpd() + bonus);
                targetHero.setSpdPotionBonus(targetHero.getSpdPotionBonus() + bonus);
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
        String msg = hero.getClassId() + " equips " + newWeapon.name() + ". (full turn used)";
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

    private void resolveEnemyAttack(EnemyState enemy, BattleState state) {
        HeroState target = selectEnemyTarget(enemy, state);
        if (target == null) return;

        int reduction = physArmorReductionRandom(target.getEquippedArmorId()) + target.getArmorDefBonus();
        int dmg = Math.max(1, enemy.getStr() - reduction);

        if (target.getStatuses().stream().anyMatch(s -> "shell".equals(s.getType()))) {
            dmg = Math.max(1, dmg - 2);
        }

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
                addLog(state, h.getClassId() + " regenerates " + h.getRegenHpPerTurn() + " HP.");
            }
            if (h.getRegenEnPerTurn() > 0) {
                h.setEn(Math.min(h.getEn() + h.getRegenEnPerTurn(), h.getMaxEn()));
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
                addLog(state, hero.getClassId() + " takes " + dmg + " " + s.getType() + " damage.");
            }
            case "regen" -> {
                hero.setHp(Math.min(hero.getHp() + s.getMagnitude(), hero.getMaxHp()));
                addLog(state, hero.getClassId() + " regenerates " + s.getMagnitude() + " HP.");
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
                it.remove();
            }
        }
    }

    private void applyStatusEnemy(EnemyState enemy, String type, int duration, int magnitude) {
        enemy.getStatuses().removeIf(s -> s.getType().equals(type));
        enemy.getStatuses().add(new ActiveStatus(type, duration, magnitude));
        switch (type) {
            case "stun", "slow" -> enemy.setSpd(Math.max(1, enemy.getSpd() / 2));
            case "pain"         -> enemy.setStr(Math.max(1, enemy.getStr() - magnitude));
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

    private int statusDuration(String type) {
        return switch (type) {
            case "stun", "frozen" -> 1;
            case "bleed"          -> 4;
            case "burn", "poison", "regen" -> 3;
            default               -> 2;
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
        hero.getInventory().stream().filter(i -> i.getItemId().equals(itemId)).findFirst()
                .ifPresentOrElse(
                        i -> i.setQuantity(i.getQuantity() + qty),
                        () -> hero.getInventory().add(new InventoryItem(itemId, qty)));
    }

    private void addLog(BattleState state, String msg) {
        state.getCombatLog().add(msg);
        if (state.getCombatLog().size() > 30) state.getCombatLog().remove(0);
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
                cyclePos, MonsterCapService.cycleDescription(cyclePos),
                enemies, heroes, List.copyOf(state.getTurnOrder()),
                activeId, trimmedLog, state.isFightOver(), state.isVictory());
    }

    public List<HeroStateDTO> toHeroDTOs(List<HeroState> heroes) {
        return heroes.stream().map(this::toHeroDTO).collect(Collectors.toList());
    }

    private HeroStateDTO toHeroDTO(HeroState h) {
        ClassData cls = gameDataService.findClass(h.getClassId()).orElse(null);
        String name = cls != null ? cls.name() : h.getClassId();

        List<ActiveStatusDTO> statuses = h.getStatuses().stream()
                .map(s -> new ActiveStatusDTO(s.getType(), s.getDuration()))
                .collect(Collectors.toList());

        int def = physArmorReductionBase(h.getEquippedArmorId()) + h.getArmorDefBonus();
        int mdef = magicArmorReduction(h.getEquippedArmorId());

        List<SkillSummaryDTO> skills = List.of();
        if (h.getEquippedWeaponId() != null) {
            WeaponType weapon = gameDataService.findWeapon(h.getEquippedWeaponId()).orElse(null);
            if (weapon != null && weapon.skills() != null) {
                skills = weapon.skills().stream()
                        .map(s -> new SkillSummaryDTO(s.id(), s.name(), s.enCost()))
                        .collect(Collectors.toList());
            }
        }

        List<SpellSummaryDTO> spells = null;
        if (cls != null && "MAGIC".equals(cls.type())) {
            spells = availableSpells(h.getClassId());
        }

        List<ItemSummaryDTO> inventory = h.getInventory().stream()
                .flatMap(inv -> {
                    ItemData item = gameDataService.findItem(inv.getItemId()).orElse(null);
                    if (item == null) return java.util.stream.Stream.empty();
                    return java.util.stream.Stream.generate(
                                    () -> new ItemSummaryDTO(inv.getItemId(), item.name(), "consumable"))
                            .limit(inv.getQuantity());
                })
                .collect(Collectors.toList());

        return new HeroStateDTO(
                h.getId(), name, h.getClassId(),
                h.getHp(), h.getMaxHp(), h.getEn(), h.getMaxEn(),
                h.getSpd(), h.getStr(), def, mdef,
                statuses, h.isKnockedOut(), skills, spells, inventory);
    }

    private List<SpellSummaryDTO> availableSpells(String classId) {
        Set<String> schools = switch (classId) {
            case "mage"   -> Set.of("fire", "ice", "electric", "arcane");
            case "priest" -> Set.of("light");
            default       -> Set.of();
        };
        return gameDataService.allSpells().stream()
                .filter(s -> schools.contains(s.school().toLowerCase()))
                .map(s -> new SpellSummaryDTO(s.id(), s.name(), s.school(), s.enCost()))
                .collect(Collectors.toList());
    }

    private EnemyStateDTO toEnemyDTO(EnemyState e) {
        List<ActiveStatusDTO> statuses = e.getStatuses().stream()
                .map(s -> new ActiveStatusDTO(s.getType(), s.getDuration()))
                .collect(Collectors.toList());
        return new EnemyStateDTO(e.getId(), e.getName(), e.getType(), e.getHp(), e.getMaxHp(), statuses);
    }
}
