package com.jrpg.gamedata;

import com.jrpg.gamedata.model.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Internal static game data store. Not a Spring bean. Never serialized to JSON.
 * GameLogicService calls static methods here for all game calculations.
 */
public final class GameData {

    private GameData() {}

    // ── Raw data maps ──────────────────────────────────────────────────────────

    private static final Map<String, ClassData> CLASSES = new LinkedHashMap<>();
    private static final Map<String, EnemyData> ENEMIES = new LinkedHashMap<>();
    private static final Map<String, WeaponType> WEAPONS = new LinkedHashMap<>();
    private static final Map<String, SpellData>  SPELLS  = new LinkedHashMap<>();
    private static final Map<String, ItemData>   ITEMS   = new LinkedHashMap<>();

    // ── Difficulty rules ───────────────────────────────────────────────────────

    public static final int MONSTER_CAP_START     = 20;
    public static final int MONSTER_CAP_INCREMENT = 5;
    public static final int CAP_FIGHTS_PER_TIER   = 3;
    public static final int STARTING_GROUP_SIZE   = 2;
    public static final int MAX_GROUP_SIZE        = 6;

    // ── Static initializer ─────────────────────────────────────────────────────

    static {
        // ── Classes ───────────────────────────────────────────────────────────
        addC(new ClassData("warrior","Warrior","PHYSICAL",10,7,5,20,14,14,
                List.of("sword","axe","mace","greatsword"),"heavy",new DamageBonus(1,"humanoid")));
        addC(new ClassData("ranger","Ranger","PHYSICAL",8,9,5,16,18,18,
                List.of("sword","bow"),"medium",new DamageBonus(1,"beast")));
        addC(new ClassData("mage","Mage","MAGIC",6,6,10,12,12,20,
                List.of("staff","wand"),"light",null));
        addC(new ClassData("priest","Priest","MAGIC",7,7,8,14,14,16,
                List.of("mace","staff","wand"),"medium",null));

        // ── Skills ────────────────────────────────────────────────────────────
        SkillData stab        = sk("stab",       "Stab",          "Thrusting attack dealing STR−DEF damage",                       2, null,    0.0);
        SkillData cut         = sk("cut",        "Cut",           "Slashing attack dealing STR−DEF damage",                        2, null,    0.0);
        SkillData speedBreak  = sk("speedBreak", "Speed Break",   "Attack that reduces target SPD by 2 tiers",                     2, "slow",  0.80);
        SkillData dismember   = sk("dismember",  "Dismember",     "Cleaving attack; 20% instant kill vs humanoids",                2, "bleed", 0.90);
        SkillData headBash    = sk("headBash",   "Head Bash",     "Crushing blow that may stun the target",                        2, "stun",  0.60);
        SkillData limbStrike  = sk("limbStrike", "Limb Strike",   "Targets limbs, applying pain (slow)",                          2, "slow",  0.70);
        SkillData normalAtk   = sk("normalAttack","Normal Attack","Ranged strike dealing STR−DEF damage",                         0, null,    0.0);
        SkillData doubleShot  = sk("doubleShot", "Double Shot",   "Two ranged strikes at half damage each, no status",             2, null,    0.0);
        SkillData arcaneBolt  = sk("arcaneBolt", "Arcane Bolt",   "Magic bolt dealing INT−MDEF; auto-triggers on attack",          0, null,    0.0);
        SkillData elemShot    = sk("elementalShot","Elemental Shot","Elemental projectile dealing INT−MDEF; auto-triggers",        0, null,    0.0);
        SkillData cleave      = sk("cleave",     "Cleave",        "Wide swing hitting all enemies for STR−DEF (greatsword only)",  2, null,    0.0);
        SkillData heavyStrike = sk("heavyStrike","Heavy Strike",  "Powerful blow; +4 bonus damage (greatsword only)",             2, null,    0.0);

        // ── Weapons ───────────────────────────────────────────────────────────
        addW(new WeaponType("sword",      "Sword",      List.of("warrior","ranger"),   List.of(stab,cut),                   null,                                  false));
        addW(new WeaponType("axe",        "Axe",        List.of("warrior"),             List.of(speedBreak,dismember),       null,                                  false));
        addW(new WeaponType("mace",       "Mace",       List.of("warrior","priest"),    List.of(headBash,limbStrike),        null,                                  false));
        addW(new WeaponType("bow",        "Bow",        List.of("ranger"),              List.of(normalAtk,doubleShot),       null,                                  false));
        addW(new WeaponType("staff",      "Staff",      List.of("mage","priest"),       List.of(arcaneBolt),                 null,                                  false));
        addW(new WeaponType("wand",       "Wand",       List.of("mage","priest"),       List.of(elemShot),                   null,                                  false));
        addW(new WeaponType("greatsword", "Greatsword", List.of("warrior"),             List.of(stab,cut,cleave,heavyStrike),"Passive: −1 DEX to wielder",          true));

        // ── Spells ────────────────────────────────────────────────────────────
        // Fire
        addSp(new SpellData("ember",       "Ember",        "Fire",    "Inflicts burn on one target",                  2,"single","burn"));
        addSp(new SpellData("fireball",    "Fireball",     "Fire",    "Hurls a ball of fire at one target",           3,"single",null));
        addSp(new SpellData("inferno",     "Inferno",      "Fire",    "Engulfs one target in intense flames",         7,"single",null));
        addSp(new SpellData("flamestorm",  "Flamestorm",   "Fire",    "Erupts fire across all enemies",               6,"all",   null));
        // Ice
        addSp(new SpellData("frostbite",   "Frostbite",   "Ice",     "Chills one target, applying frozen",           2,"single","frozen"));
        addSp(new SpellData("iceShot",     "Ice Shot",    "Ice",     "Launches a shard of ice at one target",        3,"single",null));
        addSp(new SpellData("blizzard",    "Blizzard",    "Ice",     "Calls down a blizzard upon one target",        7,"single",null));
        addSp(new SpellData("icestorm",    "Icestorm",    "Ice",     "Blankets all enemies in freezing ice",         6,"all",   null));
        // Electric
        addSp(new SpellData("staticCharge","Static Charge","Electric","Jolts one target, may stun",                  2,"single","stun"));
        addSp(new SpellData("spark",       "Spark",       "Electric","Fires a bolt of electricity at one target",    3,"single",null));
        addSp(new SpellData("thunderbolt", "Thunderbolt", "Electric","Strikes one target with a mighty bolt",        5,"single",null));
        addSp(new SpellData("thunderstorm","Thunderstorm","Electric","Calls lightning down on all enemies",           6,"all",   null));
        // Light
        addSp(new SpellData("mend",        "Mend",        "Light",   "Restores a small amount of HP to one ally",   3,"ally",  null));
        addSp(new SpellData("heal",        "Heal",        "Light",   "Restores a moderate amount of HP to one ally",5,"ally",  null));
        addSp(new SpellData("cure",        "Cure",        "Light",   "Removes one status effect from an ally",      2,"ally",  null));
        addSp(new SpellData("holyBolt",    "Holy Bolt",   "Light",   "Holy bolt; bonus damage vs undead",           5,"single",null));
        addSp(new SpellData("revive",      "Revive",      "Light",   "Revives a fallen ally at 1/4 max HP",         7,"ally",  null));
        // Arcane
        addSp(new SpellData("voidBolt",    "Void Bolt",   "Arcane",  "Fires a bolt of void energy at one target",   3,"single",null));
        addSp(new SpellData("drain",       "Drain",       "Arcane",  "Deals damage and absorbs HP from target",     5,"single",null));
        addSp(new SpellData("hex",         "Hex",         "Arcane",  "Curses one target with a random debuff",      2,"single","curse"));
        addSp(new SpellData("mindBreak",   "Mind Break",  "Arcane",  "Deals damage and silences one target",        5,"single","silence"));
        addSp(new SpellData("arcanestorm", "Arcane Storm","Arcane",  "Unleashes arcane energy across all enemies",  7,"all",   null));

        // ── Items ─────────────────────────────────────────────────────────────
        addI(new ItemData("healingPotion",      "Healing Potion",      "Restores 8 HP to one ally",                          List.of("battle","prep"),null));
        addI(new ItemData("energyPotion",       "Energy Potion",       "Restores 6 EN to one ally",                          List.of("battle","prep"),null));
        addI(new ItemData("reviveScroll",       "Revive Scroll",       "Revives one fallen ally at 1/4 max HP",              List.of("battle","prep"),null));
        addI(new ItemData("magicSicknessPotion","Magic Sickness Potion","Inflicts poison on one enemy",                      List.of("battle"),       null));
        addI(new ItemData("speedPotion",        "Speed Potion",        "Increases one ally SPD by 4 until end of battle",    List.of("battle","prep"),null));
        addI(new ItemData("regenLifePotion",    "Regen Life Potion",   "One ally regenerates 2 HP per turn for 3 turns",     List.of("battle","prep"),null));
        addI(new ItemData("regenEnergyPotion",  "Regen Energy Potion", "Restores 6 EN and 2 EN/turn for 2 turns to one ally",List.of("battle","prep"),null));

        // ── Enemies ───────────────────────────────────────────────────────────
        // Group A (sum 11-15)
        addE("goblin","Goblin","beast",4,4,3,8,8,"low",11,null,false);
        addE("ratman","Ratman","beast",3,5,3,6,10,"low",11,null,false);
        addE("zombie","Zombie","undead",6,2,3,12,4,"low",11,null,false);
        addE("cultist","Cultist","humanoid",4,4,4,8,8,"average",12,null,false);
        addE("spiderling","Spiderling","beast",4,6,3,8,12,"low",13,null,false);
        addE("witchling","Witchling","humanoid",3,4,7,6,8,"average",14,null,false);
        addE("dustElemental","Dust Elemental","elemental",5,5,5,10,10,"low",15,null,false);
        // Group B (sum 16-20)
        addE("bandit","Bandit","humanoid",6,5,5,12,10,"average",16,null,false);
        addE("skeleton","Skeleton","undead",7,4,5,14,8,"low",16,null,false);
        addE("ooze","Ooze","beast",5,5,6,10,10,"low",16,null,false);
        addE("orcScout","Orc Scout","humanoid",7,6,4,14,12,"average",17,null,false);
        addE("wolfBeast","Wolf Beast","beast",6,8,4,12,16,"low",18,null,false);
        addE("techScout","Tech Scout","mechanical",5,8,5,10,16,"average",18,null,false);
        addE("ghoul","Ghoul","undead",7,6,6,14,12,"average",19,null,false);
        addE("fireMage","Fire Mage","humanoid",4,6,10,8,12,"high",20,null,false);
        // Group C (sum 21-25)
        addE("armoredArmadillo","Armored Armadillo","beast",8,7,6,16,14,"low",21,null,false);
        addE("armedSkeleton","Armed Skeleton","undead",9,6,6,18,12,"average",21,null,false);
        addE("techSoldier","Tech Soldier","mechanical",8,8,5,16,16,"average",21,null,false);
        addE("orcWarrior","Orc Warrior","humanoid",10,6,6,20,12,"average",22,null,false);
        addE("caveSpider","Cave Spider","beast",7,10,6,14,20,"low",23,null,false);
        addE("iceMage","Ice Mage","humanoid",5,8,10,10,16,"high",23,null,false);
        addE("wraith","Wraith","undead",7,8,9,14,16,"average",24,null,false);
        addE("stormElemental","Storm Elemental","elemental",7,8,10,14,16,"high",25,null,false);
        // Group D (sum 26-30)
        addE("mercenary","Mercenary","humanoid",10,8,8,20,16,"average",26,null,false);
        addE("poisonSpider","Poison Spider","beast",8,11,7,16,22,"low",26,null,false);
        addE("gearGolem","Gear Golem","mechanical",12,7,7,24,14,"average",26,null,false);
        addE("orcShaman","Orc Shaman","humanoid",8,8,11,16,16,"high",27,null,false);
        addE("lich","Lich","undead",7,9,12,14,18,"high",28,null,false);
        addE("fireElemental","Fire Elemental","elemental",10,8,10,20,16,"average",28,List.of("fire"),false);
        addE("ironGuard","Iron Guard","humanoid",12,8,9,24,16,"average",29,null,false);
        addE("plagueWolf","Plague Wolf","beast",9,12,9,18,24,"low",30,null,false);
        // Group E (sum 31-35)
        addE("warMage","War Mage","humanoid",9,10,12,18,20,"high",31,null,false);
        addE("deathKnight","Death Knight","undead",13,9,9,26,18,"average",31,null,false);
        addE("steamGolem","Steam Golem","mechanical",14,9,9,28,18,"average",32,null,false);
        addE("trollBerserker","Troll Berserker","beast",14,9,10,28,18,"low",33,null,false);
        addE("arcaneWisp","Arcane Wisp","elemental",8,12,14,16,24,"high",34,null,false);
        addE("assassin","Assassin","humanoid",10,14,10,20,28,"average",34,null,false);
        addE("voidShadow","Void Shadow","undead",10,12,13,20,24,"high",35,null,false);
        // Group F (sum 36-40)
        addE("orcChieftain","Orc Chieftain","humanoid",14,11,11,28,22,"high",36,null,false);
        addE("razorFang","Razor Fang","beast",12,14,11,24,28,"low",37,null,false);
        addE("combatDrone","Combat Drone","mechanical",13,13,12,26,26,"average",38,null,false);
        addE("banshee","Banshee","undead",10,14,14,20,28,"high",38,null,false);
        addE("lavaElemental","Lava Elemental","elemental",14,10,15,28,20,"high",39,List.of("fire"),false);
        addE("battlemage","Battlemage","humanoid",12,13,14,24,26,"high",39,null,false);
        addE("necromancer","Necromancer","humanoid",10,14,16,20,28,"high",40,null,false);
        // Group G (sum 41-45)
        addE("dragonKin","Dragon Kin","beast",16,12,13,32,24,"average",41,null,false);
        addE("voidKnight","Void Knight","undead",15,12,15,30,24,"high",42,null,false);
        addE("warAutomaton","War Automaton","mechanical",15,14,13,30,28,"average",42,null,false);
        addE("thunderBird","Thunder Bird","beast",13,16,14,26,32,"low",43,List.of("electric"),false);
        addE("archMage","Arch Mage","humanoid",11,14,19,22,28,"high",44,null,false);
        addE("specterLord","Specter Lord","undead",13,15,16,26,30,"high",44,null,false);
        addE("voidElemental","Void Elemental","elemental",13,15,17,26,30,"high",45,null,false);
        // Group H (sum 46-50)
        addE("eliteGuard","Elite Guard","humanoid",17,15,14,34,30,"high",46,null,false);
        addE("chimera","Chimera","beast",17,15,15,34,30,"low",47,null,false);
        addE("siegeGolem","Siege Golem","mechanical",20,13,14,40,26,"average",47,null,true);
        addE("dracolich","Dracolich","undead",16,15,17,32,30,"high",48,List.of("ice"),false);
        addE("stormColossus","Storm Colossus","elemental",15,17,17,30,34,"high",49,List.of("electric"),false);
        addE("shadowEmperor","Shadow Emperor","humanoid",16,16,18,32,32,"high",50,null,false);
        addE("abyssalBeast","Abyssal Beast","beast",18,16,16,36,32,"low",50,null,false);
        // Group I (sum 51-60)
        addE("godWarrior","God Warrior","humanoid",20,17,16,40,34,"high",53,null,false);
        addE("voidDragon","Void Dragon","beast",22,16,17,44,32,"high",55,List.of("arcane"),false);
        addE("mechDreadnought","Mech Dreadnought","mechanical",20,18,18,40,36,"high",56,null,true);
        addE("eternalLich","Eternal Lich","undead",17,18,22,34,36,"high",57,null,true);
        addE("primordialElemental","Primordial Elemental","elemental",18,19,22,36,38,"high",59,List.of("fire","ice","electric"),false);
        addE("chaosLord","Chaos Lord","humanoid",20,20,20,40,40,"high",60,List.of("arcane"),true);
    }

