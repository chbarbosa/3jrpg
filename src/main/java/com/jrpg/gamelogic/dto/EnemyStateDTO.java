package com.jrpg.gamelogic.dto;

import java.util.List;

public record EnemyStateDTO(
    String id,
    String name,
    String type,
    int hp,
    int maxHp,
    int en,
    List<String> statuses
) {}
