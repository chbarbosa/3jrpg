export const SPELL_LIST = [
  { id: 'ember',        label: 'Ember',         school: 'fire',     enCost: 2, targetType: 'single', description: 'Inflicts burn on one target' },
  { id: 'fireball',     label: 'Fireball',      school: 'fire',     enCost: 3, targetType: 'single', description: 'Hurls a ball of fire at one target. 50% chance to inflict Burn.' },
  { id: 'inferno',      label: 'Inferno',       school: 'fire',     enCost: 7, targetType: 'single', description: 'Engulfs one target in intense flames. 50% chance to inflict Burn.' },
  { id: 'flamestorm',   label: 'Flamestorm',    school: 'fire',     enCost: 6, targetType: 'all',    description: 'Erupts fire across all enemies' },

  { id: 'frostbite',    label: 'Frostbite',     school: 'ice',      enCost: 2, targetType: 'single', description: 'Chills one target, applying frozen' },
  { id: 'iceShot',      label: 'Ice Shot',      school: 'ice',      enCost: 3, targetType: 'single', description: 'Launches a shard of ice at one target. 50% chance to inflict Frozen.' },
  { id: 'blizzard',     label: 'Blizzard',      school: 'ice',      enCost: 7, targetType: 'single', description: 'Calls down a blizzard upon one target. 50% chance to inflict Frozen.' },
  { id: 'zero',         label: 'Zero',          school: 'ice',      enCost: 7, targetType: 'single', description: 'Absolute zero ice strike. Devastating single target damage. 50% chance to inflict Frozen.' },
  { id: 'icestorm',     label: 'Icestorm',      school: 'ice',      enCost: 6, targetType: 'all',    description: 'Blankets all enemies in freezing ice' },

  { id: 'staticCharge', label: 'Static Charge', school: 'electric', enCost: 2, targetType: 'single', description: 'Jolts one target, applies Stun. 50% chance to inflict Dizzle.' },
  { id: 'spark',        label: 'Spark',         school: 'electric', enCost: 3, targetType: 'single', description: 'Fires a bolt of electricity at one target. 50% chance to inflict Dizzle.' },
  { id: 'thunderbolt',  label: 'Thunderbolt',   school: 'electric', enCost: 5, targetType: 'single', description: 'Strikes one target with a mighty bolt. 50% chance to inflict Dizzle.' },
  { id: 'zyx',          label: 'Zyx',           school: 'electric', enCost: 7, targetType: 'single', description: 'Maximum voltage discharge. Devastating single target damage. 50% chance to inflict Dizzle.' },
  { id: 'thunderstorm', label: 'Thunderstorm',  school: 'electric', enCost: 6, targetType: 'all',    description: 'Calls lightning down on all enemies' },

  { id: 'mend',         label: 'Mend',          school: 'light',    enCost: 3, targetType: 'ally',   description: 'Restores a small amount of HP to one ally' },
  { id: 'heal',         label: 'Heal',          school: 'light',    enCost: 5, targetType: 'ally',   description: 'Restores a moderate amount of HP to one ally' },
  { id: 'cure',         label: 'Cure',          school: 'light',    enCost: 2, targetType: 'ally',   description: 'Removes one status effect from an ally' },
  { id: 'holyBolt',     label: 'Holy Bolt',     school: 'light',    enCost: 5, targetType: 'single', description: 'Holy bolt; bonus damage vs undead' },
  { id: 'revive',       label: 'Revive',        school: 'light',    enCost: 7, targetType: 'ally',   description: 'Revives a fallen ally at 1/4 max HP' },

  { id: 'voidBolt',     label: 'Void Bolt',     school: 'arcane',   enCost: 3, targetType: 'single', description: 'Fires a bolt of void energy at one target' },
  { id: 'drain',        label: 'Drain',         school: 'arcane',   enCost: 5, targetType: 'single', description: 'Deals damage and absorbs HP from target' },
  { id: 'hex',          label: 'Hex',           school: 'arcane',   enCost: 2, targetType: 'single', description: 'Curses one target with a random debuff' },
  { id: 'mindBreak',    label: 'Mind Break',    school: 'arcane',   enCost: 5, targetType: 'single', description: 'Deals damage and silences one target' },
  { id: 'arcanestorm',  label: 'Arcane Storm',  school: 'arcane',   enCost: 7, targetType: 'all',    description: 'Unleashes arcane energy across all enemies' },
];

export const SCHOOL_COLORS = {
  fire:     '#D2691E',
  ice:      '#87CEEB',
  electric: '#FFD700',
  light:    '#F39C12',
  arcane:   '#8E44AD',
};

export const MAGE_SPECIALIZATIONS = [
  { id: 'fireMage',  label: 'Fire Mage',   school: 'fire',     description: 'All Fire spells plus 3 random Arcane spells.' },
  { id: 'iceMage',   label: 'Ice Mage',    school: 'ice',      description: 'All Ice spells plus 3 random Arcane spells.' },
  { id: 'stormMage', label: 'Storm Mage',  school: 'electric', description: 'All Electric spells plus 3 random Arcane spells.' },
];
