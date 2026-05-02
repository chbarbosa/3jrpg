package com.jrpg.gamedata.model;

import java.util.List;

public record EnemyData(
    String id,
    String name,
    String type,
    int str,
    int dex,
    int intel,
    int hp,
    int spd,
    String aiTier,
    int attributeSum,
    List<String> elementalImmunity,
    boolean instantKillImmune
) {}
