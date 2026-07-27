package com.jrpg.battle;

import com.jrpg.battle.state.BattleState;
import com.jrpg.battle.state.EnemyState;
import com.jrpg.battle.state.HeroState;
import com.jrpg.battle.dto.HeroConfigDTO;
import com.jrpg.gamedata.GameDataService;
import com.jrpg.gamedata.model.ClassData;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
}
