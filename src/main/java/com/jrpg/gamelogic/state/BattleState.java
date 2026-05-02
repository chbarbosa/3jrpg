package com.jrpg.gamelogic.state;

import com.jrpg.gamelogic.dto.LootItemDTO;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class BattleState {
    private List<HeroState> heroes = new ArrayList<>();
    private List<EnemyState> enemies = new ArrayList<>();
    private List<String> turnOrder = new ArrayList<>();
    private int currentTurnIndex;
    private int fightNumber;
    private String cycleModifier;   // "A", "B", "C"
    private boolean fightOver;
    private boolean victory;
    private List<String> combatLog = new ArrayList<>();
    private int enemyGroupSize;
    // Prep phase tracking
    private boolean prepPhase;
    private Map<String, Boolean> heroPrepTaken = new HashMap<>(); // heroId → used prep action
    private LootItemDTO pendingLoot;
}
