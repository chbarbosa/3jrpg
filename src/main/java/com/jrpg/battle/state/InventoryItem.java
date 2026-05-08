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
    private String itemType;   // CONSUMABLE, WEAPON, ARMOR, ACCESSORY
    private String name;
    private String quality;
    private List<String> modifiers;
    private String description;

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
}
