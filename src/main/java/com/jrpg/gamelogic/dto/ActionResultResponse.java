package com.jrpg.gamelogic.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActionResultResponse extends BattleStateResponse {

    private String actionDescription;

    public ActionResultResponse(BattleStateResponse base, String actionDescription) {
        super(base.getRunUuid(), base.getFightNumber(), base.getCycleModifier(), base.getEnemies(),
                base.getHeroes(), base.getTurnOrder(), base.getActiveActorId(),
                base.getCombatLog(), base.isFightOver(), base.isVictory());
        this.actionDescription = actionDescription;
    }
}
