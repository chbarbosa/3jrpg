package com.jrpg.battle;

import com.jrpg.battle.dto.LootItemDTO;
import com.jrpg.gamedata.GameData;
import com.jrpg.gamedata.GameDataService;
import com.jrpg.gamedata.model.ItemData;
import com.jrpg.gamedata.model.WeaponType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@RequiredArgsConstructor
public class LootService {

    // Modifiers allowed on weapons/accessories (exclude "Warded" — defense modifier)
    private static final String[] WEAPON_MODIFIERS =
            {"Strong", "Swift", "Wise", "Tough", "Quick", "Enduring", "Sharp"};

    // All modifiers including defense for armor
    private static final String[] ALL_MODIFIERS =
            {"Strong", "Swift", "Wise", "Tough", "Quick", "Enduring", "Sharp", "Warded"};

    private static final String[] ARMOR_TIER_IDS   = {"light", "medium", "heavy", "clothes", "magicClothes"};
    private static final String[] ARMOR_TIER_NAMES  = {"Light Armor", "Medium Armor", "Heavy Armor", "Clothes", "Magic Clothes"};
    private static final String[] ARMOR_TIER_DESCS  = {
            "Flexible protection with 1 DEF.",
            "Balanced protection with 1–2 DEF.",
            "Heavy protection with 2 DEF.",
            "No physical protection.",
            "No physical DEF; reduces magic damage by 1."
    };
    private static final String[] ACCESSORY_TYPES = {"Ring", "Amulet", "Bracelet"};

    private final GameDataService gameDataService;

    public LootItemDTO generateLootDrop(int monsterCap) {
        List<String> qualityPool = GameData.lootQualityPool(monsterCap);
        String quality = qualityPool.get(ThreadLocalRandom.current().nextInt(qualityPool.size()));
        String itemUuid = UUID.randomUUID().toString();

        // 25% each for WEAPON, ARMOR, ACCESSORY, CONSUMABLE
        int typeRoll = ThreadLocalRandom.current().nextInt(4);
        LootItemDTO loot = switch (typeRoll) {
            case 0 -> generateWeaponLoot(quality, itemUuid);
            case 1 -> generateArmorLoot(quality, itemUuid);
            case 2 -> generateAccessoryLoot(quality, itemUuid);
            default -> generateConsumableLoot(quality, itemUuid);
        };

        log.info("Loot generated: {} {} - {}", loot.quality(), loot.itemType(), loot.name());
        return loot;
    }

    private LootItemDTO generateWeaponLoot(String quality, String itemUuid) {
        List<WeaponType> weapons = gameDataService.allWeapons();
        WeaponType weapon = weapons.get(ThreadLocalRandom.current().nextInt(weapons.size()));
        List<String> modifiers = pickModifiers(quality, WEAPON_MODIFIERS);
        String prefix = modifiers.isEmpty() ? "" : modifiers.get(0) + " ";
        String name = prefix + weapon.name();
        String desc = "A " + quality.toLowerCase() + " " + weapon.name().toLowerCase()
                + (modifiers.isEmpty() ? "." : " enhanced with " + String.join(" and ", modifiers) + ".");
        return new LootItemDTO(name, quality, desc, List.copyOf(modifiers), itemUuid,
                "WEAPON", "WEAPON", weapon.id(), null, null, null);
    }

    private LootItemDTO generateArmorLoot(String quality, String itemUuid) {
        // Common armor has no modifiers and is no better than starting gear — minimum MAGIC
        if ("COMMON".equals(quality)) {
            quality = ThreadLocalRandom.current().nextDouble() < 0.65 ? "MAGIC" : "RARE";
        }
        int idx = ThreadLocalRandom.current().nextInt(ARMOR_TIER_IDS.length);
        String tierName = ARMOR_TIER_NAMES[idx];
        String tierDesc = ARMOR_TIER_DESCS[idx];
        List<String> modifiers = pickModifiers(quality, ALL_MODIFIERS);
        String prefix = modifiers.isEmpty() ? "" : modifiers.get(0) + " ";
        String name = prefix + tierName;
        String desc = tierDesc + (modifiers.isEmpty() ? "" : " Enhanced with " + String.join(" and ", modifiers) + ".");
        log.info("Armor loot generated: {} {} {}", quality, ARMOR_TIER_IDS[idx], name);
        return new LootItemDTO(name, quality, desc, List.copyOf(modifiers), itemUuid,
                "ARMOR", "ARMOR", null, null, ARMOR_TIER_IDS[idx], null);
    }

    private LootItemDTO generateAccessoryLoot(String quality, String itemUuid) {
        // Common accessories have no modifiers and no practical value — minimum MAGIC (70/30 split)
        if ("COMMON".equals(quality)) {
            quality = ThreadLocalRandom.current().nextDouble() < 0.70 ? "MAGIC" : "RARE";
        }
        // 5% chance for special Rebirth Ring (MAGIC quality)
        if (ThreadLocalRandom.current().nextDouble() < 0.05) {
            String desc = "A legendary ring that shatters to restore the wearer to full HP and EN upon defeat.";
            log.info("Accessory loot generated: MAGIC Magic Rebirth Ring (special)");
            return new LootItemDTO("Magic Rebirth Ring", "MAGIC", desc, List.of(), itemUuid,
                    "ACCESSORY", "ACCESSORY", null, "ring", null, null);
        }
        String type = ACCESSORY_TYPES[ThreadLocalRandom.current().nextInt(ACCESSORY_TYPES.length)];
        List<String> modifiers = pickModifiers(quality, WEAPON_MODIFIERS);
        String prefix = modifiers.isEmpty() ? "" : modifiers.get(0) + " ";
        String name = prefix + type;
        String desc = "A " + quality.toLowerCase() + " accessory"
                + (modifiers.isEmpty() ? "." : " enhanced with " + modifiers.get(0) + ".");
        log.info("Accessory loot generated: {} {}", quality, name);
        return new LootItemDTO(name, quality, desc, List.copyOf(modifiers), itemUuid,
                "ACCESSORY", "ACCESSORY", null, type.toLowerCase(), null, null);
    }

    private LootItemDTO generateConsumableLoot(String quality, String itemUuid) {
        List<String> allItems = gameDataService.allItemIds();
        String itemId = allItems.get(ThreadLocalRandom.current().nextInt(allItems.size()));
        ItemData item = gameDataService.findItem(itemId).orElseThrow();
        List<String> modifiers = pickModifiers(quality, ALL_MODIFIERS);
        String prefix = modifiers.isEmpty() ? "" : modifiers.get(0) + " ";
        return new LootItemDTO(prefix + item.name(), quality, item.effect(), List.copyOf(modifiers), itemUuid,
                "CONSUMABLE", "CONSUMABLE", null, null, null, itemId);
    }

    private List<String> pickModifiers(String quality, String[] pool) {
        int count = switch (quality) {
            case "MAGIC" -> 1;
            case "RARE"  -> 2;
            default      -> 0;
        };
        List<String> result = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            result.add(pool[ThreadLocalRandom.current().nextInt(pool.length)]);
        }
        return result;
    }
}
