package com.jrpg.battle;

import com.jrpg.battle.state.EnemyState;
import com.jrpg.gamedata.GameData;
import com.jrpg.gamedata.GameDataService;
import com.jrpg.gamedata.model.EnemyData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@RequiredArgsConstructor
public class MonsterCapService {

    private final GameDataService gameDataService;

    public List<EnemyState> generateEnemyGroup(int fightNumber) {
        int cap = GameData.monsterCap(fightNumber);
        int size = GameData.groupSize(fightNumber);
        String cycle = GameData.cycleModifier(fightNumber);

        List<EnemyData> pool = gameDataService.enemyPool(cap);
        if (pool.isEmpty()) {
            pool = List.of(gameDataService.findEnemy("goblin").orElseThrow());
        }

        List<EnemyState> group = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            EnemyData data = pool.get(ThreadLocalRandom.current().nextInt(pool.size()));

            EnemyState e = new EnemyState();
            e.setId(data.id() + "_" + i);
            e.setEnemyDataId(data.id());
            e.setName(data.name() + (size > 1 ? " " + (char) ('A' + i) : ""));
            e.setType(data.type());
            e.setAiTier(data.aiTier());
            e.setStr(data.str());
            e.setDex(data.dex());
            e.setIntel(data.intel());
            e.setSpd(data.spd());

            int maxHp = data.hp();
            int maxEn = data.intel() * 2;

            if ("A".equals(cycle)) {
                if (ThreadLocalRandom.current().nextBoolean()) maxHp = Math.max(1, maxHp - 2);
                else maxEn = Math.max(0, maxEn - 2);
            } else if ("C".equals(cycle)) {
                int roll = ThreadLocalRandom.current().nextInt(3);
                if (roll == 0) maxHp += 2;
                else if (roll == 1) maxEn += 2;
                else { maxHp += 1; maxEn += 1; }
            }

            e.setMaxHp(maxHp);
            e.setHp(maxHp);
            e.setMaxEn(maxEn);
            e.setEn(maxEn);
            if (data.elementalImmunity() != null) {
                e.setElementalImmunity(new ArrayList<>(data.elementalImmunity()));
            }
            e.setInstantKillImmune(data.instantKillImmune());
            group.add(e);
        }
        log.info("Generated {} enemies for fight {} (cap={}, cycle={})", group.size(), fightNumber, cap, cycle);
        return group;
    }

    public static String cycleDescription(String cyclePosition) {
        return switch (cyclePosition) {
            case "A" -> "Enemies start weakened";
            case "C" -> "Enemies are empowered";
            default  -> "No modifier";
        };
    }
}