    // ── Helpers for static initializer ────────────────────────────────────────

    private static void addC(ClassData c)  { CLASSES.put(c.id(), c); }
    private static void addW(WeaponType w) { WEAPONS.put(w.id(), w); }
    private static void addSp(SpellData s) { SPELLS.put(s.id(), s); }
    private static void addI(ItemData i)   { ITEMS.put(i.id(), i); }

    private static SkillData sk(String id, String name, String effect, int en, String status, double chance) {
        return new SkillData(id, name, effect, en, status, chance);
    }

    private static void addE(String id, String name, String type,
                              int str, int dex, int intel, int hp, int spd,
                              String aiTier, int sum,
                              List<String> immunities, boolean ikImmune) {
        ENEMIES.put(id, new EnemyData(id, name, type, str, dex, intel, hp, spd,
                aiTier, sum, immunities, ikImmune));
    }

    // ── Public lookup API ─────────────────────────────────────────────────────

    public static Optional<ClassData> findClass(String id) {
        return Optional.ofNullable(CLASSES.get(id));
    }

    public static Optional<EnemyData> findEnemy(String id) {
        return Optional.ofNullable(ENEMIES.get(id));
    }

    public static Optional<WeaponType> findWeapon(String id) {
        return Optional.ofNullable(WEAPONS.get(id));
    }

