package com.jrpg.gamedata.model;

import java.util.List;

public record ClassData(
    String id,
    String name,
    String type,
    int str,
    int dex,
    int intel,
    int hp,
    int spd,
    int en,
    List<String> equippableWeapons,
    String equippableArmor,
    DamageBonus damageBonus
) {}
