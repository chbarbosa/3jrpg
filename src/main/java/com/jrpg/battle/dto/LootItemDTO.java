package com.jrpg.battle.dto;

import java.util.List;

public record LootItemDTO(
        String name,
        String quality,
        String description,
        List<String> modifiers,
        String itemUuid,
        String itemType,       // "WEAPON" | "ARMOR" | "ACCESSORY" | "CONSUMABLE"
        String itemCategory,   // same value as itemType — explicit for frontend
        String weaponTypeId,   // WEAPON: weapon id (sword/axe/hammer/etc)
        String accessoryType,  // ACCESSORY: "ring" | "amulet" | "bracelet"
        String armorTierId,    // ARMOR: "light" | "medium" | "heavy" | "clothes" | "magicClothes"
        String itemId          // CONSUMABLE: item id matching items.js
) {}