    public static Optional<SpellData> findSpell(String id) {
        return Optional.ofNullable(SPELLS.get(id));
    }

    public static Optional<ItemData> findItem(String id) {
        return Optional.ofNullable(ITEMS.get(id));
    }

    public static Optional<SkillData> findSkill(String weaponId, String skillId) {
        return findWeapon(weaponId)
                .flatMap(w -> w.skills().stream().filter(s -> s.id().equals(skillId)).findFirst());
    }

    /** Active enemy pool for a given monster cap: attributeSum in (cap-10, cap]. */
    public static List<EnemyData> enemyPool(int cap) {
        int lo = cap - 10;
        List<EnemyData> pool = ENEMIES.values().stream()
                .filter(e -> e.attributeSum() > lo && e.attributeSum() <= cap)
                .collect(Collectors.toList());
        if (pool.size() < 2) {
            // Fallback: include tier below
            int loFallback = lo - 10;
            pool = ENEMIES.values().stream()
                    .filter(e -> e.attributeSum() > loFallback && e.attributeSum() <= cap)
                    .collect(Collectors.toList());
        }
        return pool;
    }

    /** Monster cap for the given fight number (1-indexed). */
    public static int monsterCap(int fightNumber) {
        return MONSTER_CAP_START + ((fightNumber - 1) / CAP_FIGHTS_PER_TIER) * MONSTER_CAP_INCREMENT;
    }

    /** Group size for the given fight number (starts at 2, +1 per full cycle, max 6). */
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

    /** Loot quality pool for the current monster cap. */
    public static List<String> lootQualityPool(int cap) {
        if (cap <= 25)       return List.of("COMMON","COMMON","COMMON");
        if (cap <= 35)       return List.of("COMMON","COMMON","MAGIC");
        if (cap <= 55)       return List.of("COMMON","MAGIC","RARE");
        return               List.of("MAGIC","MAGIC","RARE");
    }

    public static List<String> allItemIds() {
        return List.copyOf(ITEMS.keySet());
    }

    public static Set<String> allClassIds() {
        return Collections.unmodifiableSet(CLASSES.keySet());
    }
}
