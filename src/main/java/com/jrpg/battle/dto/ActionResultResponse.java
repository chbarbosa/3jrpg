package com.jrpg.battle.dto;

import lombok.Getter;

@Getter
public class ActionResultResponse extends BattleStateResponse {
    private final String actionSummary;

    public ActionResultResponse(BattleStateResponse base, String actionSummary) {
        super(
                base.getRunUuid(), base.getFightNumber(),
                base.getCyclePosition(), base.getCycleModifier(),
                base.getEnemies(), base.getHeroes(),
                base.getTurnOrder(), base.getActiveActorId(),
                base.getCombatLog(), base.isFightOver(), base.isVictory()
        );
        this.actionSummary = actionSummary;
    }
}
