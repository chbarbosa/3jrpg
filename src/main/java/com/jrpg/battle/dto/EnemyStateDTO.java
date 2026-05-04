package com.jrpg.battle.dto;

import java.util.List;

public record EnemyStateDTO(
        String id,
        String name,
        String enemyType,
        int hp,
        int maxHp,
        List<ActiveStatusDTO> statuses
) {}
