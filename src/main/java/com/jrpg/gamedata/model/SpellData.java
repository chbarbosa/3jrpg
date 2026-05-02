package com.jrpg.gamedata.model;

public record SpellData(
    String id,
    String name,
    String school,
    String effect,
    int enCost,
    String targetType,
    String statusEffect
) {}
