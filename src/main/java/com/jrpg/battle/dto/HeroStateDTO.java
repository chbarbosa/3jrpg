package com.jrpg.battle.dto;

import java.util.List;

public record HeroStateDTO(
        String id,
        String heroName,
        String name,
        String className,
        int hp,
        int maxHp,
        int en,
        int maxEn,
        int spd,
        int str,
        int def,
        int mdef,
        List<ActiveStatusDTO> statuses,
        boolean isKnockedOut,
        List<SkillSummaryDTO> availableSkills,
        List<SpellSummaryDTO> availableSpells,
        List<ItemSummaryDTO> inventory,
        String secondaryWeaponId,
        boolean isPostponed,
        String equippedWeaponId,
        String equippedArmorId,
        String equippedLootWeaponUuid,
        String equippedLootSecondaryUuid,
        String equippedLootArmorUuid,
        String equippedLootAccessoryUuid
) {}
