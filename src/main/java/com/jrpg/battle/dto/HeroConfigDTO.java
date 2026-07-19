package com.jrpg.battle.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record HeroConfigDTO(
        @NotBlank String classId,
        String augmentationType,
        String augmentationAdvantageId,
        @NotBlank String primaryWeaponId,
        String armorId,
        String accessoryId,
        String mageSpecializationId,
        Map<String, Integer> items
) {}
