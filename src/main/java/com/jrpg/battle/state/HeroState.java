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
    private int regenHpPerTurn;
    private int regenEnPerTurn;
}
