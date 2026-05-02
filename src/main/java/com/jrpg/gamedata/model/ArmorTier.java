package com.jrpg.gamedata.model;

public record ArmorTier(
    String id,
    String name,
    int minStr,
    int reductionMin,
    int reductionMax
) {}
