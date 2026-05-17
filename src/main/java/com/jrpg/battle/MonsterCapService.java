package com.jrpg.battle;

import com.jrpg.battle.state.EnemyState;
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
        // Calculate enemy caps for this fight (always 3 enemies)
        List<Integer> enemyCaps = calculateEnemyCaps(fightNumber);
        
        List<EnemyState> group = new ArrayList<>();
        
        for (int i = 0; i < enemyCaps.size(); i++) {
            int cap = enemyCaps.get(i);
            
            // Get enemy pool for this specific cap
            List<EnemyData> pool = gameDataService.enemyPool(cap);
            if (pool.isEmpty()) {
                pool = List.of(gameDataService.findEnemy("goblin").orElseThrow());
            }
            
            // Select random enemy from this cap pool
            EnemyData data = pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
            
            EnemyState e = new EnemyState();
            e.setId(data.id() + "_" + fightNumber + "_" + i);
            e.setEnemyDataId(data.id());
            e.setName(data.name() + " " + (char) ('A' + i));
            e.setType(data.type());
            e.setAiTier(data.aiTier());
            e.setStr(data.str());
            e.setDex(data.dex());
            e.setIntel(data.intel());
            e.setSpd(data.spd());
            
            int maxHp = data.hp();
            int maxEn = data.intel() * 2;
            
            // No cycle modifiers applied anymore
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
        
        log.info("Generated {} enemies for fight {} with caps: {}", group.size(), fightNumber, enemyCaps);
        return group;
    }

    @Deprecated
    private static String cycleDescription(String cyclePosition) {
        return switch (cyclePosition) {
            case "A" -> "Enemies start weakened";
            case "C" -> "Enemies are empowered";
            default  -> "No modifier";
        };
    }
    private List<Integer> calculateEnemyCaps(int fightNumber) {
        List<Integer> caps = new ArrayList<>();
        
        if (fightNumber == 1) {
            // Fight 1: three cap 10 enemies
            caps.add(10);
            caps.add(10);
            caps.add(10);
        } else if (fightNumber == 2) {
            // Fight 2: two cap 10, one cap 15
            caps.add(10);
            caps.add(10);
            caps.add(15);
        } else {
            // Fight 3 onwards: sliding window pattern
            // Each fight increases all caps by 5 from the previous fight's pattern
            int startCap = 10 + ((fightNumber - 3) * 5);
            caps.add(startCap);
            caps.add(startCap + 5);
            caps.add(startCap + 10);
        }
        
        return caps;
    }
}
