package com.jrpg.battle.state;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class EnemyState {
    private String id;           // e.g. "goblin_0"
    private String enemyDataId;  // key into game data
    private String name;
    private String type;         // humanoid / beast / mechanical / undead / elemental
    private String aiTier;       // low / average / high
    private int str;
    private int dex;
    private int intel;
    private int hp;
    private int maxHp;
    private int en;
    private int maxEn;
    private int spd;
    private List<String> elementalImmunity = new ArrayList<>();
    private boolean instantKillImmune;
    private List<ActiveStatus> statuses = new ArrayList<>();

    // Persistent battle debuffs applied by Hammer / Scythe skills
    private boolean destroyArmorDebuff; // +2-3 extra damage on every subsequent hit
    private boolean disarmedDebuff;     // deals half damage
    private boolean broken;             // always acts last in turn order
}
