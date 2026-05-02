package com.jrpg.gamelogic.state;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class HeroState {
    private String id;             // "hero_0", "hero_1", "hero_2"
    private String classId;
    private String augmentationId;
    private String advantageId;
    private String equippedWeaponId;
    private String equippedArmorId;
    private String elementalWeakness; // set for Enhanced augmentation
    // Base stats (class + augmentation bonus, before status effects)
    private int baseStr;
    private int baseDex;
    private int baseIntel;
    private int baseSpd;
    private int baseMaxHp;
    private int baseMaxEn;
    // Current stats (may differ from base due to status effects / weapon passives)
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
    // Extra armor DEF bonus from augmentation advantage (ironFrame ironDef)
    private int armorDefBonus;
}
