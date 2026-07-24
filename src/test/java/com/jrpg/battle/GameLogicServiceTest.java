package com.jrpg.battle;

import com.jrpg.battle.state.BattleState;
import com.jrpg.battle.state.EnemyState;
import com.jrpg.battle.state.HeroState;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
