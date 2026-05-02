package com.jrpg.gamelogic.dto;

import java.util.List;

public record HeroStateDTO(
    String id,
    String name,
    String className,
    int hp,
    int maxHp,
    int en,
    int maxEn,
    List<String> statuses,
    boolean isKnockedOut
) {}
