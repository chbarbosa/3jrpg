package com.jrpg.battle.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EnemyStateDTO(
        String id,
        String name,
        String enemyType,
        Integer hp,
        Integer maxHp,
        Integer hpPercent,
        boolean defeated,
        List<String> elementalImmunity,
        List<String> weaknesses,
        List<ActiveStatusDTO> statuses
) {}
