package com.jrpg.gamedata.model;

import java.util.List;

public record WeaponType(
    String id,
    String name,
    List<String> equippableBy,
    List<SkillData> skills,
    String passiveEffect,
    boolean bonusVsLarge
) {}
