package com.jrpg.battle.state;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class InventoryItem {
    // Consumable fields (itemUuid is null for consumables)
    private String itemId;
    private int quantity;

    // Equipment loot fields (itemId is null for equipment loot)
    private String itemUuid;
    private String itemType;      // CONSUMABLE, WEAPON, ARMOR, ACCESSORY
    private String name;
    private String quality;
    private List<String> modifiers;
    private String description;

    // Weapon loot only: the base WeaponType id (e.g. "sword", "bow") for skill lookup
    private String weaponTypeId;
    // Special accessories: effect identifier (e.g. "rebirth") for ring trigger logic
    private String effectId;

    public static InventoryItem consumable(String itemId, int quantity) {
        InventoryItem i = new InventoryItem();
        i.itemId = itemId;
        i.quantity = quantity;
        i.itemType = "CONSUMABLE";
        return i;
    }

    public static InventoryItem loot(String itemUuid, String itemType, String name,
                                      String quality, List<String> modifiers, String description) {
        InventoryItem i = new InventoryItem();
        i.itemUuid = itemUuid;
        i.itemType = itemType;
        i.name = name;
        i.quality = quality;
        i.modifiers = modifiers;
        i.description = description;
        i.quantity = 1;
        return i;
    }

    public static InventoryItem weaponLoot(String itemUuid, String weaponTypeId, String name,
                                            String quality, List<String> modifiers, String description) {
        InventoryItem i = loot(itemUuid, "WEAPON", name, quality, modifiers, description);
        i.weaponTypeId = weaponTypeId;
        return i;
    }

    public static InventoryItem specialAccessoryLoot(String itemUuid, String effectId,
                                                       String name, String quality, String description) {
        InventoryItem i = loot(itemUuid, "ACCESSORY", name, quality, null, description);
        i.effectId = effectId;
        return i;
    }
}
