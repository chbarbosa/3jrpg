package com.jrpg.battle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PrepActionRequest(
        @NotNull UUID runUuid,
        @NotBlank String heroId,
        @NotNull PrepActionType actionType,
        String itemId,
        String targetHeroId,
        String equipSlot,   // WEAPON_PRIMARY, WEAPON_SECONDARY, ARMOR, ACCESSORY
        String itemUuid     // UUID of loot item to equip (non-null triggers equip path)
) {}
