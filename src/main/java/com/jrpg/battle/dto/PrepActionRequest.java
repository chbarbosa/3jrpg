package com.jrpg.battle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PrepActionRequest(
        @NotNull UUID runUuid,
        @NotBlank String heroId,
        @NotNull PrepActionType actionType,
        String itemId,
        String targetHeroId, // target hero for REVIVE, USE_ITEM targeting, or TRANSFER_GEAR recipient
        String equipSlot,   // WEAPON_PRIMARY, ARMOR, ACCESSORY
        String itemUuid,    // UUID of loot item to equip (non-null triggers equip path)
        String spellId      // spell to cast (CAST_SPELL action only)
) {}
