package com.jrpg.battle.state;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class HeroState {
    private String id;               // "hero_0", "hero_1", "hero_2"
    private String name;             // random hero name assigned at run start
    private String classId;
    private String augmentationId;
    private String advantageId;
    private String equippedWeaponId;
    private String secondaryWeaponId;
    private String equippedArmorId;
    private String elementalWeakness; // set for Enhanced augmentation

    // Base stats (class + augmentation bonus applied once at run start)
    private int baseStr;
    private int baseDex;
    private int baseIntel;
    private int baseSpd;
    private int baseMaxHp;
    private int baseMaxEn;

    // Current stats (modified by status effects / weapon passives)
    private int str;
    private int dex;
    private int intel;
    private int spd;
    private int hp;
    private int maxHp;
    private int en;
    private int maxEn;

    private boolean isKnockedOut;
    private List<ActiveStatus> statuses = new ArrayList<>();
    private List<InventoryItem> inventory = new ArrayList<>();

    // Armor DEF bonus from ironFrame ironDef augmentation
    private int armorDefBonus;

    // Per-battle buff tracking (reset on nextFight)
    private int spdPotionBonus;
    private int bowSpdDebuff;   // cumulative -1 SPD per bow shot this battle
    private int regenHpPerTurn;
    private int regenEnPerTurn;

    // Set true when hero uses an item (deferred to end of turn order this round)
    private boolean postponed;

    // Starting accessory equipped at run start (not a loot UUID — tracked separately)
    private String equippedStartingAccessoryId;

    // Equipped loot item UUIDs — null means no loot equipped in that slot
    private String equippedLootWeaponUuid;
    private String equippedLootSecondaryUuid;
    private String equippedLootArmorUuid;
    private String equippedLootAccessoryUuid;
}
