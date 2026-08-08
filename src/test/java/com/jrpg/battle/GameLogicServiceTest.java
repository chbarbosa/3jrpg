package com.jrpg.battle;

import com.jrpg.battle.state.BattleState;
import com.jrpg.battle.state.EnemyState;
import com.jrpg.battle.state.HeroState;
import com.jrpg.battle.state.InventoryItem;
import com.jrpg.battle.dto.ActionRequest;
import com.jrpg.battle.dto.ActionType;
import com.jrpg.battle.dto.HeroConfigDTO;
import com.jrpg.gamedata.GameDataService;
import com.jrpg.gamedata.model.ClassData;
import com.jrpg.gamedata.model.ItemData;
import com.jrpg.gamedata.model.SkillData;
import com.jrpg.gamedata.model.SpellData;
import com.jrpg.gamedata.model.WeaponType;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GameLogicServiceTest {

    private final GameLogicService gameLogicService = new GameLogicService(null);

    @Test
    void buildTurnOrder_placesThievesBeforeFasterActors() {
        BattleState state = new BattleState();
        HeroState warrior = hero("hero_0", "warrior", 14);
        HeroState thief = hero("hero_1", "thief", 10);
        EnemyState enemy = enemy("enemy_0", 30);

        state.setHeroes(List.of(warrior, thief));
        state.setEnemies(List.of(enemy));

        assertEquals(List.of("hero_1", "enemy_0", "hero_0"), gameLogicService.buildTurnOrder(state));
    }

    @Test
    void tickHeroStatuses_appliesNaturalHpAndEnRegenEachRound() {
        BattleState state = new BattleState();
        HeroState hero = hero("hero_0", "warrior", 14);
        hero.setHp(7);
        hero.setMaxHp(10);
        hero.setEn(4);
        hero.setMaxEn(8);
        state.setHeroes(List.of(hero));

        gameLogicService.tickHeroStatuses(state);

        assertEquals(8, hero.getHp());
        assertEquals(5, hero.getEn());
    }

    @Test
    void tickHeroStatuses_stacksPotionRegenWithNaturalRegen() {
        BattleState state = new BattleState();
        HeroState hero = hero("hero_0", "warrior", 14);
        hero.setHp(5);
        hero.setMaxHp(12);
        hero.setEn(3);
        hero.setMaxEn(10);
        hero.setRegenHpPerTurn(2);
        hero.setRegenEnPerTurn(1);
        state.setHeroes(List.of(hero));

        gameLogicService.tickHeroStatuses(state);

        assertEquals(8, hero.getHp());
        assertEquals(5, hero.getEn());
    }

    @Test
    void buildHeroStates_appliesUpdatedStartingAccessoryBonuses() {
        GameDataService gameDataService = mock(GameDataService.class);
        when(gameDataService.findClass("warrior")).thenReturn(Optional.of(new ClassData(
                "warrior", "Warrior", "PHYSICAL",
                12, 8, 5, 30, 12, 14,
                List.of("sword"), "heavy", null)));
        GameLogicService service = new GameLogicService(gameDataService);

        HeroState hero = service.buildHeroStates(List.of(new HeroConfigDTO(
                "warrior", "natural", null, "sword", "heavy", "commonHpEn", null, Map.of()))).get(0);

        assertEquals(32, hero.getMaxHp());
        assertEquals(32, hero.getHp());
        assertEquals(16, hero.getMaxEn());
        assertEquals(16, hero.getEn());
    }

    @Test
    void validateTeam_allowsUpToThreeStarterItemsPerHero() {
        GameLogicService service = new GameLogicService(gameDataForStarterItemValidation());

        service.validateTeam(List.of(
                validHero(Map.of("healingPotion", 2, "energyPotion", 1)),
                validHero(Map.of()),
                validHero(null)));
    }

    @Test
    void validateTeam_rejectsMoreThanThreeStarterItemsPerHero() {
        GameLogicService service = new GameLogicService(gameDataForStarterItemValidation());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.validateTeam(List.of(
                validHero(Map.of("healingPotion", 3, "energyPotion", 1)),
                validHero(Map.of()),
                validHero(null))));

        assertEquals("Each hero can start with at most 3 items", ex.getReason());
    }

    @Test
    void validateTeam_rejectsUnknownStarterItem() {
        GameLogicService service = new GameLogicService(gameDataForStarterItemValidation());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.validateTeam(List.of(
                validHero(Map.of("badPotion", 1)),
                validHero(Map.of()),
                validHero(null))));

        assertEquals("Unknown item: badPotion", ex.getReason());
    }

    @Test
    void resolveSkill_convertsBleedToLeakingForMechanicalEnemies() {
        GameLogicService service = new GameLogicService(gameDataForGuaranteedBleedSkill());
        BattleState state = stateForBleedSkillTarget("mechanical");

        service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.SKILL, "hero_0", "enemy_0", "stab", null, null));

        assertEquals(List.of("leaking"), state.getEnemies().get(0).getStatuses().stream()
                .map(s -> s.getType())
                .toList());
    }

    @Test
    void resolveSkill_doesNotApplyBleedToElementalEnemies() {
        GameLogicService service = new GameLogicService(gameDataForGuaranteedBleedSkill());
        BattleState state = stateForBleedSkillTarget("elemental");

        String result = service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.SKILL, "hero_0", "enemy_0", "stab", null, null));

        assertTrue(state.getEnemies().get(0).getStatuses().isEmpty());
        assertTrue(result.contains("immune to Bleed"));
    }

    @Test
    void resolveSkill_doesNotApplyBleedToUndeadEnemies() {
        GameLogicService service = new GameLogicService(gameDataForGuaranteedBleedSkill());
        BattleState state = stateForBleedSkillTarget("undead");

        String result = service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.SKILL, "hero_0", "enemy_0", "stab", null, null));

        assertTrue(state.getEnemies().get(0).getStatuses().isEmpty());
        assertTrue(result.contains("immune to Bleed"));
    }

    @Test
    void resolveSkill_appliesBleedToOrganicEnemies() {
        GameLogicService service = new GameLogicService(gameDataForGuaranteedBleedSkill());
        BattleState state = stateForBleedSkillTarget("beast");

        service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.SKILL, "hero_0", "enemy_0", "stab", null, null));

        assertEquals(List.of("bleed"), state.getEnemies().get(0).getStatuses().stream()
                .map(s -> s.getType())
                .toList());
    }

    @Test
    void resolveSkill_allowsGreatswordHeavyStrikeAgainstUndead() {
        GameLogicService service = new GameLogicService(gameDataForGreatswordHeavyStrike());
        BattleState state = new BattleState();
        HeroState hero = hero("hero_0", "warrior", 20);
        hero.setName("Warrior");
        hero.setEquippedWeaponId("greatsword");
        hero.setStr(12);
        hero.setEn(10);
        EnemyState enemy = enemy("dracolich_10_1", 10);
        enemy.setName("Dracolich");
        enemy.setType("undead");
        enemy.setHp(30);
        enemy.setMaxHp(30);
        state.setHeroes(List.of(hero));
        state.setEnemies(List.of(enemy));

        String result = service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.SKILL, "hero_0", "dracolich_10_1", "heavyStrike", null, null));

        assertTrue(result.contains("Heavy Strike"));
        assertEquals(14, enemy.getHp());
        assertEquals(8, hero.getEn());
    }

    @Test
    void resolveAttack_staffAndWandMagicBoltDamageVariesFromTwoBelowToOneAboveInt() {
        for (String weaponId : List.of("staff", "wand")) {
            GameLogicService service = new GameLogicService(gameDataForMagicBoltWeapon(weaponId));
            BattleState state = new BattleState();
            HeroState hero = hero("hero_0", "mage", 20);
            hero.setName("Mage");
            hero.setEquippedWeaponId(weaponId);
            hero.setIntel(10);
            EnemyState enemy = enemy("enemy_0", 10);
            enemy.setName("Target");
            enemy.setType("beast");
            enemy.setHp(30);
            enemy.setMaxHp(30);
            state.setHeroes(List.of(hero));
            state.setEnemies(List.of(enemy));

            service.resolveAction(state, new ActionRequest(
                    UUID.randomUUID(), ActionType.ATTACK, "hero_0", "enemy_0", null, null, null));

            int damage = 30 - enemy.getHp();
            assertTrue(damage >= 8 && damage <= 11);
        }
    }

    @Test
    void consumeItem_healingPotionRestoresFullHp() {
        BattleState state = new BattleState();
        HeroState hero = hero("hero_0", "warrior", 14);
        hero.setHp(3);
        hero.setMaxHp(30);
        hero.getInventory().add(InventoryItem.consumable("healingPotion", 1));
        state.setHeroes(List.of(hero));

        gameLogicService.consumeItem(state, hero, "hero_0", "healingPotion");

        assertEquals(30, hero.getHp());
        assertTrue(hero.getInventory().isEmpty());
    }

    @Test
    void consumeItem_energyPotionRestoresFullEn() {
        BattleState state = new BattleState();
        HeroState hero = hero("hero_0", "warrior", 14);
        hero.setEn(2);
        hero.setMaxEn(20);
        hero.getInventory().add(InventoryItem.consumable("energyPotion", 1));
        state.setHeroes(List.of(hero));

        gameLogicService.consumeItem(state, hero, "hero_0", "energyPotion");

        assertEquals(20, hero.getEn());
        assertTrue(hero.getInventory().isEmpty());
    }

    @Test
    void resolveMagic_appliesExplicitSingleTargetSpellStatus() {
        GameLogicService service = new GameLogicService(gameDataForSpell(
                new SpellData("spark", "Spark", "Electric", "Zap", 3, "single", "stun")));
        BattleState state = stateForSpellCast("enemy_0");

        service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.MAGIC, "hero_0", "enemy_0", null, "spark", null));

        assertEquals(List.of("stun"), state.getEnemies().get(0).getStatuses().stream()
                .map(s -> s.getType())
                .toList());
    }

    @Test
    void resolveMagic_appliesExplicitAoeSpellStatusToAllDamagedEnemies() {
        GameLogicService service = new GameLogicService(gameDataForSpell(
                new SpellData("thunderstorm", "Thunderstorm", "Electric", "Storm", 6, "all", "stun")));
        BattleState state = stateForSpellCast(null);
        EnemyState second = enemy("enemy_1", 9);
        second.setName("Second");
        second.setType("beast");
        second.setHp(20);
        second.setMaxHp(20);
        state.getEnemies().add(second);

        service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.MAGIC, "hero_0", null, null, "thunderstorm", null));

        assertEquals(List.of("stun"), state.getEnemies().get(0).getStatuses().stream()
                .map(s -> s.getType())
                .toList());
        assertEquals(List.of("stun"), state.getEnemies().get(1).getStatuses().stream()
                .map(s -> s.getType())
                .toList());
    }

    @Test
    void resolveMagic_frozenStacksDexLossAndDefeatsEnemyAtZeroDex() {
        GameLogicService service = new GameLogicService(gameDataForSpell(
                new SpellData("iceShot", "Ice Shot", "Ice", "Freeze", 3, "single", "frozen")));
        BattleState state = stateForSpellCast("enemy_0");
        EnemyState enemy = state.getEnemies().get(0);
        enemy.setDex(6);
        enemy.setHp(100);
        enemy.setMaxHp(100);

        for (int cast = 0; cast < 3; cast++) {
            service.resolveAction(state, new ActionRequest(
                    UUID.randomUUID(), ActionType.MAGIC, "hero_0", "enemy_0", null, "iceShot", null));
        }

        assertEquals(0, enemy.getDex());
        assertEquals(0, enemy.getHp());
        assertTrue(enemy.getStatuses().isEmpty());
    }

    @Test
    void resolveMagic_stunIsNonStackingAndReducesOutgoingDamageByTwo() {
        GameLogicService service = new GameLogicService(gameDataForSpell(
                new SpellData("spark", "Spark", "Electric", "Stun", 3, "single", "stun")));
        BattleState state = stateForSpellCast("enemy_0");
        EnemyState enemy = state.getEnemies().get(0);
        HeroState hero = state.getHeroes().get(0);
        enemy.setHp(100);
        enemy.setMaxHp(100);
        enemy.setStr(10);
        enemy.setAiTier("low");
        hero.setHp(30);
        hero.setMaxHp(30);

        service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.MAGIC, "hero_0", "enemy_0", null, "spark", null));
        service.resolveAction(state, new ActionRequest(
                UUID.randomUUID(), ActionType.MAGIC, "hero_0", "enemy_0", null, "spark", null));

        assertEquals(1, enemy.getStatuses().stream().filter(s -> "stun".equals(s.getType())).count());

        state.setTurnOrder(List.of("enemy_0"));
        state.setCurrentTurnIndex(0);
        service.resolveOneEnemyTurn(state);

        assertEquals(22, hero.getHp());
    }

    @Test
    void equipLootItemFromInventory_allowsTwoRingSlotsToStackBonuses() {
        HeroState hero = hero("hero_0", "warrior", 14);
        hero.setStr(10);
        hero.getInventory().add(InventoryItem.accessoryLoot(
                "ring-1", "ring", "Strong Ring", "MAGIC", List.of("Strong"), "test"));
        hero.getInventory().add(InventoryItem.accessoryLoot(
                "ring-2", "ring", "Sharp Ring", "MAGIC", List.of("Sharp"), "test"));

        gameLogicService.equipLootItemFromInventory(hero, "ring-1", "RING_1");
        gameLogicService.equipLootItemFromInventory(hero, "ring-2", "RING_2");

        assertEquals("ring-1", hero.getEquippedLootRing1Uuid());
        assertEquals("ring-2", hero.getEquippedLootRing2Uuid());
        assertEquals(12, hero.getStr());
    }

    @Test
    void equipLootItemFromInventory_movesRingBetweenSlotsWithoutDuplicatingBonus() {
        HeroState hero = hero("hero_0", "warrior", 14);
        hero.setStr(10);
        hero.getInventory().add(InventoryItem.accessoryLoot(
                "ring-1", "ring", "Strong Ring", "MAGIC", List.of("Strong"), "test"));

        gameLogicService.equipLootItemFromInventory(hero, "ring-1", "RING_1");
        gameLogicService.equipLootItemFromInventory(hero, "ring-1", "RING_2");

        assertEquals(null, hero.getEquippedLootRing1Uuid());
        assertEquals("ring-1", hero.getEquippedLootRing2Uuid());
        assertEquals(11, hero.getStr());
    }

    @Test
    void equipLootItemFromInventory_enforcesClassArmorRestrictions() {
        HeroState mage = hero("hero_0", "mage", 14);
        mage.getInventory().add(InventoryItem.armorLoot(
                "heavy-1", "heavy", "Heavy Armor", "MAGIC", List.of(), "test"));

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> gameLogicService.equipLootItemFromInventory(mage, "heavy-1", "ARMOR"));
        assertEquals(null, mage.getEquippedLootArmorUuid());

        HeroState warrior = hero("hero_1", "warrior", 14);
        warrior.getInventory().add(InventoryItem.armorLoot(
                "heavy-2", "heavy", "Heavy Armor", "MAGIC", List.of(), "test"));
        gameLogicService.equipLootItemFromInventory(warrior, "heavy-2", "ARMOR");
        assertEquals("heavy-2", warrior.getEquippedLootArmorUuid());
    }

    @Test
    void canEquipArmor_matchesEveryClassRule() {
        assertTrue(GameLogicService.canEquipArmor("warrior", "heavy"));
        assertFalse(GameLogicService.canEquipArmor("ranger", "heavy"));
        assertFalse(GameLogicService.canEquipArmor("cleric", "heavy"));
        assertFalse(GameLogicService.canEquipArmor("thief", "medium"));
        assertFalse(GameLogicService.canEquipArmor("mage", "light"));
        assertTrue(GameLogicService.canEquipArmor("mage", "magicClothes"));
    }

    @Test
    void applyPriestHolyAura_damagesEveryUndeadByOneToThreeOnly() {
        BattleState state = new BattleState();
        HeroState priest = hero("hero_0", "cleric", 14);
        EnemyState undead = enemy("enemy_0", 10);
        undead.setName("Skeleton");
        undead.setType("undead");
        EnemyState beast = enemy("enemy_1", 9);
        beast.setName("Wolf");
        beast.setType("beast");
        state.setHeroes(List.of(priest));
        state.setEnemies(List.of(undead, beast));
        state.setTurnOrder(List.of("hero_0", "enemy_0", "enemy_1"));

        gameLogicService.applyPriestHolyAura(state, "hero_0");

        assertTrue(undead.getHp() >= 7 && undead.getHp() <= 9);
        assertEquals(10, beast.getHp());
        assertTrue(state.getCombatLog().get(0).contains("Holy Aura"));
    }

    @Test
    void applyPriestHolyAura_stacksForEachConsciousPriest() {
        BattleState state = new BattleState();
        HeroState first = hero("hero_0", "cleric", 14);
        HeroState second = hero("hero_1", "cleric", 13);
        HeroState knockedOut = hero("hero_2", "cleric", 12);
        knockedOut.setKnockedOut(true);
        EnemyState undead = enemy("enemy_0", 10);
        undead.setName("Ghoul");
        undead.setType("undead");
        state.setHeroes(List.of(first, second, knockedOut));
        state.setEnemies(List.of(undead));
        state.setTurnOrder(List.of("hero_0", "hero_1", "enemy_0"));

        boolean activeActorDefeated = gameLogicService.applyPriestHolyAura(state, "hero_0");

        assertTrue(undead.getHp() >= 4 && undead.getHp() <= 8);
        assertEquals(2, state.getCombatLog().size());
        assertFalse(activeActorDefeated);
    }

    @Test
    void applyPriestHolyAura_advancesPastUndeadKilledBeforeItsTurn() {
        BattleState state = new BattleState();
        HeroState priest = hero("hero_0", "cleric", 14);
        EnemyState undead = enemy("skeleton_1_0", 13);
        undead.setName("Skeleton");
        undead.setType("undead");
        undead.setHp(1);
        EnemyState beast = enemy("wolf_1_1", 12);
        beast.setName("Wolf");
        beast.setType("beast");
        state.setHeroes(List.of(priest));
        state.setEnemies(List.of(undead, beast));
        state.setTurnOrder(List.of("hero_0", "skeleton_1_0", "wolf_1_1"));
        state.setCurrentTurnIndex(1);

        boolean activeActorDefeated =
                gameLogicService.applyPriestHolyAura(state, "skeleton_1_0");

        assertTrue(activeActorDefeated);
        assertEquals("wolf_1_1", gameLogicService.findActiveActorId(state));
    }

    @Test
    void applyCyberEyeHackAura_damagesMechanicalEnemiesByTwoToFourOnly() {
        BattleState state = new BattleState();
        HeroState hacker = hero("hero_0", "ranger", 14);
        hacker.setAugmentationId("cyber");
        hacker.setAdvantageId("cyberEye");
        EnemyState machine = enemy("drone_1_0", 10);
        machine.setName("Drone");
        machine.setType("mechanical");
        EnemyState undead = enemy("skeleton_1_1", 9);
        undead.setName("Skeleton");
        undead.setType("undead");
        state.setHeroes(List.of(hacker));
        state.setEnemies(List.of(machine, undead));
        state.setTurnOrder(List.of("hero_0", "drone_1_0", "skeleton_1_1"));

        gameLogicService.applyCyberEyeHackAura(state, "hero_0");

        assertTrue(machine.getHp() >= 6 && machine.getHp() <= 8);
        assertEquals(10, undead.getHp());
        assertTrue(state.getCombatLog().get(0).contains("Hack Aura"));
    }

    @Test
    void applyCyberEyeHackAura_stacksAndIgnoresKnockedOutHackers() {
        BattleState state = new BattleState();
        HeroState first = hero("hero_0", "warrior", 14);
        first.setAugmentationId("cyber");
        first.setAdvantageId("cyberEye");
        HeroState second = hero("hero_1", "ranger", 13);
        second.setAugmentationId("cyber");
        second.setAdvantageId("cyberEye");
        HeroState knockedOut = hero("hero_2", "thief", 12);
        knockedOut.setAugmentationId("cyber");
        knockedOut.setAdvantageId("cyberEye");
        knockedOut.setKnockedOut(true);
        EnemyState machine = enemy("drone_1_0", 10);
        machine.setName("Drone");
        machine.setType("mechanical");
        state.setHeroes(List.of(first, second, knockedOut));
        state.setEnemies(List.of(machine));
        state.setTurnOrder(List.of("hero_0", "hero_1", "drone_1_0"));

        gameLogicService.applyCyberEyeHackAura(state, "hero_0");

        assertTrue(machine.getHp() >= 2 && machine.getHp() <= 6);
        assertEquals(2, state.getCombatLog().size());
    }

    private HeroState hero(String id, String classId, int spd) {
        HeroState hero = new HeroState();
        hero.setId(id);
        hero.setClassId(classId);
        hero.setSpd(spd);
        return hero;
    }

    private EnemyState enemy(String id, int spd) {
        EnemyState enemy = new EnemyState();
        enemy.setId(id);
        enemy.setSpd(spd);
        enemy.setHp(10);
        return enemy;
    }

    private GameDataService gameDataForStarterItemValidation() {
        GameDataService gameDataService = mock(GameDataService.class);
        ClassData warrior = new ClassData(
                "warrior", "Warrior", "PHYSICAL",
                12, 8, 5, 30, 12, 14,
                List.of("sword"), "heavy", null);
        WeaponType sword = new WeaponType("sword", "Sword", List.of("warrior"), List.of(), null, false);
        ItemData healingPotion = new ItemData(
                "healingPotion", "Healing Potion", "heal", List.of("battle", "prep"), null);
        ItemData energyPotion = new ItemData(
                "energyPotion", "Energy Potion", "energy", List.of("battle", "prep"), null);

        when(gameDataService.allClassIds()).thenReturn(Set.of("warrior"));
        when(gameDataService.findClass("warrior")).thenReturn(Optional.of(warrior));
        when(gameDataService.findWeapon("sword")).thenReturn(Optional.of(sword));
        when(gameDataService.findItem("healingPotion")).thenReturn(Optional.of(healingPotion));
        when(gameDataService.findItem("energyPotion")).thenReturn(Optional.of(energyPotion));
        when(gameDataService.findItem("badPotion")).thenReturn(Optional.empty());
        return gameDataService;
    }

    private HeroConfigDTO validHero(Map<String, Integer> items) {
        return new HeroConfigDTO("warrior", "natural", null, "sword", "heavy", null, null, items);
    }

    private GameDataService gameDataForGuaranteedBleedSkill() {
        GameDataService gameDataService = mock(GameDataService.class);
        SkillData stab = new SkillData("stab", "Stab", "Bleed", 2, "bleed", 1.0);
        when(gameDataService.findSkill("dagger", "stab")).thenReturn(Optional.of(stab));
        return gameDataService;
    }

    private GameDataService gameDataForGreatswordHeavyStrike() {
        GameDataService gameDataService = mock(GameDataService.class);
        SkillData heavyStrike = new SkillData("heavyStrike", "Heavy Strike", "Hit +4", 2, null, 0.0);
        when(gameDataService.findSkill("greatsword", "heavyStrike")).thenReturn(Optional.of(heavyStrike));
        return gameDataService;
    }

    private GameDataService gameDataForMagicBoltWeapon(String weaponId) {
        GameDataService gameDataService = mock(GameDataService.class);
        WeaponType weapon = new WeaponType(weaponId, weaponId, List.of("mage"), List.of(), null, false);
        when(gameDataService.findWeapon(weaponId)).thenReturn(Optional.of(weapon));
        return gameDataService;
    }

    private BattleState stateForBleedSkillTarget(String enemyType) {
        BattleState state = new BattleState();
        HeroState hero = hero("hero_0", "thief", 20);
        hero.setName("Thief");
        hero.setEquippedWeaponId("dagger");
        hero.setStr(10);
        hero.setEn(10);
        EnemyState enemy = enemy("enemy_0", 10);
        enemy.setName("Target");
        enemy.setType(enemyType);
        enemy.setHp(20);
        enemy.setMaxHp(20);
        state.setHeroes(List.of(hero));
        state.setEnemies(List.of(enemy));
        return state;
    }

    private GameDataService gameDataForSpell(SpellData spell) {
        GameDataService gameDataService = mock(GameDataService.class);
        when(gameDataService.findSpell(spell.id())).thenReturn(Optional.of(spell));
        return gameDataService;
    }

    private BattleState stateForSpellCast(String targetId) {
        BattleState state = new BattleState();
        HeroState hero = hero("hero_0", "mage", 20);
        hero.setName("Mage");
        hero.setIntel(10);
        hero.setEn(20);
        hero.setMaxEn(20);
        EnemyState enemy = enemy(targetId != null ? targetId : "enemy_0", 10);
        enemy.setName("Target");
        enemy.setType("beast");
        enemy.setHp(20);
        enemy.setMaxHp(20);
        enemy.setElementalImmunity(List.of());
        state.setHeroes(List.of(hero));
        state.setEnemies(new ArrayList<>(List.of(enemy)));
        return state;
    }
}
