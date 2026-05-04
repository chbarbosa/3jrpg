package com.jrpg.battle.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class BattleStateResponse {
    private final UUID runUuid;
    private final int fightNumber;
    private final String cyclePosition;   // "A", "B", or "C"
    private final String cycleModifier;   // human-readable description
    private final List<EnemyStateDTO> enemies;
    private final List<HeroStateDTO> heroes;
    private final List<String> turnOrder;
    private final String activeActorId;
    private final List<String> combatLog; // last 10 entries
    private final boolean fightOver;
    private final boolean victory;
}
