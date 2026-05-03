package com.jrpg.gamedata;

import java.util.List;

/**
 * Pure calculation rules — no data, no Spring dependency.
 * All game data lookups go through GameDataService.
 */
public final class GameData {

    private GameData() {}

    public static final int MONSTER_CAP_START     = 20;
    public static final int MONSTER_CAP_INCREMENT = 5;
    public static final int CAP_FIGHTS_PER_TIER   = 3;
    public static final int STARTING_GROUP_SIZE   = 2;
    public static final int MAX_GROUP_SIZE        = 6;

    public static int monsterCap(int fightNumber) {
        return MONSTER_CAP_START + ((fightNumber - 1) / CAP_FIGHTS_PER_TIER) * MONSTER_CAP_INCREMENT;
    }

    public static int groupSize(int fightNumber) {
        int cycle = (fightNumber - 1) / 3;
        return Math.min(STARTING_GROUP_SIZE + cycle, MAX_GROUP_SIZE);
    }

    /** Cycle position: fight 1,4,7…=A  fight 2,5,8…=B  fight 3,6,9…=C */
    public static String cycleModifier(int fightNumber) {
        return switch ((fightNumber - 1) % 3) {
            case 0 -> "A";
            case 1 -> "B";
            default -> "C";
        };
    }

    public static List<String> lootQualityPool(int cap) {
        if (cap <= 25) return List.of("COMMON", "COMMON", "COMMON");
        if (cap <= 35) return List.of("COMMON", "COMMON", "MAGIC");
        if (cap <= 55) return List.of("COMMON", "MAGIC",  "RARE");
        return              List.of("MAGIC",  "MAGIC",  "RARE");
    }
}
