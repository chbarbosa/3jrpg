package com.jrpg.gamedata.model;

public record SkillData(
    String id,
    String name,
    String effect,
    int enCost,
    String statusEffect,
    double statusChance
) {}
