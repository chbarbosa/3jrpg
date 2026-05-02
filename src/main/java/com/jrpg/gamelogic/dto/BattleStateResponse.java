package com.jrpg.gamelogic.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BattleStateResponse {
    private UUID runUuid;
    private int fightNumber;
    private String cycleModifier;
    private List<EnemyStateDTO> enemies;
    private List<HeroStateDTO> heroes;
    private List<String> turnOrder;
    private String activeActorId;
    private List<String> combatLog;
    private boolean fightOver;
    private boolean victory;
}
