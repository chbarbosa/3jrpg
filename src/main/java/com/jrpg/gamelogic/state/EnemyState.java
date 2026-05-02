package com.jrpg.gamelogic.state;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class EnemyState {
    private String id;          // e.g. "goblin_0", "goblin_1"
    private String enemyDataId; // key into GameData
    private String name;
    private String type;        // humanoid/beast/mechanical/undead/elemental
    private String aiTier;      // low/average/high
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
}
