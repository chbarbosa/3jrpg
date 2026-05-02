package com.jrpg.gamedata;

import com.jrpg.gamedata.model.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class GameDataService {

    // ── Skills (reused across weapon definitions) ──────────────────────────────

    private static final SkillData STAB = new SkillData(
            "stab", "Stab", "Thrusting attack dealing STR−DEF damage", 2, null, 0.0);
    private static final SkillData CUT = new SkillData(
            "cut", "Cut", "Slashing attack dealing STR−DEF damage", 2, null, 0.0);
    private static final SkillData SPEED_BREAK = new SkillData(
            "speedBreak", "Speed Break", "Attack that reduces target SPD by 2", 2, "slow", 0.8);
    private static final SkillData DISMEMBER = new SkillData(
            "dismember", "Dismember", "Cleaving attack that causes bleeding", 2, "bleed", 0.9);
    private static final SkillData HEAD_BASH = new SkillData(
            "headBash", "Head Bash", "Crushing blow that may stun the target", 2, "stun", 0.6);
    private static final SkillData LIMB_STRIKE = new SkillData(
            "limbStrike", "Limb Strike", "Strike targeting limbs, reducing target DEX by 1", 2, "slow", 0.7);
    private static final SkillData NORMAL_ATTACK = new SkillData(
            "normalAttack", "Normal Attack", "Ranged strike dealing STR−DEF damage", 0, null, 0.0);
    private static final SkillData DOUBLE_SHOT = new SkillData(
            "doubleShot", "Double Shot", "Two rapid ranged strikes, each dealing STR−DEF damage", 2, null, 0.0);
    private static final SkillData ARCANE_BOLT = new SkillData(
            "arcaneBolt", "Arcane Bolt", "Channeled magic bolt dealing INT−MDEF damage; auto-triggers on attack", 0, null, 0.0);
    private static final SkillData ELEMENTAL_SHOT = new SkillData(
            "elementalShot", "Elemental Shot", "Elemental projectile dealing INT−MDEF damage; auto-triggers on attack", 0, null, 0.0);

    // ── Weapons ────────────────────────────────────────────────────────────────

    private static final List<WeaponType> WEAPONS = List.of(
            new WeaponType("sword", "Sword",
                    List.of("warrior", "ranger"),
                    List.of(STAB, CUT),
                    null, false),
            new WeaponType("axe", "Axe",
                    List.of("warrior"),
                    List.of(SPEED_BREAK, DISMEMBER),
                    null, false),
            new WeaponType("mace", "Mace",
                    List.of("warrior", "priest"),
                    List.of(HEAD_BASH, LIMB_STRIKE),
                    null, false),
            new WeaponType("bow", "Bow",
                    List.of("ranger"),
                    List.of(NORMAL_ATTACK, DOUBLE_SHOT),
                    null, false),
            new WeaponType("staff", "Staff",
                    List.of("mage", "priest"),
                    List.of(ARCANE_BOLT),
                    null, false),
            new WeaponType("wand", "Wand",
                    List.of("mage", "priest"),
                    List.of(ELEMENTAL_SHOT),
                    null, false),
            new WeaponType("greatsword", "Greatsword",
                    List.of("warrior"),
                    List.of(STAB, CUT),
                    "Passive: −1 DEX to wielder", true)
    );

    // ── Armor ──────────────────────────────────────────────────────────────────

    private static final List<ArmorTier> ARMOR_TIERS = List.of(
            new ArmorTier("clothes",      "Clothes",      0, 0, 0),
            new ArmorTier("magicClothes", "Magic Clothes",0, 0, 0),
            new ArmorTier("light",        "Light Armor",  0, 1, 1),
            new ArmorTier("medium",       "Medium Armor", 5, 1, 2),
            new ArmorTier("heavy",        "Heavy Armor",  8, 2, 2)
    );

    private static final List<ArmorQuality> ARMOR_QUALITIES = List.of(
            new ArmorQuality("plain", "Plain", 0),
            new ArmorQuality("magic", "Magic", 1),
            new ArmorQuality("rare",  "Rare",  2)
    );

    // ── Modifiers ──────────────────────────────────────────────────────────────

    private static final List<Modifier> MODIFIERS = List.of(
            new Modifier("strong",   "Strong",   "STR", 2, List.of("weapon", "armor")),
            new Modifier("swift",    "Swift",    "DEX", 2, List.of("weapon", "armor")),
            new Modifier("wise",     "Wise",     "INT", 2, List.of("weapon", "armor")),
            new Modifier("tough",    "Tough",    "HP",  4, List.of("armor")),
            new Modifier("quick",    "Quick",    "SPD", 2, List.of("weapon", "armor")),
            new Modifier("enduring", "Enduring", "EN",  2, List.of("armor")),
            new Modifier("sharp",    "Sharp",    "DMG", 1, List.of("weapon")),
            new Modifier("warded",   "Warded",   "DEF", 1, List.of("armor"))
    );

    // ── Augmentations ──────────────────────────────────────────────────────────

    private static final List<AugmentationType> AUGMENTATIONS = List.of(
            new AugmentationType("powerCore", "Power Core",
                    List.of("warrior", "ranger"),
                    List.of(
                            new AugmentationAdvantage("powerCoreDmg",  "Enhanced Strength", "Increases STR by 2"),
                            new AugmentationAdvantage("powerCoreHp",   "Reinforced Frame",  "Increases HP by 4")
                    ),
                    "Reduced DEX by 1"),
            new AugmentationType("swiftMechanism", "Swift Mechanism",
                    List.of("ranger", "mage"),
                    List.of(
                            new AugmentationAdvantage("swiftSpd",  "Accelerated Movement", "Increases SPD by 4"),
                            new AugmentationAdvantage("swiftDex",  "Precision Calibration","Increases DEX by 2")
                    ),
                    "Reduced HP by 2"),
            new AugmentationType("magicCrystal", "Magic Crystal",
                    List.of("mage", "priest"),
                    List.of(
                            new AugmentationAdvantage("crystalInt", "Arcane Amplification","Increases INT by 2"),
                            new AugmentationAdvantage("crystalEn",  "Mana Reservoir",      "Increases EN by 4")
                    ),
                    "Reduced STR by 1"),
            new AugmentationType("ironFrame", "Iron Frame",
                    List.of("warrior", "priest"),
                    List.of(
                            new AugmentationAdvantage("ironHp",  "Fortified Hull",    "Increases HP by 6"),
                            new AugmentationAdvantage("ironDef", "Damage Absorption", "Increases armor reduction by 1")
                    ),
                    "Reduced SPD by 2")
    );

    // ── Classes ────────────────────────────────────────────────────────────────

    private static final List<ClassData> CLASSES = List.of(
            new ClassData("warrior", "Warrior", "PHYSICAL",
                    10, 7, 5, 20, 14, 14,
                    List.of("sword", "axe", "mace", "greatsword"),
                    "heavy",
                    new DamageBonus(1, "humanoid")),
            new ClassData("ranger", "Ranger", "PHYSICAL",
                    8, 9, 5, 16, 18, 18,
                    List.of("sword", "bow"),
                    "medium",
                    new DamageBonus(1, "beast")),
            new ClassData("mage", "Mage", "MAGIC",
                    6, 6, 10, 12, 12, 20,
                    List.of("staff", "wand"),
                    "light",
                    null),
            new ClassData("priest", "Priest", "MAGIC",
                    7, 7, 8, 14, 14, 16,
                    List.of("mace", "staff", "wand"),
                    "medium",
                    null)
    );

    // ── Enemies ────────────────────────────────────────────────────────────────

    private static final List<EnemyData> ENEMIES = List.of(
            // ── Group A: attributeSum 11–15 ──
            new EnemyData("goblin",        "Goblin",         "beast",      4,  4,  3,  8,  8,  "low",     11, null, false),
            new EnemyData("ratman",        "Ratman",         "beast",      3,  5,  3,  6, 10,  "low",     11, null, false),
            new EnemyData("zombie",        "Zombie",         "undead",     6,  2,  3, 12,  4,  "low",     11, null, false),
            new EnemyData("cultist",       "Cultist",        "humanoid",   4,  4,  4,  8,  8,  "average", 12, null, false),
            new EnemyData("spiderling",    "Spiderling",     "beast",      4,  6,  3,  8, 12,  "low",     13, null, false),
            new EnemyData("witchling",     "Witchling",      "humanoid",   3,  4,  7,  6,  8,  "average", 14, null, false),
            new EnemyData("dustElemental", "Dust Elemental", "elemental",  5,  5,  5, 10, 10,  "low",     15, null, false),

            // ── Group B: attributeSum 16–20 ──
            new EnemyData("bandit",     "Bandit",      "humanoid",   6,  5,  5, 12, 10,  "average", 16, null, false),
            new EnemyData("skeleton",   "Skeleton",    "undead",     7,  4,  5, 14,  8,  "low",     16, null, false),
            new EnemyData("ooze",       "Ooze",        "beast",      5,  5,  6, 10, 10,  "low",     16, null, false),
            new EnemyData("orcScout",   "Orc Scout",   "humanoid",   7,  6,  4, 14, 12,  "average", 17, null, false),
            new EnemyData("wolfBeast",  "Wolf Beast",  "beast",      6,  8,  4, 12, 16,  "low",     18, null, false),
            new EnemyData("techScout",  "Tech Scout",  "mechanical", 5,  8,  5, 10, 16,  "average", 18, null, false),
            new EnemyData("ghoul",      "Ghoul",       "undead",     7,  6,  6, 14, 12,  "average", 19, null, false),
            new EnemyData("fireMage",   "Fire Mage",   "humanoid",   4,  6, 10,  8, 12,  "high",    20, null, false),

            // ── Group C: attributeSum 21–25 ──
            new EnemyData("armoredArmadillo","Armored Armadillo","beast",  8,  7,  6, 16, 14, "low",     21, null, false),
            new EnemyData("armedSkeleton",   "Armed Skeleton",   "undead", 9,  6,  6, 18, 12, "average", 21, null, false),
            new EnemyData("techSoldier",     "Tech Soldier",  "mechanical",8,  8,  5, 16, 16, "average", 21, null, false),
            new EnemyData("orcWarrior",      "Orc Warrior",   "humanoid", 10,  6,  6, 20, 12, "average", 22, null, false),
            new EnemyData("caveSpider",      "Cave Spider",   "beast",     7, 10,  6, 14, 20, "low",     23, null, false),
            new EnemyData("iceMage",         "Ice Mage",      "humanoid",  5,  8, 10, 10, 16, "high",    23, null, false),
            new EnemyData("wraith",          "Wraith",        "undead",    7,  8,  9, 14, 16, "average", 24, null, false),
            new EnemyData("stormElemental",  "Storm Elemental","elemental", 7,  8, 10, 14, 16, "high",    25, null, false),

            // ── Group D: attributeSum 26–30 ──
            new EnemyData("mercenary",   "Mercenary",    "humanoid",  10,  8,  8, 20, 16, "average", 26, null, false),
            new EnemyData("poisonSpider","Poison Spider","beast",      8, 11,  7, 16, 22, "low",     26, null, false),
            new EnemyData("gearGolem",   "Gear Golem",  "mechanical",12,  7,  7, 24, 14, "average", 26, null, false),
            new EnemyData("orcShaman",   "Orc Shaman",  "humanoid",   8,  8, 11, 16, 16, "high",    27, null, false),
            new EnemyData("lich",        "Lich",        "undead",     7,  9, 12, 14, 18, "high",    28, null, false),
            new EnemyData("fireElemental","Fire Elemental","elemental",10, 8, 10, 20, 16, "average", 28, List.of("fire"), false),
            new EnemyData("ironGuard",   "Iron Guard",  "humanoid",  12,  8,  9, 24, 16, "average", 29, null, false),
            new EnemyData("plagueWolf",  "Plague Wolf", "beast",      9, 12,  9, 18, 24, "low",     30, null, false),

            // ── Group E: attributeSum 31–35 ──
            new EnemyData("warMage",       "War Mage",       "humanoid",   9, 10, 12, 18, 20, "high",    31, null, false),
            new EnemyData("deathKnight",   "Death Knight",   "undead",    13,  9,  9, 26, 18, "average", 31, null, false),
            new EnemyData("steamGolem",    "Steam Golem",    "mechanical",14,  9,  9, 28, 18, "average", 32, null, false),
            new EnemyData("trollBerserker","Troll Berserker","beast",     14,  9, 10, 28, 18, "low",     33, null, false),
            new EnemyData("arcaneWisp",    "Arcane Wisp",    "elemental",  8, 12, 14, 16, 24, "high",    34, null, false),
            new EnemyData("assassin",      "Assassin",       "humanoid",  10, 14, 10, 20, 28, "average", 34, null, false),
            new EnemyData("voidShadow",    "Void Shadow",    "undead",    10, 12, 13, 20, 24, "high",    35, null, false),

            // ── Group F: attributeSum 36–40 ──
            new EnemyData("orcChieftain","Orc Chieftain","humanoid",  14, 11, 11, 28, 22, "high",    36, null, false),
            new EnemyData("razorFang",   "Razor Fang",  "beast",     12, 14, 11, 24, 28, "low",     37, null, false),
            new EnemyData("combatDrone", "Combat Drone","mechanical",13, 13, 12, 26, 26, "average", 38, null, false),
            new EnemyData("banshee",     "Banshee",     "undead",    10, 14, 14, 20, 28, "high",    38, null, false),
            new EnemyData("lavaElemental","Lava Elemental","elemental",14,10, 15, 28, 20, "high",    39, List.of("fire"), false),
            new EnemyData("battlemage",  "Battlemage",  "humanoid",  12, 13, 14, 24, 26, "high",    39, null, false),
            new EnemyData("necromancer", "Necromancer", "humanoid",  10, 14, 16, 20, 28, "high",    40, null, false),

            // ── Group G: attributeSum 41–45 ──
            new EnemyData("dragonKin",    "Dragon Kin",    "beast",      16, 12, 13, 32, 24, "average", 41, null,               false),
            new EnemyData("voidKnight",   "Void Knight",   "undead",     15, 12, 15, 30, 24, "high",    42, null,               false),
            new EnemyData("warAutomaton", "War Automaton", "mechanical", 15, 14, 13, 30, 28, "average", 42, null,               false),
            new EnemyData("thunderBird",  "Thunder Bird",  "beast",      13, 16, 14, 26, 32, "low",     43, List.of("electric"),false),
            new EnemyData("archMage",     "Arch Mage",     "humanoid",   11, 14, 19, 22, 28, "high",    44, null,               false),
            new EnemyData("specterLord",  "Specter Lord",  "undead",     13, 15, 16, 26, 30, "high",    44, null,               false),
            new EnemyData("voidElemental","Void Elemental","elemental",  13, 15, 17, 26, 30, "high",    45, null,               false),

            // ── Group H: attributeSum 46–50 ──
            new EnemyData("eliteGuard",    "Elite Guard",    "humanoid",  17, 15, 14, 34, 30, "high",    46, null,               false),
            new EnemyData("chimera",       "Chimera",        "beast",     17, 15, 15, 34, 30, "low",     47, null,               false),
            new EnemyData("siegeGolem",    "Siege Golem",    "mechanical",20, 13, 14, 40, 26, "average", 47, null,               true),
            new EnemyData("dracolich",     "Dracolich",      "undead",    16, 15, 17, 32, 30, "high",    48, List.of("ice"),     false),
            new EnemyData("stormColossus","Storm Colossus", "elemental", 15, 17, 17, 30, 34, "high",    49, List.of("electric"),false),
            new EnemyData("shadowEmperor","Shadow Emperor", "humanoid",  16, 16, 18, 32, 32, "high",    50, null,               false),
            new EnemyData("abyssalBeast",  "Abyssal Beast",  "beast",     18, 16, 16, 36, 32, "low",     50, null,               false),

            // ── Group I: attributeSum 51–60 ──
            new EnemyData("godWarrior",          "God Warrior",          "humanoid",  20, 17, 16, 40, 34, "high", 53, null,                            false),
            new EnemyData("voidDragon",          "Void Dragon",          "beast",     22, 16, 17, 44, 32, "high", 55, List.of("arcane"),              false),
            new EnemyData("mechDreadnought",     "Mech Dreadnought",     "mechanical",20, 18, 18, 40, 36, "high", 56, null,                            true),
            new EnemyData("eternalLich",         "Eternal Lich",         "undead",    17, 18, 22, 34, 36, "high", 57, null,                            true),
            new EnemyData("primordialElemental", "Primordial Elemental", "elemental", 18, 19, 22, 36, 38, "high", 59, List.of("fire","ice","electric"),false),
            new EnemyData("chaosLord",           "Chaos Lord",           "humanoid",  20, 20, 20, 40, 40, "high", 60, List.of("arcane"),              true)
    );

    // ── Spells ─────────────────────────────────────────────────────────────────

    private static final List<SpellData> SPELLS = List.of(
            // Fire (4)
            new SpellData("ember",      "Ember",      "Fire", "Inflicts burn on one target",                           2, "single", "burn"),
            new SpellData("fireball",   "Fireball",   "Fire", "Hurls a ball of fire at one target",                    3, "single", null),
            new SpellData("inferno",    "Inferno",    "Fire", "Engulfs one target in intense flames",                  7, "single", null),
            new SpellData("flamestorm", "Flamestorm", "Fire", "Erupts fire across all enemies",                        6, "all",    null),

            // Ice (4)
            new SpellData("frostbite",  "Frostbite",  "Ice", "Chills one target, applying frozen",                    2, "single", "frozen"),
            new SpellData("iceShot",    "Ice Shot",   "Ice", "Launches a shard of ice at one target",                 3, "single", null),
            new SpellData("blizzard",   "Blizzard",   "Ice", "Calls down a blizzard upon one target",                 7, "single", null),
            new SpellData("icestorm",   "Icestorm",   "Ice", "Blankets all enemies in freezing ice",                  6, "all",    null),

            // Electric (4)
            new SpellData("staticCharge","Static Charge","Electric","Jolts one target, may stun",                      2, "single", "stun"),
            new SpellData("spark",       "Spark",       "Electric","Fires a bolt of electricity at one target",        3, "single", null),
            new SpellData("thunderbolt", "Thunderbolt", "Electric","Strikes one target with a mighty bolt",            5, "single", null),
            new SpellData("thunderstorm","Thunderstorm","Electric","Calls lightning down on all enemies",              6, "all",    null),

            // Light (5)
            new SpellData("mend",    "Mend",    "Light", "Restores a small amount of HP to one ally",                 3, "ally",   null),
            new SpellData("heal",    "Heal",    "Light", "Restores a moderate amount of HP to one ally",              5, "ally",   null),
            new SpellData("cure",    "Cure",    "Light", "Removes one status effect from an ally",                    2, "ally",   null),
            new SpellData("holyBolt","Holy Bolt","Light","Fires a bolt of holy energy; bonus vs undead",              5, "single", null),
            new SpellData("revive",  "Revive",  "Light", "Revives a fallen ally at 1/4 max HP",                      7, "ally",   null),

            // Arcane (5)
            new SpellData("voidBolt",    "Void Bolt",    "Arcane","Fires a bolt of void energy at one target",        3, "single", null),
            new SpellData("drain",       "Drain",        "Arcane","Deals damage and absorbs HP from one target",      5, "single", null),
            new SpellData("hex",         "Hex",          "Arcane","Curses one target, applying a random debuff",      2, "single", "curse"),
            new SpellData("mindBreak",   "Mind Break",   "Arcane","Deals damage and silences one target",             5, "single", "silence"),
            new SpellData("arcanestorm", "Arcane Storm", "Arcane","Unleashes arcane energy across all enemies",       7, "all",    null)
    );

    // ── Items ──────────────────────────────────────────────────────────────────

    private static final List<ItemData> ITEMS = List.of(
            new ItemData("healingPotion",     "Healing Potion",      "Restores 8 HP to one ally",                             List.of("battle","prep"), null),
            new ItemData("energyPotion",      "Energy Potion",       "Restores 6 EN to one ally",                             List.of("battle","prep"), null),
            new ItemData("reviveScroll",      "Revive Scroll",       "Revives one fallen ally at 1/4 max HP",                 List.of("battle","prep"), null),
            new ItemData("magicSicknessPotion","Magic Sickness Potion","Inflicts poison on one enemy",                        List.of("battle"),        null),
            new ItemData("speedPotion",       "Speed Potion",        "Increases one ally SPD by 4 until end of battle",       List.of("battle","prep"), null),
            new ItemData("regenLifePotion",   "Regen Life Potion",   "One ally regenerates 2 HP per turn for 3 turns",        List.of("battle","prep"), null),
            new ItemData("regenEnergyPotion", "Regen Energy Potion", "One ally regenerates 2 EN per turn for 3 turns",        List.of("battle","prep"), null)
    );

    // ── Status Effects ─────────────────────────────────────────────────────────

    private static final List<StatusEffectData> STATUS_EFFECTS = List.of(
            // Negative (9)
            new StatusEffectData("poison",  "Poison",  "NEGATIVE","Takes INT/4 damage at the start of each turn; lasts 3 turns"),
            new StatusEffectData("burn",    "Burn",    "NEGATIVE","Takes 2 fire damage at the start of each turn; lasts 3 turns"),
            new StatusEffectData("bleed",   "Bleed",   "NEGATIVE","Takes 1 physical damage at the start of each turn; lasts 4 turns"),
            new StatusEffectData("frozen",  "Frozen",  "NEGATIVE","Cannot act for 1 turn; physical attacks remove the effect"),
            new StatusEffectData("stun",    "Stun",    "NEGATIVE","Cannot act for 1 turn"),
            new StatusEffectData("slow",    "Slow",    "NEGATIVE","SPD halved for 2 turns"),
            new StatusEffectData("silence", "Silence", "NEGATIVE","Cannot cast spells for 2 turns"),
            new StatusEffectData("blind",   "Blind",   "NEGATIVE","50% chance to miss physical attacks for 2 turns"),
            new StatusEffectData("curse",   "Curse",   "NEGATIVE","A random negative status effect is applied at the start of each turn; lasts 2 turns"),
            // Positive (3)
            new StatusEffectData("regen",   "Regen",   "POSITIVE","Restores 2 HP at the start of each turn; lasts 3 turns"),
            new StatusEffectData("haste",   "Haste",   "POSITIVE","SPD doubled for 2 turns"),
            new StatusEffectData("shell",   "Shell",   "POSITIVE","Reduces all incoming damage by 2 for 2 turns")
    );

    // ── Startup log ────────────────────────────────────────────────────────────

    @PostConstruct
    public void logStartup() {
        log.info("Game data loaded — {} enemies, {} spells, {} items",
                ENEMIES.size(), SPELLS.size(), ITEMS.size());
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    public GameDataResponse getAllData() {
        return new GameDataResponse(
                CLASSES, WEAPONS, ARMOR_TIERS, ARMOR_QUALITIES,
                MODIFIERS, AUGMENTATIONS, ENEMIES, SPELLS, ITEMS, STATUS_EFFECTS);
    }
}
