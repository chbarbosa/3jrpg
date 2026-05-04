package com.jrpg.battle.dto;

import jakarta.validation.constraints.NotBlank;

public record HeroConfigDTO(
        @NotBlank String classId,
        String augmentationType,
        String augmentationAdvantageId,
        @NotBlank String primaryWeaponId,
        String secondaryWeaponId,
        String armorId,
        String accessoryId,
        String mageSpecializationId
) {}
