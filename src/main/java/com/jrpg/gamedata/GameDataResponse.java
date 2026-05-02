package com.jrpg.gamedata;

import com.jrpg.gamedata.model.*;

import java.util.List;

public record GameDataResponse(
    List<ClassData> classes,
    List<WeaponType> weapons,
    List<ArmorTier> armorTiers,
    List<ArmorQuality> armorQualities,
    List<Modifier> modifiers,
    List<AugmentationType> augmentations,
    List<EnemyData> enemies,
    List<SpellData> spells,
    List<ItemData> items,
    List<StatusEffectData> statusEffects
) {}
