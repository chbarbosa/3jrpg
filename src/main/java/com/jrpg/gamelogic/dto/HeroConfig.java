package com.jrpg.gamelogic.dto;

public record HeroConfig(
    String classId,
    String augmentationId,
    String advantageId,
    Loadout loadout
) {}
